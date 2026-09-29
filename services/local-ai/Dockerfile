FROM python:3.12-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    ASR_DEVICE=cpu \
    HOME=/app \
    MODELSCOPE_CACHE=/app/.cache/modelscope \
    PADDLE_PDX_CACHE_HOME=/app/.cache/paddle

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg libgl1 libglib2.0-0 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./requirements.txt
RUN python -m pip install --no-cache-dir torch==2.7.1 torchaudio==2.7.1 --index-url https://download.pytorch.org/whl/cpu \
    && python -m pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /app/.cache \
    && useradd --uid 10001 --home-dir /app --no-create-home appuser \
    && chown -R appuser:appuser /app

USER appuser
EXPOSE 10000
CMD ["python", "start_public.py"]
