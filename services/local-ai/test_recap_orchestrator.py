import pytest

from recap_job import new_recap_job, retry_recap_step, run_recap_job
from recap_tools import extract_evidence, generate_deliverables, identify_learning_gaps
from schemas import RecapDeliverables
from test_recap_tools import sample_transcript


def test_failed_generation_preserves_first_three_steps_and_retry_runs_only_step_four():
    calls: list[str] = []
    transcript = sample_transcript()
    job = new_recap_job("为明天准备 5 分钟补讲")

    def tracked_extract(items):
        calls.append("extract-evidence")
        return extract_evidence(items)

    def tracked_gaps(goal, items):
        calls.append("identify-gaps")
        return identify_learning_gaps(goal, items)

    def failing_generate(*_args):
        calls.append("generate-deliverables")
        raise RuntimeError("DeepSeek 暂时不可用")

    failed = run_recap_job(
        job,
        transcript,
        extract_fn=tracked_extract,
        gaps_fn=tracked_gaps,
        deliverables_fn=failing_generate,
    )

    assert [step.status for step in failed.steps[:3]] == [
        "succeeded",
        "succeeded",
        "succeeded",
    ]
    assert failed.steps[3].status == "failed"
    assert failed.steps[3].error == "DeepSeek 暂时不可用"
    assert failed.evidence
    assert failed.inferences
    assert calls == ["extract-evidence", "identify-gaps", "generate-deliverables"]

    def successful_generate(goal, evidence, gaps):
        calls.append("generate-deliverables-retry")
        return generate_deliverables(goal, evidence, gaps)

    recovered = retry_recap_step(
        failed,
        "generate-deliverables",
        deliverables_fn=successful_generate,
    )

    assert recovered.status == "needs-review"
    assert recovered.steps[3].status == "succeeded"
    assert recovered.steps[0].status == "succeeded"
    assert calls == [
        "extract-evidence",
        "identify-gaps",
        "generate-deliverables",
        "generate-deliverables-retry",
    ]


def test_retry_rejects_a_step_that_is_not_failed():
    job = new_recap_job("补讲")
    with pytest.raises(ValueError, match="只能重试失败步骤"):
        retry_recap_step(job, "generate-deliverables")
