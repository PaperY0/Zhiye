import base64

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
