"""Invite-gated access for the optional public demo AI service."""

import hashlib
import hmac
import os
import secrets
import threading
import time
from collections import deque
from urllib.parse import urlsplit


LOCAL_ORIGINS = {"http://127.0.0.1:8443", "http://localhost:8443"}
TOKEN_LIFETIME_SECONDS = 8 * 60 * 60
WINDOW_SECONDS = 60 * 60


def public_mode() -> bool:
    return os.getenv("ZHIYE_AI_PUBLIC_MODE") == "1"


def allowed_origins() -> set[str]:
    extra = os.getenv("ZHIYE_AI_ALLOWED_ORIGINS", "")
    return LOCAL_ORIGINS | {item.strip().rstrip("/") for item in extra.split(",") if item.strip()}


def public_settings() -> tuple[str, str]:
    code = os.getenv("ZHIYE_AI_INVITE_CODE", "")
    secret = os.getenv("ZHIYE_AI_SESSION_SECRET", "")
    origins = [item.strip() for item in os.getenv("ZHIYE_AI_ALLOWED_ORIGINS", "").split(",") if item.strip()]
    valid_origins = all(
        (parsed := urlsplit(origin)).scheme == "https"
        and bool(parsed.hostname)
        and parsed.username is None
        and parsed.password is None
        and not parsed.path
        and not parsed.query
        and not parsed.fragment
        and parsed.netloc == parsed.hostname
        for origin in origins
    )
    if len(code) < 16 or len(secret) < 32 or not origins or not valid_origins:
        raise RuntimeError("公网 AI 缺少邀请码、会话密钥或允许的站点来源")
    return code, secret


def invite_matches(candidate: str) -> bool:
    code, _ = public_settings()
    return hmac.compare_digest(
        hashlib.sha256(candidate.encode()).digest(),
        hashlib.sha256(code.encode()).digest(),
    )


def issue_token(now: int | None = None) -> tuple[str, int]:
    _, secret = public_settings()
    expires_at = (int(time.time()) if now is None else now) + TOKEN_LIFETIME_SECONDS
    payload = f"v1.{expires_at}.{secrets.token_urlsafe(18)}"
    signature = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{signature}", expires_at


def verify_token(token: str, now: int | None = None) -> bool:
    if len(token) > 256:
        return False
    try:
        _, secret = public_settings()
        version, expiry, nonce, signature = token.split(".")
        expires_at = int(expiry)
        if version != "v1" or not nonce or expires_at <= (int(time.time()) if now is None else now):
            return False
        expected = hmac.new(secret.encode(), f"{version}.{expiry}.{nonce}".encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(signature, expected)
    except (ValueError, RuntimeError):
        return False


class SlidingWindowLimiter:
    def __init__(self):
        self._calls: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def allow(self, key: str, limit: int, window_seconds: int, now: float | None = None) -> bool:
        timestamp = time.time() if now is None else now
        with self._lock:
            calls = self._calls.setdefault(key, deque())
            while calls and calls[0] <= timestamp - window_seconds:
                calls.popleft()
            if len(calls) >= limit:
                return False
            calls.append(timestamp)
            return True


invite_limiter = SlidingWindowLimiter()
request_limiter = SlidingWindowLimiter()
