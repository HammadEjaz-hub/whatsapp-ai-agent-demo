"""The agent "brain": handoff detection + Gemini LLM call.

In the real product this exact module is reused — only the transport changes
(Meta WhatsApp webhook instead of this demo's web chat).
"""

import os

import httpx

HANDOFF_KEYWORDS = ["human", "insan", "agent", "call", "number", "rabta", "manager"]
HANDOFF_REPLY = "Main aapko hamari team se connect kar raha hun, thori der mein jawab milega."
DEMO_MODE_REPLY = (
    "Demo mode: GEMINI_API_KEY set nahi hai. "
    "Backend chal raha hai, key lagao aur dobara try karo."
)
UNKNOWN_REPLY = "Iska jawab mujhe confirm karke dena parega."

SYSTEM_PROMPT = """You are a friendly shop assistant for "Hammad Fabrics", a clothing store in Karachi, Pakistan.
Rules:
- Reply in the SAME language and script the customer uses (Roman Urdu written in Latin script, or English).
- Keep replies short like WhatsApp messages: 1-3 short lines. Never write essays.
- Be warm and polite.
- Answer from the store FAQs given below (the most relevant ones are listed first — if the customer's question closely matches one, use its answer, rephrased naturally in the customer's language).
- If the question is truly not covered by any FAQ and you are not sure, reply exactly: "Iska jawab mujhe confirm karke dena parega."
- Never invent prices, timings, or policies."""

GEMINI_MODEL = "gemini-3.5-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


def is_handoff(message: str) -> bool:
    lowered = message.lower()
    return any(k in lowered for k in HANDOFF_KEYWORDS)


def _score(question: str, faq_q: str) -> int:
    """Simple keyword-overlap score for FAQ ranking (RAG-lite)."""
    import re

    def words(s: str) -> set[str]:
        return set(re.findall(r"\w+", s.lower()))

    return len(words(question) & words(faq_q))


def build_prompt(message: str, history: list[dict], faqs: list[dict]) -> str:
    ranked = sorted(faqs, key=lambda f: _score(message, f["question"]), reverse=True)[:4]
    faq_block = "\n".join(f"Q: {f['question']}\nA: {f['answer']}" for f in ranked)
    hist_block = "\n".join(f"{h['role']}: {h['content']}" for h in history[-10:])
    return (
        f"{SYSTEM_PROMPT}\n\nMost relevant store FAQs (use these first):\n{faq_block}\n\n"
        f"Recent conversation:\n{hist_block}\n\n"
        f"Customer: {message}\nAssistant:"
    )


async def get_reply(message: str, history: list[dict], faqs: list[dict]) -> tuple[str, bool]:
    """Returns (reply_text, handoff_flag). Never raises."""
    if is_handoff(message):
        return HANDOFF_REPLY, True

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return DEMO_MODE_REPLY, False

    prompt = build_prompt(message, history, faqs)
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                GEMINI_URL,
                params={"key": api_key},
                json={"contents": [{"role": "user", "parts": [{"text": prompt}]}]},
            )
            resp.raise_for_status()
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            if not text:
                raise ValueError("empty LLM reply")
            return text, False
    except Exception:
        # Any LLM failure -> honest fallback, flag for human follow-up.
        return UNKNOWN_REPLY, True
