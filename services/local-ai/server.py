import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from funasr import AutoModel
from pydantic import ValidationError

from generation import (
    DeepSeekNotConfiguredError,
    DeepSeekTimeoutError,
    GenerationValidationError,
    generate_draft,
)
from schemas import GenerateRequest, LessonAnalysisDraft

app = FastAPI(title="Zhiye local lesson AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8443", "http://localhost:8443"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

asr_model = None
ocr_engine = None


def get_asr_model():
    global asr_model
    if asr_model is None:
        asr_model = AutoModel(
            model=os.getenv("FUNASR_MODEL", "iic/SenseVoiceSmall"),
            vad_model=os.getenv("FUNASR_VAD_MODEL", "fsmn-vad"),
            punc_model=os.getenv("FUNASR_PUNC_MODEL", "ct-punc"),
            device=os.getenv("ASR_DEVICE", "cpu"),
            disable_update=True,
        )
    return asr_model


def transcribe(path: str) -> str:
    result = get_asr_model().generate(input=path, cache={}, batch_size_s=300)
    pieces = []
    for item in result or []:
        text = item.get("text", "") if isinstance(item, dict) else str(item)
        if text:
            pieces.append(text)
    transcript = " ".join(pieces).strip()
    if not transcript:
        raise HTTPException(status_code=422, detail="没有识别到清晰的人声")
    return transcript


def get_ocr_engine():
    global ocr_engine
    if ocr_engine is None:
        from paddleocr import PaddleOCR

        ocr_engine = PaddleOCR(lang=os.getenv("PADDLEOCR_LANG", "ch"))
    return ocr_engine


def _recognize_image_in_process(path: str) -> tuple[str, float]:
    recognized_lines = []
    confidences = []
    for result in get_ocr_engine().predict(path):
        if isinstance(result, dict):
            payload = result
        else:
            raw_payload = getattr(result, "json", {})
            payload = json.loads(raw_payload) if isinstance(raw_payload, str) else raw_payload

        if isinstance(payload, dict):
            payload = payload.get("res", payload)

        texts = payload.get("rec_texts", []) if isinstance(payload, dict) else []
        scores = payload.get("rec_scores", []) if isinstance(payload, dict) else []
        for index, text in enumerate(texts):
            cleaned_text = str(text).strip()
            if not cleaned_text:
                continue
            recognized_lines.append(cleaned_text)
            if index < len(scores):
                confidences.append(float(scores[index]))

    confidence = sum(confidences) / len(confidences) if confidences else 0.0
    return "\n".join(recognized_lines), confidence


def recognize_image(path: str) -> tuple[str, float]:
    """Run PaddleOCR outside the API process so native crashes cannot kill FastAPI."""
    worker = Path(__file__).with_name("ocr_worker.py")
    try:
        completed = subprocess.run(
            [sys.executable, str(worker), path],
            capture_output=True,
            text=True,
            timeout=int(os.getenv("OCR_TIMEOUT_SECONDS", "120")),
            check=False,
        )
    except subprocess.TimeoutExpired as error:
        raise HTTPException(status_code=504, detail="本地 OCR 处理超时，请重试。") from error
    except OSError as error:
        raise HTTPException(status_code=503, detail="本地 OCR 进程无法启动，请检查 Python 环境。") from error

    if completed.returncode != 0:
        raise HTTPException(
            status_code=503,
            detail="本地 OCR 依赖启动失败，请使用 Python 3.11/3.12 重启服务。",
        )

    try:
        payload = json.loads(completed.stdout)
        return str(payload["recognizedText"]), float(payload["ocrConfidence"])
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as error:
        raise HTTPException(status_code=503, detail="本地 OCR 返回格式无效，请重试。") from error


def generate_with_deepseek(transcript: str) -> dict:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="未设置 DEEPSEEK_API_KEY")

    model = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash")
    request_body = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "你是知野课堂复盘助手。只根据课堂转写生成教师可审核的草稿，"
                    "不要诊断学生，不要编造课堂中未出现的事实。"
                ),
            },
            {
                "role": "user",
                "content": (
                    "请把下面的课堂转写整理为 JSON，字段必须是："
                    "recap（给学生看的简短复习卡）、recapTags（最多3个知识点字符串）、"
                    "nextStep（给教师的下一步建议）、teacherReport（给教师的课堂报告）、"
                    "progressSuggestion（给教师的课程进度建议）、evidence（支持报告的课堂依据字符串数组）。"
                    "所有字段必须来自转写，不要编造未出现的事实。课堂转写：\n" + transcript
                ),
            },
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
    }
    request = urllib.request.Request(
        "https://api.deepseek.com/chat/completions",
        data=json.dumps(request_body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:500]
        raise HTTPException(status_code=502, detail=f"DeepSeek 请求失败：{detail}") from error
    except urllib.error.URLError as error:
        raise HTTPException(status_code=502, detail=f"无法连接 DeepSeek：{error.reason}") from error

    try:
        content = payload["choices"][0]["message"]["content"]
        return LessonAnalysisDraft.model_validate(json.loads(content)).model_dump()
    except (KeyError, IndexError, TypeError, ValueError) as error:
        raise HTTPException(status_code=502, detail="DeepSeek 返回内容不是有效课堂复盘 JSON") from error


@app.get("/health")
def health():
    return {"ok": True, "asr": "local-funasr", "deepseek": bool(os.getenv("DEEPSEEK_API_KEY"))}


@app.post("/generate")
def generate(request: GenerateRequest):
    try:
        return {"draft": True, "source": "deepseek", "content": generate_draft(request)}
    except DeepSeekNotConfiguredError as error:
        raise HTTPException(status_code=503, detail="未设置 DEEPSEEK_API_KEY") from error
    except DeepSeekTimeoutError as error:
        raise HTTPException(status_code=504, detail="DeepSeek 请求超时，请重试") from error
    except GenerationValidationError as error:
        raise HTTPException(status_code=502, detail="模型返回格式无效，请重试") from error
    except (urllib.error.HTTPError, urllib.error.URLError) as error:
        raise HTTPException(status_code=502, detail="DeepSeek 请求失败，请重试") from error


@app.post("/analyze")
async def analyze(audio: UploadFile = File(...)):
    suffix = Path(audio.filename or "lesson-recording.webm").suffix or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temporary:
        temporary.write(await audio.read())
        path = temporary.name
    try:
        transcript_text = transcribe(path)
        generated = generate_with_deepseek(transcript_text)
        try:
            generated = LessonAnalysisDraft.model_validate(generated).model_dump()
        except ValidationError as error:
            raise HTTPException(
                status_code=502,
                detail="DeepSeek 返回内容不是有效课堂复盘 JSON",
            ) from error
        return {
            "transcript": [
                {
                    "id": "transcript-live-01",
                    "speaker": "教师与课堂发言",
                    "startSeconds": 0,
                    "endSeconds": 0,
                    "body": transcript_text,
                }
            ],
            **generated,
        }
    finally:
        try:
            Path(path).unlink(missing_ok=True)
        except OSError:
            pass


@app.post("/solve-image")
async def solve_image(image: UploadFile = File(...)):
    suffix = Path(image.filename or "question.png").suffix or ".png"
    path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temporary:
            path = temporary.name
            temporary.write(await image.read())
        recognized_text, ocr_confidence = recognize_image(path)
        result = {
            "recognizedText": recognized_text,
            "ocrConfidence": ocr_confidence,
            "needsConfirmation": True,
        }
        if not recognized_text or ocr_confidence < 0.65:
            result["retryMessage"] = "题目文字不清晰，请重新拍摄。"
        return result
    finally:
        if path:
            try:
                Path(path).unlink(missing_ok=True)
            except OSError:
                pass
