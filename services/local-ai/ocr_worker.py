import json
import sys

from rapidocr_onnxruntime import RapidOCR


def recognize_with_rapidocr(path: str) -> tuple[str, float]:
    result, _ = RapidOCR()(path)
    lines = []
    scores = []
    for item in result or []:
        if not isinstance(item, (list, tuple)) or len(item) < 3:
            continue
        text = str(item[1]).strip()
        if not text:
            continue
        lines.append(text)
        scores.append(float(item[2]))
    confidence = sum(scores) / len(scores) if scores else 0.0
    return "\n".join(lines), confidence


def main() -> int:
    if len(sys.argv) != 2:
        return 2
    text, confidence = recognize_with_rapidocr(sys.argv[1])
    print(json.dumps({"recognizedText": text, "ocrConfidence": confidence}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
