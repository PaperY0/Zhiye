import re
from typing import Any, Literal
from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator


GenerationKind = Literal[
    "lesson-plan",
    "quiz",
    "remedial-plan",
    "learning-reply",
    "retell-follow-up",
    "parent-summary",
    "student-inference",
    "tutoring",
]

IMAGE_FIELD_NAMES = {
    "attachment",
    "base64",
    "binary",
    "file",
    "image",
    "imageurl",
    "photo",
    "photourl",
}
IMAGE_EXTENSIONS = (".avif", ".bmp", ".gif", ".jpeg", ".jpg", ".png", ".webp")
BASE64_PATTERN = re.compile(r"[A-Za-z0-9+/]+={0,2}")


def reject_unsafe_context(value: Any, path: str = "context") -> None:
    if isinstance(value, (bytes, bytearray, memoryview)):
        raise ValueError(f"{path} 不允许二进制内容")
    if isinstance(value, dict):
        for key, nested_value in value.items():
            normalized_key = str(key).lower().replace("-", "").replace("_", "")
            if normalized_key in IMAGE_FIELD_NAMES:
                raise ValueError(f"{path}.{key} 不允许图片或二进制内容")
            reject_unsafe_context(nested_value, f"{path}.{key}")
        return
    if isinstance(value, (list, tuple)):
        for index, nested_value in enumerate(value):
            reject_unsafe_context(nested_value, f"{path}[{index}]")
        return
    if isinstance(value, str):
        compact = "".join(value.split())
        parsed_url = urlparse(value)
        is_image_url = parsed_url.scheme in {"http", "https"} and (
            parsed_url.path.lower().endswith(IMAGE_EXTENSIONS)
            or any(extension in parsed_url.query.lower() for extension in IMAGE_EXTENSIONS)
        )
        is_base64 = len(compact) >= 128 and len(compact) % 4 == 0 and bool(
            BASE64_PATTERN.fullmatch(compact)
        )
        if value.lower().startswith("data:image/") or is_image_url or is_base64:
            raise ValueError(f"{path} 不允许图片、图片 URL 或 base64 内容")
        return
    if value is None or isinstance(value, (bool, int, float)):
        return
    raise ValueError(f"{path} 仅允许 JSON 基础数据")


class GenerateRequest(BaseModel):
    kind: GenerationKind
    context: dict[str, Any]

    @field_validator("context")
    @classmethod
    def context_must_not_contain_images_or_binary(cls, context: dict[str, Any]):
        reject_unsafe_context(context)
        return context


class LessonPlanDraft(BaseModel):
    title: str
    outline: list[str] = Field(min_length=1)
    examples: list[str] = Field(min_length=1)
    misconceptions: list[str] = Field(min_length=1)
    suggestions: list[str] = Field(min_length=1)
    extension: str


class QuizQuestion(BaseModel):
    prompt: str
    options: list[str] = Field(min_length=2)
    answer: str

    @field_validator("answer")
    @classmethod
    def answer_must_be_an_option(cls, answer: str, info):
        options = info.data.get("options", [])
        if answer not in options:
            raise ValueError("选择题答案必须属于选项")
        return answer


class QuizDraft(BaseModel):
    title: str
    questions: list[QuizQuestion] = Field(min_length=3)


class RemedialPlanDraft(BaseModel):
    title: str
    goals: list[str] = Field(min_length=1)
    steps: list[str] = Field(min_length=1)
    examples: list[str] = Field(min_length=1)
    check_for_understanding: str


class LearningReplyDraft(BaseModel):
    explanation: str
    example: str
    card: str
    follow_up: str


class RetellFollowUpDraft(BaseModel):
    feedback: str
    follow_up: str


class ParentSummaryDraft(BaseModel):
    topics: list[str] = Field(min_length=1)
    encouragement: str
    teacher_message: str


class StudentInferenceDraft(BaseModel):
    evidence: list[str] = Field(min_length=1)
    observation: str
    suggested_support: str


class TutoringDraft(BaseModel):
    hint: str
    key_step: str
    explanation: str
    retell_prompt: str
    transfer_question: str
    transfer_options: list[str] = Field(min_length=2)
    transfer_answer: str

    @field_validator("transfer_answer")
    @classmethod
    def transfer_answer_must_be_an_option(cls, answer: str, info):
        options = info.data.get("transfer_options", [])
        if answer not in options:
            raise ValueError("迁移题答案必须属于选项")
        return answer
