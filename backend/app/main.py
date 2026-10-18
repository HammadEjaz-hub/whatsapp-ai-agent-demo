from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .agent import get_reply
from .models import ChatRequest, ChatResponse, Faq, FaqCreate, FaqUpdate
from .store import FaqStore

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "faqs.json"

app = FastAPI(title="WhatsApp AI Agent Demo API")
store = FaqStore(DATA_FILE)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    history = [m.model_dump() for m in req.history[-10:]]
    faqs = [f.model_dump() for f in store.list()]
    reply, handoff = await get_reply(req.message, history, faqs)
    return ChatResponse(reply=reply, handoff=handoff)


@app.get("/api/faqs", response_model=list[Faq])
def list_faqs():
    return store.list()


@app.post("/api/faqs", response_model=Faq, status_code=201)
def create_faq(payload: FaqCreate):
    return store.create(payload)


@app.put("/api/faqs/{faq_id}", response_model=Faq)
def update_faq(faq_id: int, payload: FaqUpdate):
    faq = store.update(faq_id, payload.question, payload.answer)
    if faq is None:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return faq


@app.delete("/api/faqs/{faq_id}")
def delete_faq(faq_id: int):
    if not store.delete(faq_id):
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"deleted": True}
