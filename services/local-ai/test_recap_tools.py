import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).parent))

import recap_tools
import server
from recap_tools import (
    extract_evidence,
    generate_deliverables,
    identify_learning_gaps,
    transcribe_audio,
)
from schemas import EvidenceItem, RecapDeliverables


def sample_transcript() -> list[EvidenceItem]:
    return [
        EvidenceItem(
            id="transcript-01",
            quote="分子和分母要同时乘同一个不为零的数。",
            start_seconds=85,
            end_seconds=112,
            source="transcript",
        ),
        EvidenceItem(
            id="transcript-02",
            quote="如果只把分子乘二，分数是不是也一样？",
            start_seconds=952,
            end_seconds=978,
            source="transcript",
        ),
    ]


def test_transcribe_audio_returns_evidence_schema(monkeypatch, tmp_path):
    class FakeModel:
        def generate(self, **_kwargs):
            return [{"text": "分子和分母要同时乘同一个不为零的数。"}]

    monkeypatch.setattr(recap_tools, "_load_asr_model", lambda: FakeModel())
    result = transcribe_audio(str(tmp_path / "lesson.webm"))

    assert len(result) == 1
    assert result[0].quote.startswith("分子和分母")
    assert result[0].source == "transcript"


def test_recap_tools_return_structured_outputs():
    transcript = sample_transcript()
    evidence = extract_evidence(transcript)
    gaps = identify_learning_gaps("为明天准备 5 分钟补讲", evidence)
    deliverables = generate_deliverables("为明天准备 5 分钟补讲", evidence, gaps)

    assert all(isinstance(item, EvidenceItem) for item in evidence)
    assert all(gap.evidence_ids for gap in gaps)
    assert isinstance(deliverables, RecapDeliverables)
    assert deliverables.student_recap
    assert deliverables.teacher_report
    assert deliverables.remedial_plan
    assert deliverables.practice_questions
    assert {item.id for item in deliverables.evidence} == {
        "transcript-01",
        "transcript-02",
    }


def test_generate_deliverables_rejects_unreferenced_gap():
    with pytest.raises(ValidationError, match="已有课堂证据"):
        generate_deliverables(
            "补讲",
            sample_transcript(),
            [
                {
                    "id": "inference-01",
                    "statement": "需要补讲单位换算",
                    "evidence_ids": ["not-in-transcript"],
                }
            ],
        )


def test_recap_jobs_endpoint_supports_fixed_transcript_without_model_key():
    client = TestClient(server.app)
    response = client.post(
        "/recap-jobs",
        data={
            "goal": "为明天准备 5 分钟补讲",
            "transcript": "分子和分母要同时乘同一个不为零的数。\n如果只把分子乘二，分数是不是也一样？",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "needs-review"
    assert [step["key"] for step in payload["steps"]] == [
        "transcribe",
        "extract-evidence",
        "identify-gaps",
        "generate-deliverables",
        "teacher-review",
    ]
    assert set(payload["deliverables"]) == {
        "student_recap",
        "teacher_report",
        "remedial_plan",
        "practice_questions",
        "evidence",
        "inferences",
    }
