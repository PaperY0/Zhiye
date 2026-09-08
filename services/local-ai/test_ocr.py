import asyncio
import importlib
import sys
import types
from pathlib import Path

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


def test_recognize_image_unwraps_paddleocr_v3_result(monkeypatch):
    server = load_server(monkeypatch)
    result = types.SimpleNamespace(
        json={"res": {"rec_texts": ["2/3"], "rec_scores": [0.92]}}
    )
    monkeypatch.setattr(
        server,
        "get_ocr_engine",
        lambda: types.SimpleNamespace(predict=lambda _: [result]),
    )

    recognized_text, confidence = server._recognize_image_in_process("question.png")

    assert recognized_text == "2/3"
    assert confidence == 0.92


def test_solve_image_removes_temp_file_when_read_raises(monkeypatch):
    server = load_server(monkeypatch)
    created_paths = []
    original_named_temporary_file = server.tempfile.NamedTemporaryFile

    def capture_named_temporary_file(*args, **kwargs):
        temporary = original_named_temporary_file(*args, **kwargs)
        created_paths.append(temporary.name)
        return temporary

    class FailingImage:
        filename = "broken.png"

        async def read(self):
            raise RuntimeError("read failed")

    monkeypatch.setattr(server.tempfile, "NamedTemporaryFile", capture_named_temporary_file)

    try:
        asyncio.run(server.solve_image(FailingImage()))
    except RuntimeError as error:
        assert str(error) == "read failed"
    else:
        raise AssertionError("solve_image should propagate a read failure")

    assert len(created_paths) == 1
    assert not Path(created_paths[0]).exists()


def test_ocr_worker_crash_keeps_api_error_contained(monkeypatch):
    server = load_server(monkeypatch)
    failed = types.SimpleNamespace(returncode=-1073741819, stdout="", stderr="access violation")
    monkeypatch.setattr(server.subprocess, "run", lambda *args, **kwargs: failed)

    client = TestClient(server.app)
    response = client.post(
        "/solve-image", files={"image": ("question.png", b"x", "image/png")}
    )

    assert response.status_code == 503
    assert "Python 3.11/3.12" in response.json()["detail"]
