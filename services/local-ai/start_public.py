"""Fail closed before binding the public AI server."""

import os

import uvicorn

from public_access import public_mode, public_settings


if __name__ == "__main__":
    if not public_mode():
        raise SystemExit("公网 AI 必须设置 ZHIYE_AI_PUBLIC_MODE=1")
    public_settings()
    if not os.getenv("DEEPSEEK_API_KEY"):
        raise SystemExit("公网 AI 缺少 DEEPSEEK_API_KEY")
    uvicorn.run("server:app", host="0.0.0.0", port=int(os.getenv("PORT", "10000")), workers=1)
