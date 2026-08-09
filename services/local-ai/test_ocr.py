import importlib
import sys
import types

from fastapi.testclient import TestClient


def load_server(monkeypatch):
    fake_funasr = types.ModuleType("funasr")
    fake_funasr.AutoModel = object
    monkeypatch.setitem(sys.modules, "funasr", fake_funasr)
    sys.modules.pop("server", None)
    return importlib.import_module("server")


def test_empty_ocr_requires_retake(monkeypatch):
    server = load_server(monkeypatch)
    client = TestClient(server.app)
    monkeypatch.setattr(server, "recognize_image", lambda _: ("", 0.0))

    response = client.post(
        "/solve-image", files={"image": ("blur.png", b"x", "image/png")}
    )

    assert response.json()["needsConfirmation"] is True
    assert response.json()["retryMessage"] == "题目文字不清晰，请重新拍摄。"


def test_low_confidence_ocr_requires_retake(monkeypatch):
    server = load_server(monkeypatch)
    client = TestClient(server.app)
    monkeypatch.setattr(server, "recognize_image", lambda _: ("x + y = 5", 0.64))

    response = client.post(
        "/solve-image", files={"image": ("question.png", b"x", "image/png")}
    )

    assert response.json()["recognizedText"] == "x + y = 5"
    assert response.json()["ocrConfidence"] == 0.64
    assert response.json()["retryMessage"] == "题目文字不清晰，请重新拍摄。"


def test_clear_ocr_still_requires_user_confirmation(monkeypatch):
    server = load_server(monkeypatch)
    client = TestClient(server.app)
    monkeypatch.setattr(server, "recognize_image", lambda _: ("计算 2 + 3", 0.91))

    response = client.post(
        "/solve-image", files={"image": ("question.png", b"x", "image/png")}
    )

    assert response.json() == {
        "recognizedText": "计算 2 + 3",
        "ocrConfidence": 0.91,
        "needsConfirmation": True,
    }


def test_uploaded_image_is_removed_after_recognition(monkeypatch):
    server = load_server(monkeypatch)
    client = TestClient(server.app)
    recognized_paths = []

    def recognize(path):
        recognized_paths.append(path)
        return "题目", 0.9

    monkeypatch.setattr(server, "recognize_image", recognize)

    response = client.post(
        "/solve-image", files={"image": ("question.png", b"x", "image/png")}
    )

    assert response.status_code == 200
    assert len(recognized_paths) == 1
    assert not __import__("pathlib").Path(recognized_paths[0]).exists()
