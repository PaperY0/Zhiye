from typing import Any, Literal

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


class GenerateRequest(BaseModel):
    kind: GenerationKind
    context: dict[str, Any]


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
