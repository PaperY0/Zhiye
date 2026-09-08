"""Five-step recap orchestration with failure-preserving retries."""

from collections.abc import Callable

from recap_tools import extract_evidence, generate_deliverables, identify_learning_gaps
from schemas import EvidenceItem, InferenceItem, RecapDeliverables, RecapJob, RecapStep


def new_recap_job(goal: str) -> RecapJob:
    return RecapJob(
        id="recap-job-live-01",
        goal=goal,
        status="queued",
        steps=[
            RecapStep(key="transcribe", status="pending", summary="等待课堂转写"),
            RecapStep(key="extract-evidence", status="pending", summary="等待提取课堂证据"),
            RecapStep(key="identify-gaps", status="pending", summary="等待识别学习缺口"),
            RecapStep(key="generate-deliverables", status="pending", summary="等待生成复盘成果"),
            RecapStep(key="teacher-review", status="pending", summary="等待教师审核后发布"),
        ],
    )


def _replace_step(job: RecapJob, index: int, step: RecapStep) -> RecapJob:
    steps = list(job.steps)
    steps[index] = step
    return job.model_copy(update={"steps": steps})


def _replace_job(job: RecapJob, **changes) -> RecapJob:
    payload = job.model_dump()
    payload.update(changes)
    return RecapJob.model_validate(payload)


def _failed_job(job: RecapJob, index: int, error: Exception) -> RecapJob:
    failed_step = job.steps[index].model_copy(
        update={
            "status": "failed",
            "error": str(error) or error.__class__.__name__,
            "summary": "该工具失败，已保留前序结果",
        }
    )
    return _replace_job(
        _replace_step(job, index, failed_step),
        status="failed",
    )


def run_recap_job(
    job: RecapJob,
    transcript: list[EvidenceItem],
    *,
    extract_fn: Callable = extract_evidence,
    gaps_fn: Callable = identify_learning_gaps,
    deliverables_fn: Callable = generate_deliverables,
) -> RecapJob:
    """Run all five steps; preserve successful state when a later tool fails."""
    current = _replace_job(job, status="running")
    try:
        current = _replace_step(
            current,
            0,
            RecapStep(key="transcribe", status="succeeded", summary="已完成课堂转写"),
        )
        evidence = extract_fn(transcript)
        current = _replace_job(
            _replace_step(
                current,
                1,
                RecapStep(
                    key="extract-evidence",
                    status="succeeded",
                    summary=f"已提取 {len(evidence)} 条课堂证据",
                    evidence_ids=[item.id for item in evidence],
                ),
            ),
            evidence=evidence,
        )
        gaps = gaps_fn(current.goal, evidence)
        current = _replace_job(
            _replace_step(
                current,
                2,
                RecapStep(
                    key="identify-gaps",
                    status="succeeded",
                    summary=f"已识别 {len(gaps)} 条待教师确认的学习缺口",
                    evidence_ids=[item_id for gap in gaps for item_id in gap.evidence_ids],
                ),
            ),
            inferences=gaps,
        )
        deliverables = deliverables_fn(current.goal, evidence, gaps)
        current = _replace_step(
            current,
            3,
            RecapStep(
                key="generate-deliverables",
                status="succeeded",
                summary="已生成四项教师可审核成果",
                evidence_ids=[item.id for item in evidence],
            ),
        )
        current = _replace_step(
            current,
            4,
            RecapStep(key="teacher-review", status="pending", summary="等待教师审核后发布"),
        )
        return _replace_job(current, status="needs-review", deliverables=deliverables)
    except Exception as error:
        failed_index = next(
            (index for index, step in enumerate(current.steps) if step.status == "pending"),
            3,
        )
        return _failed_job(current, failed_index, error)


def retry_recap_step(
    job: RecapJob,
    step_key: str,
    *,
    deliverables_fn: Callable = generate_deliverables,
) -> RecapJob:
    """Retry only a failed generation step using preserved upstream artifacts."""
    index = next((i for i, step in enumerate(job.steps) if step.key == step_key), None)
    if index is None or job.steps[index].status != "failed":
        raise ValueError("只能重试失败步骤")
    if step_key != "generate-deliverables":
        raise ValueError("当前仅支持重试生成补讲包")
    if not job.evidence or not job.inferences:
        raise ValueError("缺少前序证据或学习缺口，无法重试")

    try:
        deliverables = deliverables_fn(job.goal, job.evidence, job.inferences)
    except Exception as error:
        return _failed_job(job, index, error)
    recovered = _replace_step(
        job,
        index,
        RecapStep(
            key="generate-deliverables",
            status="succeeded",
            summary="已重试并生成四项教师可审核成果",
            evidence_ids=[item.id for item in job.evidence],
        ),
    )
    return _replace_job(recovered, status="needs-review", deliverables=deliverables)
