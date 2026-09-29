import pytest
from fastapi.testclient import TestClient

import server
from public_access import SlidingWindowLimiter, issue_token, verify_token


@pytest.fixture
def public_ai(monkeypatch):
    monkeypatch.setenv("ZHIYE_AI_PUBLIC_MODE", "1")
    monkeypatch.setenv("ZHIYE_AI_INVITE_CODE", "demo-invite-code-123456")
    monkeypatch.setenv("ZHIYE_AI_SESSION_SECRET", "session-secret-for-tests-at-least-32-characters")
    monkeypatch.setenv("ZHIYE_AI_ALLOWED_ORIGINS", "https://zhiye-demo.vercel.app")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-deepseek-key")
    monkeypatch.setattr(server, "invite_limiter", SlidingWindowLimiter())
    monkeypatch.setattr(server, "request_limiter", SlidingWindowLimiter())
    return TestClient(server.app)


def test_invite_is_required_before_paid_and_media_routes(public_ai):
    for path in ("/generate", "/analyze", "/solve-image", "/recap-jobs", "/recap-jobs/unknown/retry"):
        response = public_ai.post(path)
        assert response.status_code == 401, path
    assert public_ai.get("/health").json()["inviteRequired"] is True


def test_valid_invite_unlocks_routes_without_exposing_code(public_ai):
    rejected = public_ai.post("/auth/invite", json={"code": "wrong"})
    assert rejected.status_code == 401
    accepted = public_ai.post("/auth/invite", json={"code": "demo-invite-code-123456"})
    assert accepted.status_code == 200
    assert accepted.headers["cache-control"] == "no-store"
    token = accepted.json()["token"]
    assert "demo-invite-code" not in token
    assert public_ai.post("/generate", headers={"Authorization": f"Bearer {token}"}, json={}).status_code == 422
    assert public_ai.post("/solve-image", headers={"Authorization": f"Bearer {token}"}).status_code == 422
    assert public_ai.post("/generate", headers={"Authorization": "Bearer changed"}, json={}).status_code == 401


def test_public_ai_rejects_other_browser_origins(public_ai):
    response = public_ai.post("/auth/invite", headers={"Origin": "https://untrusted.example"}, json={"code": "demo-invite-code-123456"})
    assert response.status_code == 403


def test_auth_errors_include_cors_for_allowed_site(public_ai):
    response = public_ai.post("/generate", headers={"Origin": "http://127.0.0.1:8443"}, json={})
    assert response.status_code == 401
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:8443"


def test_signed_token_expires_and_cannot_be_modified(public_ai):
    token, expires_at = issue_token(now=1000)
    assert verify_token(token, now=1001)
    assert not verify_token(token, now=expires_at)
    assert not verify_token(token + "x", now=1001)


def test_sliding_window_limiter_resets_after_window():
    limiter = SlidingWindowLimiter()
    assert limiter.allow("one", 2, 60, now=100)
    assert limiter.allow("one", 2, 60, now=110)
    assert not limiter.allow("one", 2, 60, now=120)
    assert limiter.allow("one", 2, 60, now=161)


def test_public_mode_fails_closed_without_secrets(monkeypatch, public_ai):
    monkeypatch.delenv("ZHIYE_AI_SESSION_SECRET")
    assert public_ai.get("/health").status_code == 503
    assert public_ai.post("/generate", json={}).status_code == 503


@pytest.mark.parametrize("origin", ["*", "http://untrusted.example", "https://good.example/path", "https://good.example@evil.example"])
def test_public_mode_rejects_unsafe_origin_configuration(monkeypatch, public_ai, origin):
    monkeypatch.setenv("ZHIYE_AI_ALLOWED_ORIGINS", origin)
    assert public_ai.get("/health").status_code == 503


def test_local_mode_keeps_original_flow(monkeypatch):
    monkeypatch.delenv("ZHIYE_AI_PUBLIC_MODE", raising=False)
    assert TestClient(server.app).post("/generate", json={}).status_code == 422
