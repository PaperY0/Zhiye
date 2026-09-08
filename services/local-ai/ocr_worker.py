import json
import os
import sys

from rapidocr_onnxruntime import RapidOCR


def recognize_with_rapidocr(path: str) -> tuple[str, float]:
    result, _ = RapidOCR(
        text_score=float(os.getenv("OCR_TEXT_SCORE", "0.1"))
    )(path)
    items = []
    scores = []
    for item in result or []:
        if not isinstance(item, (list, tuple)) or len(item) < 3:
            continue
        text = str(item[1]).strip()
        if not text:
            continue
        box = item[0]
        xs = [float(point[0]) for point in box]
        ys = [float(point[1]) for point in box]
        items.append(
            {
                "text": text,
                "x": sum(xs) / len(xs),
                "y": sum(ys) / len(ys),
                "height": max(ys) - min(ys),
            }
        )
        scores.append(float(item[2]))

    # RapidOCR returns stacked fraction glyphs as separate number boxes. Join
    # vertically aligned single digits so the editable OCR result preserves
    # the most important mathematical structure.
    consumed = set()
    merged = []
    for index, item in enumerate(items):
        if index in consumed or not item["text"].isdigit() or len(item["text"]) > 1:
            continue
        candidates = [
            (other_index, other)
            for other_index, other in enumerate(items)
            if other_index not in consumed
            and other_index != index
            and other["text"].isdigit()
            and len(other["text"]) == 1
            and other["y"] > item["y"]
            and other["y"] - item["y"] <= max(item["height"] * 2.5, 24)
            and abs(other["x"] - item["x"]) <= max(item["height"], 18)
        ]
        if candidates:
            other_index, other = min(candidates, key=lambda pair: pair[1]["y"])
            merged.append({**item, "text": f"{item['text']}/{other['text']}", "y": (item["y"] + other["y"]) / 2})
            consumed.update({index, other_index})

    for index, item in enumerate(items):
        if index not in consumed:
            merged.append(item)
    merged.sort(key=lambda item: (item["y"], item["x"]))
    lines = []
    for item in merged:
        if not lines or item["y"] - lines[-1]["y"] > 30:
            lines.append({"y": item["y"], "items": [item]})
        else:
            lines[-1]["items"].append(item)
            lines[-1]["y"] = sum(entry["y"] for entry in lines[-1]["items"]) / len(lines[-1]["items"])

    reliable_scores = [score for score in scores if score >= 0.55]
    confidence_scores = reliable_scores or scores
    confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
    text = "\n".join(
        " ".join(entry["text"] for entry in sorted(line["items"], key=lambda item: item["x"]))
        for line in lines
    )
    return text, confidence


def main() -> int:
    if len(sys.argv) != 2:
        return 2
    text, confidence = recognize_with_rapidocr(sys.argv[1])
    print(json.dumps({"recognizedText": text, "ocrConfidence": confidence}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
