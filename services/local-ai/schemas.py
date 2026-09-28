import base64
import binascii
import re
from typing import Annotated, Any, Literal
import unicodedata

from pydantic import (
    AliasChoices,
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
    "task-draft",
    "quiz",
    "remedial-plan",
    "learning-reply",
    "retell-follow-up",
    "parent-summary",
    "student-inference",
    "tutoring",
    "student-companion",
    "task-inquiry",
]

BASE64_PATTERN = re.compile(r"^[A-Za-z0-9+/_-]+={0,2}$")
ASCII_WHITESPACE_PATTERN = re.compile(r"[ \t\r\n\f\v]+")
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
ENCODED_PAYLOAD_MARKERS = "=+/-_"
PNM_BASE64_PREFIXES = ("UDE", "UDI", "UDM", "UDQ", "UDU", "UDY")


def has_disallowed_control_characters(value: str) -> bool:
    return any(
        unicodedata.category(character) == "Cc" and character not in "\t\n\r"
        for character in value
    )


def is_encoded_payload_candidate(value: str) -> bool:
    return bool(BASE64_PATTERN.fullmatch(value)) and (
        any(marker in value for marker in ENCODED_PAYLOAD_MARKERS)
        or len(value) >= 16
        or value.startswith(PNM_BASE64_PREFIXES)
    )


def compact_ascii_whitespace_encoded_candidate(value: str) -> str:
    compacted = ASCII_WHITESPACE_PATTERN.sub("", value)
    if compacted == value:
        return value
    return compacted if is_encoded_payload_candidate(compacted) else value


def decode_base64_candidate(value: str) -> bytes | None:
    if not is_encoded_payload_candidate(value) or len(value) % 4 == 1:
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
    if value[4:8] == b"ftyp" and value[8:12] in {b"avif", b"heic", b"heix"}:
        return True
    if len(value) >= 2 and value[:1] == b"P" and value[1:2] in b"123456":
        return True
    try:
        decoded_text = value.decode("utf-8")
    except UnicodeDecodeError:
        return True
    return contains_svg_or_image_markup(decoded_text)


def reject_non_text_payload(value: str) -> str:
    if has_disallowed_control_characters(value):
        raise ValueError("上下文字段不允许控制字符")
    lowered = value.lower()
    if lowered.startswith(("data:", "http://", "https://")):
        raise ValueError("上下文字段不允许 data URL 或 HTTP(S) URL")
    if contains_svg_or_image_markup(value):
        raise ValueError("上下文字段不允许 SVG/XML 图片标记")
    inspection_value = compact_ascii_whitespace_encoded_candidate(value)
    decoded_candidate = decode_base64_candidate(inspection_value)
    if decoded_candidate is not None and decoded_bytes_are_recognized_image(decoded_candidate):
        raise ValueError("上下文字段不允许图片或二进制 base64 内容")
    return value


TextOnly = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=2000),
    AfterValidator(reject_non_text_payload),
]

OptionalText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, max_length=2000),
    AfterValidator(reject_non_text_payload),
]


class ContextModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, populate_by_name=True)


class LessonPlanContext(ContextModel):
    textbook: TextOnly = Field(max_length=200)
    chapter: TextOnly = Field(max_length=300)
    objective: TextOnly = Field(max_length=1000)
    context: OptionalText = Field(default="", max_length=2000)
    evidence: list[TextOnly] = Field(default_factory=list, max_length=30)
    teachingAid: OptionalText = Field(default="", max_length=1500)


class TaskDraftContext(ContextModel):
    title: TextOnly = Field(max_length=300)
    objective: TextOnly = Field(max_length=1000)
    sourcePlan: TextOnly = Field(max_length=2000)
    learningEvidence: list[TextOnly] = Field(max_length=20)
    taskType: Literal["practice", "review", "reading", "quiz"]


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


class StudentInferenceContext(ContextModel):
    facts: list[TextOnly] = Field(min_length=1, max_length=30)
    mistakes: list[TextOnly] = Field(default_factory=list, max_length=30)


class TutoringContext(ContextModel):
    questionText: TextOnly
    stickingPoint: TextOnly = Field(max_length=1000)
    attempt: TextOnly


class TaskInquiryQuizQuestion(ContextModel):
    prompt: TextOnly = Field(max_length=1000)
    type: Literal["single-choice", "multiple-choice", "true-false", "short-answer"]
    options: list[TextOnly] = Field(default_factory=list, max_length=8)
    answer: TextOnly = Field(max_length=500)
    explanation: OptionalText = Field(default="", max_length=1000)


class TaskInquiryContext(ContextModel):
    taskTitle: TextOnly = Field(max_length=300)
    taskObjective: OptionalText = Field(default="", max_length=1000)
    taskContent: TextOnly
    question: TextOnly = Field(max_length=1000)
    previousExchanges: list[TextOnly] = Field(default_factory=list, max_length=6)
    quizQuestions: list[TaskInquiryQuizQuestion] = Field(default_factory=list, max_length=3)


class StudentCompanionContext(ContextModel):
    message: TextOnly = Field(max_length=1000)
    currentPage: TextOnly = Field(max_length=100)


CONTEXT_MODELS: dict[GenerationKind, type[ContextModel]] = {
    "lesson-plan": LessonPlanContext,
    "task-draft": TaskDraftContext,
    "quiz": QuizContext,
    "remedial-plan": RemedialPlanContext,
    "learning-reply": LearningReplyContext,
    "retell-follow-up": RetellFollowUpContext,
    "parent-summary": ParentSummaryContext,
    "student-inference": StudentInferenceContext,
    "tutoring": TutoringContext,
    "task-inquiry": TaskInquiryContext,
    "student-companion": StudentCompanionContext,
}


class GenerateRequest(BaseModel):
    kind: GenerationKind
    context: dict[str, Any]
    teacherSettings: dict[str, Any] | None = None

    @model_validator(mode="after")
    def context_must_match_generation_kind(self):
        self.context = CONTEXT_MODELS[self.kind].model_validate(self.context).model_dump()
        return self


class LessonAnalysisDraft(BaseModel):
    title: TextOnly = Field(max_length=40)
    chapter: TextOnly | None = Field(default=None, max_length=80)
    recap: TextOnly
    recapTags: list[TextOnly] = Field(min_length=1, max_length=3)
    nextStep: TextOnly
    teacherReport: TextOnly
    progressSuggestion: TextOnly
    evidence: list[TextOnly] = Field(min_length=1, max_length=30)


class EvidenceItem(ContextModel):
    id: str = Field(min_length=1, max_length=100)
    quote: TextOnly = Field(max_length=2000)
    start_seconds: float = Field(
        ge=0, validation_alias=AliasChoices("start_seconds", "startSeconds")
    )
    end_seconds: float = Field(
        ge=0, validation_alias=AliasChoices("end_seconds", "endSeconds")
    )
    source: Literal["transcript", "student-response"]

    @model_validator(mode="after")
    def end_must_follow_start(self):
        if self.end_seconds < self.start_seconds:
            raise ValueError("证据结束时间不能早于开始时间")
        return self


class InferenceItem(ContextModel):
    id: str = Field(min_length=1, max_length=100)
    statement: TextOnly = Field(max_length=1000)
    evidence_ids: list[str] = Field(
        min_length=1,
        max_length=20,
        validation_alias=AliasChoices("evidence_ids", "evidenceIds"),
    )


RecapStepKey = Literal[
    "transcribe",
    "extract-evidence",
    "identify-gaps",
    "generate-deliverables",
    "teacher-review",
]
RecapStepStatus = Literal["pending", "running", "succeeded", "failed", "skipped"]
RecapJobStatus = Literal["queued", "running", "needs-review", "failed"]


class RecapStep(ContextModel):
    key: RecapStepKey
    status: RecapStepStatus
    summary: TextOnly = Field(max_length=500)
    evidence_ids: list[str] = Field(
        default_factory=list,
        max_length=20,
        validation_alias=AliasChoices("evidence_ids", "evidenceIds"),
    )
    error: TextOnly | None = Field(default=None, max_length=500)


class RecapDeliverables(ContextModel):
    student_recap: TextOnly = Field(
        max_length=2000,
        validation_alias=AliasChoices("student_recap", "studentRecap"),
    )
    teacher_report: TextOnly = Field(
        max_length=3000,
        validation_alias=AliasChoices("teacher_report", "teacherReport"),
    )
    remedial_plan: TextOnly = Field(
        max_length=3000,
        validation_alias=AliasChoices("remedial_plan", "remedialPlan"),
    )
    practice_questions: list[TextOnly] = Field(
        min_length=1,
        max_length=10,
        validation_alias=AliasChoices("practice_questions", "practiceQuestions"),
    )
    evidence: list[EvidenceItem] = Field(min_length=1, max_length=30)
    inferences: list[InferenceItem] = Field(default_factory=list, max_length=30)

    @model_validator(mode="after")
    def inferences_must_reference_evidence(self):
        evidence_ids = {item.id for item in self.evidence}
        for inference in self.inferences:
            if not set(inference.evidence_ids).issubset(evidence_ids):
                raise ValueError("inference evidence_ids 必须引用已有课堂证据")
        return self


class RecapJob(ContextModel):
    id: str = Field(min_length=1, max_length=100)
    goal: TextOnly = Field(max_length=1000)
    status: RecapJobStatus
    steps: list[RecapStep] = Field(min_length=5, max_length=5)
    evidence: list[EvidenceItem] = Field(default_factory=list, max_length=30)
    inferences: list[InferenceItem] = Field(default_factory=list, max_length=30)
    deliverables: RecapDeliverables | None = None

    @model_validator(mode="after")
    def steps_must_follow_plan(self):
        expected = [
            "transcribe",
            "extract-evidence",
            "identify-gaps",
            "generate-deliverables",
            "teacher-review",
        ]
        actual = [step.key for step in self.steps]
        if actual != expected:
            raise ValueError("RecapJob 必须按固定顺序包含五个步骤")
        return self


class LessonPlanDraft(BaseModel):
    title: str
    outline: list[str] = Field(min_length=1)
    examples: list[str] = Field(min_length=1)
    misconceptions: list[str] = Field(min_length=1)
    suggestions: list[str] = Field(min_length=1)
    extension: str


class TaskDraft(BaseModel):
    title: str = Field(min_length=1)
    objective: str = Field(min_length=1)
    successCriteria: str = Field(min_length=1, validation_alias=AliasChoices("successCriteria", "success_criteria"))
    content: str = Field(min_length=1)
    supportNote: str = Field(default="", validation_alias=AliasChoices("supportNote", "support_note"))


class QuizQuestion(BaseModel):
    prompt: str = Field(min_length=1)
    type: Literal["single-choice", "true-false"] = "single-choice"
    options: list[str] = Field(min_length=2)
    answer: str

    @model_validator(mode="before")
    @classmethod
    def normalize_judgment(cls, value):
        if not isinstance(value, dict):
            return value
        value = value.copy()
        options = value.get("options")
        answer = value.get("answer")
        truth = {"对": "正确", "错": "错误", "是": "正确", "否": "错误", "true": "正确", "false": "错误", True: "正确", False: "错误"}
        if value.get("type") in ("judgment", "判断题", "true_false", "true-false") or options in (["正确", "错误"], ["对", "错"]):
            value["type"] = "true-false"
            value["options"] = ["正确", "错误"]
            value["answer"] = truth.get(answer, answer)
        return value

    @field_validator("answer")
    @classmethod
    def answer_must_be_an_option(cls, answer: str, info):
        options = info.data.get("options", [])
        if answer not in options:
            raise ValueError("选择题答案必须属于选项")
        return answer


class QuizDraft(BaseModel):
    title: str = Field(min_length=1)
    questions: list[QuizQuestion] = Field(min_length=3, max_length=3)


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
    model_config = ConfigDict(populate_by_name=True)
    topics: list[str] = Field(min_length=1)
    encouragement: str
    teacher_message: str = Field(validation_alias=AliasChoices("teacher_message", "teacherMessage"))


class StudentInferenceDraft(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    evidence: list[str] = Field(min_length=1)
    observation: str
    suggested_support: str = Field(validation_alias=AliasChoices("suggested_support", "suggestedSupport"))


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


class TaskInquiryDraft(ContextModel):
    answer: TextOnly = Field(max_length=1200)
    focus: TextOnly = Field(max_length=120)
    reviewTip: TextOnly = Field(max_length=500, validation_alias=AliasChoices("reviewTip", "review_tip"))


class StudentCompanionDraft(BaseModel):
    reply: TextOnly = Field(max_length=1200)
    pinyin: TextOnly = Field(max_length=2400)
    action: Literal[
        "none",
        "go-tutoring",
        "go-learning",
        "go-mistakes",
        "go-tasks",
        "go-messages",
    ] = "none"
    actionLabel: TextOnly | None = Field(default=None, max_length=100)
    actionPinyin: TextOnly | None = Field(default=None, max_length=200)
    instructions: TextOnly | None = Field(default=None, max_length=800)
    instructionsPinyin: TextOnly | None = Field(default=None, max_length=1600)
