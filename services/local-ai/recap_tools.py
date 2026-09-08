"""Controlled tools for the classroom recap digital employee.

Each tool returns a validated schema object. The module intentionally keeps the
development path deterministic so the product can be accepted without paying
for a model call; a model-backed implementation can replace the heuristics
behind the same contracts later.
"""

from schemas import EvidenceItem, InferenceItem, RecapDeliverables


def _load_asr_model():
    from server import get_asr_model

    return get_asr_model()


def transcribe_audio(path: str) -> list[EvidenceItem]:
    """Transcribe audio with the existing lazily-loaded local FunASR model."""
    result = _load_asr_model().generate(input=path, cache={}, batch_size_s=300)
    evidence: list[EvidenceItem] = []
    for index, item in enumerate(result or [], start=1):
        if isinstance(item, dict):
            text = str(item.get("text", "")).strip()
            timestamps = item.get("timestamp") or item.get("timestamps") or []
        else:
            text = str(item).strip()
            timestamps = []
        if not text:
            continue
        start_seconds = 0.0
        end_seconds = 0.0
        if timestamps and isinstance(timestamps, list):
            try:
                start_seconds = float(timestamps[0][0]) / 1000
                end_seconds = float(timestamps[-1][1]) / 1000
            except (IndexError, TypeError, ValueError):
                start_seconds = float(index - 1)
                end_seconds = float(index)
        evidence.append(
            EvidenceItem(
                id=f"transcript-{index:02d}",
                quote=text,
                start_seconds=start_seconds,
                end_seconds=max(end_seconds, start_seconds),
                source="transcript",
            )
        )
    if not evidence:
        raise ValueError("没有识别到清晰的人声")
    return evidence


def extract_evidence(transcript: list[EvidenceItem]) -> list[EvidenceItem]:
    """Keep only non-empty, validated transcript evidence in source order."""
    if not transcript:
        raise ValueError("课堂转写为空，无法提取证据")
    return [EvidenceItem.model_validate(item.model_dump()) for item in transcript]


def identify_learning_gaps(
    goal: str, evidence: list[EvidenceItem]
) -> list[InferenceItem]:
    """Create reviewable, evidence-linked gap hypotheses without inventing facts."""
    if not goal.strip():
        raise ValueError("复盘目标不能为空")
    if not evidence:
        raise ValueError("没有课堂证据，无法识别学习缺口")

    joined = " ".join(item.quote for item in evidence)
    referenced_ids = [item.id for item in evidence]
    if any(token in joined for token in ("只把", "不为零", "单位", "换算", "是不是也一样")):
        statement = "需要补讲操作条件，并用一道题确认学生能完整复述规则。"
    else:
        statement = "建议教师根据课堂原话进行一次针对性复述检查。"
    return [
        InferenceItem(
            id="inference-01",
            statement=statement,
            evidence_ids=referenced_ids[:3],
        )
    ]


def generate_deliverables(
    goal: str,
    evidence: list[EvidenceItem],
    gaps: list[InferenceItem],
) -> RecapDeliverables:
    """Generate the four teacher-reviewable deliverables from linked evidence."""
    if not goal.strip():
        raise ValueError("复盘目标不能为空")
    if not evidence:
        raise ValueError("没有课堂证据，无法生成复盘成果")
    normalized_gaps = [InferenceItem.model_validate(gap) for gap in gaps]

    first_quote = evidence[0].quote
    return RecapDeliverables(
        student_recap=f"本节课重点：{first_quote}",
        teacher_report=f"已根据 {len(evidence)} 条课堂原话生成复盘草稿，等待教师审核。",
        remedial_plan="用 5 分钟补讲上述规则，再用一道变式题确认学生能独立应用。",
        practice_questions=[
            "请用自己的话复述本节课规则，并说明其中的必要条件。",
            "如果只改变其中一个量，结果会发生什么？请举例说明。",
        ],
        evidence=evidence,
        inferences=normalized_gaps,
    )
