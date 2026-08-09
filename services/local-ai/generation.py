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
    ParentSummaryDraft,
    QuizDraft,
    RemedialPlanDraft,
    RetellFollowUpDraft,
    StudentInferenceDraft,
    TutoringDraft,
    LearningReplyDraft,
)


class GenerationValidationError(Exception):
    """The model returned JSON that does not match the requested schema."""


class DeepSeekNotConfiguredError(Exception):
    """No API key is available to make a DeepSeek request."""


class DeepSeekTimeoutError(Exception):
    """The DeepSeek request did not complete within the configured timeout."""


RESPONSE_MODELS: dict[str, type[BaseModel]] = {
    "lesson-plan": LessonPlanDraft,
    "quiz": QuizDraft,
    "remedial-plan": RemedialPlanDraft,
    "learning-reply": LearningReplyDraft,
    "retell-follow-up": RetellFollowUpDraft,
    "parent-summary": ParentSummaryDraft,
    "student-inference": StudentInferenceDraft,
    "tutoring": TutoringDraft,
}


def build_request_body(request: GenerateRequest) -> dict[str, Any]:
    schema = RESPONSE_MODELS[request.kind].model_json_schema()
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
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "task": request.kind,
                        "context": request.context,
                        "required_json_schema": schema,
                    },
                    ensure_ascii=False,
                ),
            },
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "max_tokens": 1200,
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
    raw = call_deepseek(build_request_body(request))
    try:
        return RESPONSE_MODELS[request.kind].model_validate_json(raw).model_dump()
    except (ValidationError, ValueError, TypeError) as error:
        raise GenerationValidationError() from error
