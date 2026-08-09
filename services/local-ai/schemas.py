from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, StrictInt, field_validator, model_validator


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

class ContextModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    @field_validator("*")
    @classmethod
    def list_values_must_be_bounded_strings(cls, value):
        if isinstance(value, list):
            for item in value:
                if not isinstance(item, str) or not item.strip() or len(item) > 2000:
                    raise ValueError("上下文列表项必须是 1 到 2000 个字符的字符串")
        return value


class LessonPlanContext(ContextModel):
    textbook: str = Field(min_length=1, max_length=200)
    chapter: str = Field(min_length=1, max_length=300)
    objective: str = Field(min_length=1, max_length=1000)
    context: str = Field(min_length=1, max_length=4000)
    evidence: list[str] = Field(min_length=1, max_length=30)


class QuizContext(ContextModel):
    title: str = Field(min_length=1, max_length=300)
    topic: str = Field(min_length=1, max_length=500)
    difficulty: str = Field(min_length=1, max_length=100)
    focus: str = Field(min_length=1, max_length=1000)


class RemedialPlanContext(ContextModel):
    knowledgePoint: str = Field(min_length=1, max_length=500)
    step: str = Field(min_length=1, max_length=1000)
    affectedCount: StrictInt = Field(ge=0, le=10000)
    trend: str = Field(min_length=1, max_length=300)
    evidence: list[str] = Field(min_length=1, max_length=30)


class LearningReplyContext(ContextModel):
    topic: str = Field(min_length=1, max_length=500)
    recap: str = Field(min_length=1, max_length=2000)
    question: str = Field(min_length=1, max_length=2000)


class RetellFollowUpContext(ContextModel):
    topic: str = Field(min_length=1, max_length=500)
    retell: str = Field(min_length=1, max_length=3000)


class ParentSummaryContext(ContextModel):
    facts: list[str] = Field(min_length=1, max_length=30)
    teacherMessage: str = Field(min_length=1, max_length=2000)


class StudentInferenceContext(ContextModel):
    facts: list[str] = Field(min_length=1, max_length=30)
    mistakes: list[str] = Field(min_length=1, max_length=30)


class TutoringContext(ContextModel):
    questionText: str = Field(min_length=1, max_length=4000)
    stickingPoint: str = Field(min_length=1, max_length=1000)
    attempt: str = Field(min_length=1, max_length=2000)


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
