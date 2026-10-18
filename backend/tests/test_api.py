import pytest
from fastapi.testclient import TestClient

import app.main as main
from app.store import FaqStore


@pytest.fixture()
def client(tmp_path, monkeypatch):
    """TestClient with an isolated (temporary) FAQ store and no API key."""
    data_file = tmp_path / "faqs.json"
    data_file.write_text("[]", encoding="utf-8")
    monkeypatch.setattr(main, "store", FaqStore(data_file))
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    return TestClient(main.app)


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@pytest.mark.parametrize(
    "msg",
    [
        "mujhe human se baat karni hai",
        "koi INSAN hai yahan?",
        "please call karo mujhe",
        "apna number do",
        "manager se rabta karwao",
        "are you an agent?",
    ],
)
def test_handoff_keywords(client, msg):
    r = client.post("/api/chat", json={"message": msg, "history": []})
    assert r.status_code == 200
    body = r.json()
    assert body["handoff"] is True
    assert "team se connect" in body["reply"]


def test_no_handoff_for_normal_message(client):
    r = client.post("/api/chat", json={"message": "delivery kitne din mein hogi?"})
    assert r.status_code == 200
    body = r.json()
    assert body["handoff"] is False


def test_missing_key_graceful_reply(client):
    """Without GEMINI_API_KEY the endpoint must not crash."""
    r = client.post(
        "/api/chat",
        json={
            "message": "salam, kapre ka size kya hai?",
            "history": [{"role": "user", "content": "hi"}],
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["handoff"] is False
    assert "GEMINI_API_KEY" in body["reply"]


def test_faq_crud_roundtrip(client):
    # create
    r = client.post("/api/faqs", json={"question": "Q?", "answer": "A."})
    assert r.status_code == 201
    fid = r.json()["id"]

    # list contains it
    r = client.get("/api/faqs")
    assert r.status_code == 200
    assert any(f["id"] == fid for f in r.json())

    # update
    r = client.put(f"/api/faqs/{fid}", json={"answer": "A2."})
    assert r.status_code == 200
    assert r.json()["answer"] == "A2."
    assert r.json()["question"] == "Q?"

    # delete
    r = client.delete(f"/api/faqs/{fid}")
    assert r.status_code == 200
    assert r.json() == {"deleted": True}

    # gone from list
    r = client.get("/api/faqs")
    assert all(f["id"] != fid for f in r.json())


def test_faq_404(client):
    assert client.put("/api/faqs/9999", json={"answer": "x"}).status_code == 404
    assert client.delete("/api/faqs/9999").status_code == 404
