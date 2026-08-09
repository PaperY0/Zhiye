import pytest
from pydantic import ValidationError

import generation
from generation import GenerationValidationError, generate_draft
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
            GenerateRequest(kind="learning-reply", context={"question": "为什么"})
        )
