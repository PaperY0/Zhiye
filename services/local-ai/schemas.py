import base64
import binascii
import re
from typing import Annotated, Any, Literal
import unicodedata

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    Field,
    StrictInt,
    StringConstraints,
    field_validator,
    model_validator,
)


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

BASE64_PATTERN = re.compile(r"^[A-Za-z0-9+/_-]+={0,2}$")
IMAGE_SIGNATURES = (
    b"\x89PNG\r\n\x1a\n",
    b"\xff\xd8\xff",
    b"GIF87a",
    b"GIF89a",
    b"BM",
    b"II*\x00",
    b"MM\x00*",
    b"\x00\x00\x01\x00",
    b"\x00\x00\x02\x00",
    b"%PDF-",
)


def has_disallowed_control_characters(value: str) -> bool:
    return any(
        unicodedata.category(character) == "Cc" and character not in "\t\n\r"
        for character in value
    )


def decode_base64_candidate(value: str) -> bytes | None:
    if not BASE64_PATTERN.fullmatch(value) or len(value) % 4 == 1:
        return None
    padded = value + ("=" * (-len(value) % 4))
    try:
        if "-" in value or "_" in value:
            return base64.urlsafe_b64decode(padded)
        return base64.b64decode(padded, validate=True)
    except (binascii.Error, ValueError):
        return None


def contains_svg_or_image_markup(value: str) -> bool:
    normalized = value.lower()
    return (
        "<svg" in normalized
        or "<image" in normalized
        or ("<?xml" in normalized and "http://www.w3.org/2000/svg" in normalized)
    )


def decoded_bytes_are_recognized_image(value: bytes) -> bool:
    if value.startswith(IMAGE_SIGNATURES):
        return True
    if value.startswith(b"RIFF") and value[8:12] == b"WEBP":
        return True
    if len(value) >= 2 and value[:1] == b"P" and value[1:2] in b"123456":
        return True
    try:
        decoded_text = value.decode("utf-8")
    except UnicodeDecodeError:
        return False
    return contains_svg_or_image_markup(decoded_text)


def reject_non_text_payload(value: str) -> str:
    if has_disallowed_control_characters(value):
        raise ValueError("上下文字段不允许控制字符")
    lowered = value.lower()
    if lowered.startswith(("data:", "http://", "https://")):
        raise ValueError("上下文字段不允许 data URL 或 HTTP(S) URL")
    if contains_svg_or_image_markup(value):
        raise ValueError("上下文字段不允许 SVG/XML 图片标记")
    decoded_candidate = decode_base64_candidate(value)
    if decoded_candidate is not None and decoded_bytes_are_recognized_image(decoded_candidate):
        raise ValueError("上下文字段不允许图片或二进制 base64 内容")
    return value


TextOnly = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=2000),
    AfterValidator(reject_non_text_payload),
]


class ContextModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class LessonPlanContext(ContextModel):
    textbook: TextOnly = Field(max_length=200)
    chapter: TextOnly = Field(max_length=300)
    objective: TextOnly = Field(max_length=1000)
    context: TextOnly = Field(max_length=2000)
    evidence: list[TextOnly] = Field(min_length=1, max_length=30)


class QuizContext(ContextModel):
    title: TextOnly = Field(max_length=300)
    topic: TextOnly = Field(max_length=500)
    difficulty: TextOnly = Field(max_length=100)
    focus: TextOnly = Field(max_length=1000)


class RemedialPlanContext(ContextModel):
    knowledgePoint: TextOnly = Field(max_length=500)
    step: TextOnly = Field(max_length=1000)
    affectedCount: StrictInt = Field(ge=0, le=10000)
    trend: TextOnly = Field(max_length=300)
    evidence: list[TextOnly] = Field(min_length=1, max_length=30)


class LearningReplyContext(ContextModel):
    topic: TextOnly = Field(max_length=500)
    recap: TextOnly
    question: TextOnly


class RetellFollowUpContext(ContextModel):
    topic: TextOnly = Field(max_length=500)
    retell: TextOnly


class ParentSummaryContext(ContextModel):
    facts: list[TextOnly] = Field(min_length=1, max_length=30)
    teacherMessage: TextOnly


class StudentInferenceContext(ContextModel):
    facts: list[TextOnly] = Field(min_length=1, max_length=30)
    mistakes: list[TextOnly] = Field(min_length=1, max_length=30)


class TutoringContext(ContextModel):
    questionText: TextOnly
    stickingPoint: TextOnly = Field(max_length=1000)
    attempt: TextOnly


CONTEXT_MODELS: dict[GenerationKind, type[ContextModel]] = {
    "lesson-plan": LessonPlanContext,
    "quiz": QuizContext,
    "remedial-plan": RemedialPlanContext,
    "learning-reply": LearningReplyContext,
    "retell-follow-up": RetellFollowUpContext,
    "parent-summary": ParentSummaryContext,
    "student-inference": StudentInferenceContext,
    "tutoring": TutoringContext,
}


class GenerateRequest(BaseModel):
    kind: GenerationKind
    context: dict[str, Any]

    @model_validator(mode="after")
    def context_must_match_generation_kind(self):
        self.context = CONTEXT_MODELS[self.kind].model_validate(self.context).model_dump()
        return self


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
