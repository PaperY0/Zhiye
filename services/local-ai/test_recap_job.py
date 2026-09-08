import pytest
from pydantic import ValidationError

from schemas import (
    EvidenceItem,
    RecapDeliverables,
    RecapJob,
    RecapStep,
)


def valid_evidence() -> EvidenceItem:
    return EvidenceItem(
        id="evidence-01",
        quote="分子和分母要同时乘同一个不为零的数。",
        start_seconds=85,
        end_seconds=112,
        source="transcript",
    )


def valid_deliverables() -> RecapDeliverables:
    evidence = valid_evidence()
    return RecapDeliverables(
        student_recap="分子和分母同时变化，分数大小不变。",
        teacher_report="学生能够复述核心规则。",
        remedial_plan="用 5 分钟补充不为零条件。",
        practice_questions=["3/5 同时乘 2 得到什么？"],
        evidence=[evidence],
    )


def test_recap_job_requires_the_five_ordered_steps():
    job = RecapJob(
        id="job-01",
        goal="为明天准备 5 分钟补讲",
        status="queued",
        steps=[
            RecapStep(key=key, status="pending", summary="等待执行")
            for key in [
                "transcribe",
                "extract-evidence",
                "identify-gaps",
                "generate-deliverables",
                "teacher-review",
            ]
        ],
    )

    assert [step.key for step in job.steps] == [
        "transcribe",
        "extract-evidence",
        "identify-gaps",
        "generate-deliverables",
        "teacher-review",
    ]


def test_recap_job_rejects_unknown_step_and_invalid_status():
    with pytest.raises(ValidationError):
        RecapStep(key="unknown", status="pending", summary="无效步骤")

    with pytest.raises(ValidationError):
        RecapJob(id="job-01", goal="补讲", status="published", steps=[])


def test_deliverables_rejects_inference_without_evidence_reference():
    with pytest.raises(ValidationError, match="evidence"):
        RecapDeliverables(
            student_recap="模型认为学生掌握很好。",
            teacher_report="课堂报告",
            remedial_plan="补讲方案",
            practice_questions=["练习题"],
            evidence=[],
        )


def test_deliverables_rejects_inference_pointing_to_unknown_evidence():
    with pytest.raises(ValidationError, match="evidence_ids"):
        RecapDeliverables(
            student_recap="复习卡",
            teacher_report="课堂报告",
            remedial_plan="补讲方案",
            practice_questions=["练习题"],
            evidence=[valid_evidence()],
            inferences=[
                {
                    "id": "inference-01",
                    "statement": "需要补讲",
                    "evidence_ids": ["missing-evidence"],
                }
            ],
        )


def test_wire_payload_accepts_frontend_camel_case_fields():
    payload = {
        "studentRecap": "复习卡",
        "teacherReport": "课堂报告",
        "remedialPlan": "补讲方案",
        "practiceQuestions": ["练习题"],
        "evidence": [
            {
                "id": "evidence-01",
                "quote": "分子和分母要同时乘同一个不为零的数。",
                "startSeconds": 85,
                "endSeconds": 112,
                "source": "transcript",
            }
        ],
        "inferences": [
            {
                "id": "inference-01",
                "statement": "需要补讲",
                "evidenceIds": ["evidence-01"],
            }
        ],
    }

    deliverables = RecapDeliverables.model_validate(payload)
    assert deliverables.student_recap == "复习卡"
