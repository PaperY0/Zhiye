import json
import os
import socket
import urllib.error
import urllib.request
from typing import Any

from pydantic import BaseModel, ValidationError

from schemas import (
    GenerateRequest,
    LessonPlanDraft,
    TaskDraft,
    ParentSummaryDraft,
    QuizDraft,
    RemedialPlanDraft,
    RetellFollowUpDraft,
    StudentInferenceDraft,
    TutoringDraft,
    LearningReplyDraft,
    StudentCompanionDraft,
)


class GenerationValidationError(Exception):
    """The model returned JSON that does not match the requested schema."""


class DeepSeekNotConfiguredError(Exception):
    """No API key is available to make a DeepSeek request."""


class DeepSeekTimeoutError(Exception):
    """The DeepSeek request did not complete within the configured timeout."""


RESPONSE_MODELS: dict[str, type[BaseModel]] = {
    "lesson-plan": LessonPlanDraft,
    "task-draft": TaskDraft,
    "quiz": QuizDraft,
    "remedial-plan": RemedialPlanDraft,
    "learning-reply": LearningReplyDraft,
    "retell-follow-up": RetellFollowUpDraft,
    "parent-summary": ParentSummaryDraft,
    "student-inference": StudentInferenceDraft,
    "tutoring": TutoringDraft,
    "student-companion": StudentCompanionDraft,
}


def build_request_body(request: GenerateRequest) -> dict[str, Any]:
    schema = RESPONSE_MODELS[request.kind].model_json_schema()
    task_instruction = (
        "当 task 为 task-draft 时，必须输出 title、objective、successCriteria、"
        "content、supportNote 五个字段，均为字符串；content 是可直接交给学生的任务说明，"
        "successCriteria 是可观察的完成标准。不要把文字字段写成数组或嵌套对象。"
        if request.kind == "task-draft" else ""
    )
    return {
        "model": os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash"),
        "messages": [
            {
                "role": "system",
                "content": (
                    "你是知野的教学草稿助手。仅返回一个有效 JSON 对象，不要使用 Markdown。"
                    "只可依据用户提供的 context；不得编造课堂事实、学生表现、学习结论或学生标签。"
                    "不得进行人格推断或诊断，包括 student-inference 任务；只能整理已提供的可审核事实。"
                    "结果仅供教师或学生审核，不得替代人工判断。"
                    "当 task 为 student-companion 时，reply 与 pinyin 必须逐句对应；"
                    "action 只能使用 schema 中的值，不要输出 URL；如果无法判断页面就使用 none。"
                    + task_instruction
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "task": request.kind,
                        "context": request.context,
                        "teacher_preferences": request.teacherSettings,
                        "required_json_schema": schema,
                    },
                    ensure_ascii=False,
                ),
            },
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "max_tokens": 3200 if request.kind == "lesson-plan" else 2000 if request.kind == "task-draft" else 1200,
    }


def call_deepseek(request_body: dict[str, Any]) -> str:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise DeepSeekNotConfiguredError()

    request = urllib.request.Request(
        "https://api.deepseek.com/chat/completions",
        data=json.dumps(request_body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            payload = json.loads(response.read().decode("utf-8"))
            content = payload["choices"][0]["message"]["content"]
            if not isinstance(content, str):
                raise TypeError("DeepSeek message content must be a string")
            return content
    except (TimeoutError, socket.timeout) as error:
        raise DeepSeekTimeoutError() from error
    except urllib.error.URLError as error:
        if isinstance(error.reason, (TimeoutError, socket.timeout)):
            raise DeepSeekTimeoutError() from error
        raise
    except (json.JSONDecodeError, UnicodeDecodeError, KeyError, IndexError, TypeError) as error:
        raise GenerationValidationError() from error


def generate_draft(request: GenerateRequest) -> dict[str, Any]:
    body = build_request_body(request)
    raw = call_deepseek(body)
    try:
        return RESPONSE_MODELS[request.kind].model_validate_json(raw).model_dump()
    except (ValidationError, ValueError, TypeError) as error:
        if request.kind not in ("lesson-plan", "task-draft"):
            raise GenerationValidationError() from error
        # Retry a truncated or incomplete draft once using the same approved context.
        retry_body = build_request_body(request)
        retry_body["messages"][0]["content"] += (
            "备课任务必须返回 title、outline、examples、misconceptions、"
            "suggestions、extension 六个字段；四个列表各至少一条，"
            "每条简短具体。只返回完整 JSON，不得省略字段。"
            if request.kind == "lesson-plan" else
            "任务草稿必须返回 title、objective、successCriteria、content、"
            "supportNote 五个字符串字段；如果没有支持提示，supportNote 填空字符串。"
            "只返回完整 JSON，不得省略字段。"
        )
        retry_body["temperature"] = 0
        try:
            return RESPONSE_MODELS[request.kind].model_validate_json(
                call_deepseek(retry_body)
            ).model_dump()
        except (ValidationError, ValueError, TypeError) as retry_error:
            raise GenerationValidationError() from retry_error
