import base64
import json
import urllib.error

import pytest
import importlib
import sys
import types
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

import generation
from generation import (
    GenerationValidationError,
    build_request_body,
    call_deepseek,
    generate_draft,
)
from schemas import GenerateRequest, QuizDraft


def test_quiz_rejects_less_than_three_questions():
    with pytest.raises(ValidationError):
        QuizDraft.model_validate(
            {"title": "测验", "questions": [{"prompt": "只有一题"}]}
        )


def test_task_draft_uses_a_validated_context_and_response(monkeypatch):
    request = GenerateRequest(kind="task-draft", context={
        "title": "分数练习", "objective": "解释分数", "sourcePlan": "先画图",
        "learningEvidence": ["通分有困难"], "taskType": "practice",
    })
    monkeypatch.setattr(generation, "call_deepseek", lambda _: json.dumps({
        "title": "分数练习", "objective": "解释分数", "successCriteria": "完成两题",
        "content": "先画图再计算", "supportNote": "可看示例",
    }, ensure_ascii=False))
    assert generate_draft(request)["successCriteria"] == "完成两题"


def test_task_draft_retries_incomplete_output_and_preserves_camel_case(monkeypatch):
    request = GenerateRequest(kind="task-draft", context={
        "title": "分数练习", "objective": "解释分数", "sourcePlan": "先画图",
        "learningEvidence": [], "taskType": "practice",
    })
    calls = []

    def fake_call(body):
        calls.append(body)
        if len(calls) == 1:
            return '{"title":"分数练习","objective":"解释分数"}'
        return json.dumps({
            "title": "分数练习", "objective": "解释分数",
            "success_criteria": "画图并解释", "content": "先画图，再用一句话解释",
            "support_note": "可以用分数条",
        }, ensure_ascii=False)

    monkeypatch.setattr(generation, "call_deepseek", fake_call)
    result = generate_draft(request)
    assert result["successCriteria"] == "画图并解释"
    assert result["supportNote"] == "可以用分数条"
    assert len(calls) == 2
    assert calls[0]["max_tokens"] == 2000
    assert calls[1]["temperature"] == 0
    assert "content 是可直接交给学生的任务说明" in calls[0]["messages"][0]["content"]


def test_lesson_plan_retries_a_truncated_response_once(monkeypatch):
    request = GenerateRequest(kind="lesson-plan", context={
        "textbook": "人教版数学五年级", "chapter": "小数乘法",
        "objective": "解释算理", "context": "购物", "evidence": ["本次不使用课堂证据"],
        "teachingAid": "先估算再计算",
    })
    calls = []
    valid = {"title": "小数乘法", "outline": ["操作"], "examples": ["购物"],
             "misconceptions": ["小数点位置"], "suggestions": ["估算"], "extension": "自检"}

    def fake_call(body):
        calls.append(body)
        return '{"title":"未完成"' if len(calls) == 1 else json.dumps(valid, ensure_ascii=False)

    monkeypatch.setattr(generation, "call_deepseek", fake_call)
    assert generate_draft(request)["title"] == "小数乘法"
    assert len(calls) == 2
    assert calls[0]["max_tokens"] == 3200
    assert calls[1]["temperature"] == 0
    assert "teachingAid" in calls[1]["messages"][1]["content"]


def test_unexpected_model_json_is_rejected(monkeypatch):
    monkeypatch.setattr(generation, "call_deepseek", lambda _: '{"unsafe": true}')

    with pytest.raises(GenerationValidationError):
        generate_draft(
            GenerateRequest(
                kind="learning-reply",
                context={"topic": "单位换算", "recap": "大变小乘", "question": "为什么"},
            )
        )


@pytest.mark.parametrize(
    "context",
    [
        {"imageUrl": "https://example.com/lesson.png"},
        {"nested": {"image": "data:image/png;base64,aW1hZ2U="}},
        {"note": "QUJD" * 40},
    ],
)
def test_generate_request_rejects_image_like_context(context):
    with pytest.raises(ValidationError):
        GenerateRequest(kind="tutoring", context=context)


def test_generate_request_bounds_allowlisted_list_values():
    with pytest.raises(ValidationError):
        GenerateRequest(
            kind="parent-summary",
            context={"facts": ["x" * 2001], "teacherMessage": "请完成自检"},
        )


def test_parent_summary_accepts_only_approved_facts_context():
    request = GenerateRequest(
        kind="parent-summary",
        context={"facts": ["本周主动提问 4 次", "课堂证据：完成单位换算练习"]},
    )

    assert request.context["facts"] == ["本周主动提问 4 次", "课堂证据：完成单位换算练习"]


@pytest.mark.parametrize(
    "question_text",
    [
        "data:text/plain,small-payload",
        "https://example.com/image.png",
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ",
    ],
)
def test_allowlisted_text_field_rejects_opaque_payload_before_request_body(question_text):
    with pytest.raises(ValidationError):
        GenerateRequest(
            kind="tutoring",
            context={
                "questionText": question_text,
                "stickingPoint": "通分",
                "attempt": "先找公分母",
            },
        )


@pytest.mark.parametrize("question_text", ["UDEKMSAxCjAK", "题目\u0001包含控制字符"])
def test_allowlisted_text_field_rejects_binary_payloads_and_control_characters(question_text):
    with pytest.raises(ValidationError):
        GenerateRequest(
            kind="tutoring",
            context={
                "questionText": question_text,
                "stickingPoint": "通分",
                "attempt": "先找公分母",
            },
        )


@pytest.mark.parametrize(
    "question_text",
    [
        "////",
        "/wAB",
        base64.b64encode(b"\x00\x00\x00\x18ftypavif").decode(),
        base64.b64encode(b"\x00\x00\x00\x18ftypheic").decode(),
        base64.b64encode(b"\x00\x00\x00\x18ftypheix").decode(),
    ],
)
def test_allowlisted_text_field_rejects_marked_encoded_binary_payloads(question_text):
    with pytest.raises(ValidationError):
        GenerateRequest(
            kind="tutoring",
            context={
                "questionText": question_text,
                "stickingPoint": "通分",
                "attempt": "先找公分母",
            },
        )


@pytest.mark.parametrize(
    "question_text",
    [
        "fractions",
        "math",
        "test",
        "2/3 > 1/2",
        "比较二分之三和五分之三",
        "Compare the fractions before choosing an answer",
    ],
)
def test_allowlisted_text_field_preserves_normal_learning_text(question_text):
    request = GenerateRequest(
        kind="tutoring",
        context={
            "questionText": question_text,
            "stickingPoint": "通分",
            "attempt": "先找公分母",
        },
    )

    assert request.context["questionText"] == question_text


@pytest.mark.parametrize(
    "question_text",
    [
        '<svg xmlns="http://www.w3.org/2000/svg"/>',
        '<?xml version="1.0"?><root xmlns="http://www.w3.org/2000/svg"/>',
        "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4",
    ],
)
def test_allowlisted_text_field_rejects_raw_and_base64_svg_markup(question_text):
    with pytest.raises(ValidationError):
        GenerateRequest(
            kind="tutoring",
            context={
                "questionText": question_text,
                "stickingPoint": "通分",
                "attempt": "先找公分母",
            },
        )


@pytest.mark.parametrize(
    "question_text",
    [
        "\n".join(
            [
                base64.b64encode(b"\x89PNG\r\n\x1a\n").decode()[:8],
                base64.b64encode(b"\x89PNG\r\n\x1a\n").decode()[8:],
            ]
        ),
        " ".join(
            [
                base64.b64encode(b"\x00\x00\x00\x18ftypavif").decode()[:8],
                base64.b64encode(b"\x00\x00\x00\x18ftypavif").decode()[8:],
            ]
        ),
        "\n".join(
            [
                base64.b64encode(b"\x89PNG\r\n\x1a\n").decode()[:5],
                base64.b64encode(b"\x89PNG\r\n\x1a\n").decode()[5:],
            ]
        ),
        " ".join(
            [
                base64.b64encode(b"\x00\x00\x00\x18ftypavif").decode()[:5],
                base64.b64encode(b"\x00\x00\x00\x18ftypavif").decode()[5:],
            ]
        ),
        "\n".join(
            [
                base64.b64encode(b"\x89PNG\r\n\x1a\n").decode()[:1],
                base64.b64encode(b"\x89PNG\r\n\x1a\n").decode()[1:],
            ]
        ),
        " ".join(
            [
                base64.b64encode(b"\x00\x00\x00\x18ftypavif").decode()[:1],
                base64.b64encode(b"\x00\x00\x00\x18ftypavif").decode()[1:],
            ]
        ),
    ],
)
def test_allowlisted_text_field_rejects_ascii_whitespace_wrapped_image_base64(question_text):
    with pytest.raises(ValidationError):
        GenerateRequest(
            kind="tutoring",
            context={
                "questionText": question_text,
                "stickingPoint": "通分",
                "attempt": "先找公分母",
            },
        )


def test_system_policy_forbids_personality_inference_and_diagnosis():
    request_body = build_request_body(
        GenerateRequest(
            kind="student-inference",
            context={"facts": ["完成练习"], "mistakes": ["单位方向混淆"]},
        )
    )
    policy = request_body["messages"][0]["content"]

    assert "人格推断" in policy
    assert "诊断" in policy
    assert "student-inference" in policy


class FakeDeepSeekResponse:
    def __init__(self, body: bytes):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self):
        return self.body


def load_server(monkeypatch):
    fake_funasr = types.ModuleType("funasr")
    fake_funasr.AutoModel = object
    monkeypatch.setitem(sys.modules, "funasr", fake_funasr)
    sys.modules.pop("server", None)
    return importlib.import_module("server")


@pytest.mark.parametrize(
    "body",
    [
        b"not-json",
        b'{"choices": []}',
        b'{"choices": [{"message": {}}]}',
    ],
)
def test_malformed_upstream_envelope_is_rejected(monkeypatch, body):
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")
    monkeypatch.setattr(
        generation.urllib.request,
        "urlopen",
        lambda *args, **kwargs: FakeDeepSeekResponse(body),
    )

    with pytest.raises(GenerationValidationError):
        call_deepseek({"model": "test"})


def test_generate_maps_generation_validation_to_502(monkeypatch):
    server = load_server(monkeypatch)

    monkeypatch.setattr(
        server,
        "generate_draft",
        lambda request: (_ for _ in ()).throw(GenerationValidationError()),
    )

    with pytest.raises(HTTPException) as error:
        server.generate(
            GenerateRequest(
                kind="learning-reply",
                context={"topic": "单位换算", "recap": "大变小乘", "question": "为什么"},
            )
        )

    assert error.value.status_code == 502
    assert error.value.detail == "模型返回格式无效，请重试"


def test_generate_rejects_unknown_key_with_unpadded_urlsafe_image_payload(monkeypatch):
    server = load_server(monkeypatch)
    client = TestClient(server.app)
    original_image_payload = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ"

    response = client.post(
        "/generate",
        json={
            "kind": "tutoring",
            "context": {
                "questionText": "比较 2/3 和 3/5",
                "stickingPoint": "通分",
                "attempt": "先找公分母",
                "notes": original_image_payload,
            },
        },
    )

    assert response.status_code == 422


def test_analyze_keeps_teacher_fields_returned_by_the_model(monkeypatch):
    server = load_server(monkeypatch)
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")
    model_result = {
        "title": "单位换算中的乘除方向",
        "chapter": "单位换算",
        "recap": "先判断单位变化方向。",
        "recapTags": ["单位换算"],
        "nextStep": "完成随堂自检",
        "teacherReport": "学生在乘除方向上需要更多示范。",
        "progressSuggestion": "下节课先复盘单位阶梯。",
        "evidence": ["课堂中有两次关于乘除方向的提问。"],
    }
    upstream = {"choices": [{"message": {"content": json.dumps(model_result)}}]}
    monkeypatch.setattr(
        server.urllib.request,
        "urlopen",
        lambda *args, **kwargs: FakeDeepSeekResponse(json.dumps(upstream).encode()),
    )

    assert server.generate_with_deepseek("单位换算课堂") == model_result


def test_analyze_rejects_model_result_missing_teacher_fields(monkeypatch):
    server = load_server(monkeypatch)
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")
    incomplete = {
        "recap": "先判断单位变化方向。",
        "recapTags": ["单位换算"],
        "nextStep": "完成随堂自检",
    }
    upstream = {"choices": [{"message": {"content": json.dumps(incomplete)}}]}
    monkeypatch.setattr(
        server.urllib.request,
        "urlopen",
        lambda *args, **kwargs: FakeDeepSeekResponse(json.dumps(upstream).encode()),
    )

    with pytest.raises(HTTPException) as error:
        server.generate_with_deepseek("单位换算课堂")

    assert error.value.status_code == 502


def test_analyze_maps_upstream_failure_to_502(monkeypatch):
    server = load_server(monkeypatch)
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")
    monkeypatch.setattr(
        server.urllib.request,
        "urlopen",
        lambda *args, **kwargs: (_ for _ in ()).throw(urllib.error.URLError("offline")),
    )

    with pytest.raises(HTTPException) as error:
        server.generate_with_deepseek("单位换算课堂")

    assert error.value.status_code == 502


def test_generate_with_deepseek_requires_api_key(monkeypatch):
    server = load_server(monkeypatch)
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)

    with pytest.raises(HTTPException) as error:
        server.generate_with_deepseek("单位换算课堂")

    assert error.value.status_code == 503
    assert error.value.detail == "未设置 DEEPSEEK_API_KEY"


def test_analyze_returns_empty_transcript_error_without_calling_model(monkeypatch):
    server = load_server(monkeypatch)
    client = TestClient(server.app)
    monkeypatch.setattr(
        server,
        "transcribe",
        lambda _: (_ for _ in ()).throw(HTTPException(status_code=422, detail="没有识别到清晰的人声")),
    )
    monkeypatch.setattr(
        server,
        "generate_with_deepseek",
        lambda _: (_ for _ in ()).throw(AssertionError("空转写不应调用模型")),
    )

    response = client.post("/analyze", files={"audio": ("lesson.webm", b"audio")})

    assert response.status_code == 422
    assert response.json()["detail"] == "没有识别到清晰的人声"


def test_analyze_response_contains_the_model_teacher_fields(monkeypatch):
    server = load_server(monkeypatch)
    client = TestClient(server.app)
    generated = {
        "title": "单位换算中的乘除方向",
        "chapter": "单位换算",
        "recap": "先判断单位变化方向。",
        "recapTags": ["单位换算"],
        "nextStep": "完成随堂自检",
        "teacherReport": "学生在乘除方向上需要更多示范。",
        "progressSuggestion": "下节课先复盘单位阶梯。",
        "evidence": ["课堂中有两次关于乘除方向的提问。"],
    }
    monkeypatch.setattr(server, "transcribe", lambda _: "单位换算课堂")
    monkeypatch.setattr(server, "generate_with_deepseek", lambda *_: generated)

    response = client.post("/analyze", files={"audio": ("lesson.webm", b"audio")})

    assert response.status_code == 200
    assert response.json()["title"] == generated["title"]
    assert response.json()["chapter"] == generated["chapter"]
    assert response.json()["teacherReport"] == generated["teacherReport"]
    assert response.json()["progressSuggestion"] == generated["progressSuggestion"]
    assert response.json()["evidence"] == generated["evidence"]


def test_analyze_route_rejects_incomplete_generated_result(monkeypatch):
    server = load_server(monkeypatch)
    client = TestClient(server.app)
    monkeypatch.setattr(server, "transcribe", lambda _: "单位换算课堂")
    monkeypatch.setattr(
        server,
        "generate_with_deepseek",
        lambda *_: {"recap": "复习卡", "recapTags": ["单位换算"], "nextStep": "补讲"},
    )

    response = client.post("/analyze", files={"audio": ("lesson.webm", b"audio")})

    assert response.status_code == 502
