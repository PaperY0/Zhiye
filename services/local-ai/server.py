import hashlib
import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from pydantic import BaseModel, Field

from public_access import (
    WINDOW_SECONDS,
    allowed_origins,
    invite_limiter,
    invite_matches,
    issue_token,
    public_mode,
    public_settings,
    request_limiter,
    verify_token,
)

from generation import (
    DeepSeekNotConfiguredError,
    DeepSeekTimeoutError,
    GenerationValidationError,
    generate_draft,
)
from recap_tools import (
    transcribe_audio,
)
from recap_job import new_recap_job, retry_recap_step, run_recap_job
from schemas import (
    EvidenceItem,
    GenerateRequest,
    LessonAnalysisDraft,
)

app = FastAPI(title="Zhiye local lesson AI")
ALLOWED_ORIGINS = allowed_origins()
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_AUDIO_BYTES = 50 * 1024 * 1024
asr_model = None
ocr_engine = None
recap_jobs: dict[str, object] = {}
recap_job_owners: dict[str, str] = {}


@app.middleware("http")
async def reject_untrusted_browser_origins(request: Request, call_next):
    origin = request.headers.get("origin")
    if origin and origin not in ALLOWED_ORIGINS:
        return JSONResponse(status_code=403, content={"detail": "此 AI 服务不接受该站点的请求"})
    if public_mode() and request.method != "OPTIONS" and request.url.path not in {"/health", "/auth/invite"}:
        try:
            public_settings()
        except RuntimeError:
            return JSONResponse(status_code=503, content={"detail": "公网 AI 尚未完成安全配置"})
        authorization = request.headers.get("authorization", "")
        token = authorization[7:] if authorization.startswith("Bearer ") else ""
        if not verify_token(token):
            return JSONResponse(status_code=401, content={"detail": "请先输入有效的邀请码"})
        token_key = hashlib.sha256(token.encode()).hexdigest()
        request.state.ai_session = token_key
        if not request_limiter.allow("global", 120, WINDOW_SECONDS) or not request_limiter.allow(f"token:{token_key}", 30, WINDOW_SECONDS):
            return JSONResponse(status_code=429, content={"detail": "演示 AI 调用次数已达上限，请稍后再试"}, headers={"Retry-After": "3600"})
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(ALLOWED_ORIGINS),
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


async def read_upload(upload: UploadFile, limit: int, label: str) -> bytes:
    content = await upload.read(limit + 1)
    if len(content) > limit:
        raise HTTPException(status_code=413, detail=f"{label}过大，请选择较小文件")
    return content


def get_asr_model():
    global asr_model
    if asr_model is None:
        from funasr import AutoModel

        asr_model = AutoModel(
            model=os.getenv("FUNASR_MODEL", "iic/SenseVoiceSmall"),
            vad_model=os.getenv("FUNASR_VAD_MODEL", "fsmn-vad"),
            punc_model=os.getenv("FUNASR_PUNC_MODEL", "ct-punc"),
            device=os.getenv("ASR_DEVICE", "cpu"),
            disable_update=True,
        )
    return asr_model


def transcribe(path: str) -> str:
    try:
        return " ".join(item.quote for item in transcribe_audio(path)).strip()
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


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


def generate_with_deepseek(
    transcript: str,
    teacher_settings: dict | None = None,
) -> dict:
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
                    "title（根据课堂内容总结的简短中文标题，不超过20个汉字）、"
                    "chapter（本节课堂实际讲授的章节或知识主题，简短准确；只能从转写归纳，不能沿用教师设置中的章节）、"
                    "recap（给学生看的简短复习卡）、recapTags（最多3个知识点字符串）、"
                    "nextStep（给教师的下一步建议）、teacherReport（给教师的课堂报告）、"
                    "progressSuggestion（给教师的课程进度建议）、evidence（支持报告的课堂依据字符串数组）。"
                    "所有字段必须来自转写，不要编造未出现的事实。"
                    "教师偏好只能控制表达方式，不能覆盖课堂事实。教师偏好："
                    + json.dumps(teacher_settings or {}, ensure_ascii=False)
                    + "\n课堂转写：\n"
                    + transcript
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
        if not isinstance(content, str):
            raise TypeError("DeepSeek content must be a string")
        return LessonAnalysisDraft.model_validate(_parse_json_object(content)).model_dump()
    except (KeyError, IndexError, TypeError, ValueError, ValidationError) as error:
        raise HTTPException(status_code=502, detail="DeepSeek 返回内容不是有效课堂复盘 JSON") from error


def _parse_json_object(content: str) -> dict:
    """Accept plain JSON plus the markdown-wrapped JSON models sometimes return."""
    text = content.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].lstrip().startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start < 0 or end <= start:
            raise
        parsed = json.loads(text[start : end + 1])

    if not isinstance(parsed, dict):
        raise ValueError("DeepSeek JSON root must be an object")
    return parsed


@app.get("/health")
def health():
    if public_mode():
        try:
            public_settings()
        except RuntimeError as error:
            raise HTTPException(status_code=503, detail=str(error)) from error
        if not os.getenv("DEEPSEEK_API_KEY"):
            raise HTTPException(status_code=503, detail="DeepSeek 尚未配置")
    return {"ok": True, "asr": "local-funasr", "deepseek": bool(os.getenv("DEEPSEEK_API_KEY")), "inviteRequired": public_mode()}


class InviteRequest(BaseModel):
    code: str = Field(min_length=1, max_length=128)


@app.post("/auth/invite")
def exchange_invite(payload: InviteRequest, request: Request):
    if not public_mode():
        raise HTTPException(status_code=404, detail="本地 AI 无需邀请码")
    try:
        public_settings()
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail="公网 AI 尚未完成安全配置") from error
    client = request.client.host if request.client else "unknown"
    if not invite_limiter.allow("exchange:global", 100, 15 * 60) or not invite_limiter.allow(f"exchange:{client}", 10, 15 * 60):
        raise HTTPException(status_code=429, detail="邀请码尝试次数过多，请稍后再试", headers={"Retry-After": "900"})
    if not invite_matches(payload.code):
        raise HTTPException(status_code=401, detail="邀请码不正确")
    token, expires_at = issue_token()
    return JSONResponse(content={"token": token, "expiresAt": expires_at}, headers={"Cache-Control": "no-store"})


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
async def analyze(
    audio: UploadFile = File(...),
    teacher_settings: str = Form(default="{}"),
):
    suffix = Path(audio.filename or "lesson-recording.webm").suffix or ".webm"
    path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temporary:
            path = temporary.name
            temporary.write(await read_upload(audio, MAX_AUDIO_BYTES, "课堂录音"))
        transcript_text = transcribe(path)
        try:
            parsed_teacher_settings = json.loads(teacher_settings)
            if not isinstance(parsed_teacher_settings, dict):
                parsed_teacher_settings = {}
        except (json.JSONDecodeError, TypeError):
            parsed_teacher_settings = {}
        generated = generate_with_deepseek(transcript_text, parsed_teacher_settings)
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
            if path:
                Path(path).unlink(missing_ok=True)
        except OSError:
            pass


@app.post("/recap-jobs")
async def create_recap_job(
    request: Request,
    goal: str = Form(...),
    audio: UploadFile | None = File(default=None),
    transcript: str | None = Form(default=None),
):
    """Run the deterministic recap tool chain and return a reviewable snapshot."""
    temporary_path: str | None = None
    try:
        if transcript and transcript.strip():
            evidence = [
                EvidenceItem(
                    id=f"transcript-{index:02d}",
                    quote=line.strip(),
                    start_seconds=float(index - 1),
                    end_seconds=float(index),
                    source="transcript",
                )
                for index, line in enumerate(transcript.splitlines(), start=1)
                if line.strip()
            ]
        elif audio is not None:
            suffix = Path(audio.filename or "lesson-recording.webm").suffix or ".webm"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temporary:
                temporary.write(await read_upload(audio, MAX_AUDIO_BYTES, "课堂录音"))
                temporary_path = temporary.name
            evidence = transcribe_audio(temporary_path)
        else:
            raise HTTPException(status_code=422, detail="请提供 audio 或 transcript")
        job = run_recap_job(new_recap_job(goal), evidence)
        recap_jobs[job.id] = job
        if public_mode():
            recap_job_owners[job.id] = request.state.ai_session
        return job.model_dump(by_alias=False)
    except HTTPException:
        raise
    except (ValueError, ValidationError) as error:
        raise HTTPException(status_code=422, detail=f"复盘工具失败：{error}") from error
    finally:
        if temporary_path:
            try:
                Path(temporary_path).unlink(missing_ok=True)
            except OSError:
                pass


@app.post("/recap-jobs/{job_id}/retry")
async def retry_recap_job(request: Request, job_id: str, step_key: str = Form(...)):
    job = recap_jobs.get(job_id)
    if job is None or (public_mode() and recap_job_owners.get(job_id) != request.state.ai_session):
        raise HTTPException(status_code=404, detail="复盘任务不存在或已过期")
    try:
        recovered = retry_recap_step(job, step_key)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    recap_jobs[job_id] = recovered
    return recovered.model_dump(by_alias=False)


@app.post("/solve-image")
async def solve_image(image: UploadFile = File(...)):
    suffix = Path(image.filename or "question.png").suffix or ".png"
    path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temporary:
            path = temporary.name
            temporary.write(await read_upload(image, MAX_IMAGE_BYTES, "题目图片"))
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
