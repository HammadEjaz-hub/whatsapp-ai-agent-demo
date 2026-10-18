# WhatsApp AI Agent — TEST MVP (demo)

Ye **test/demo version** hai ek WhatsApp AI customer-support agent ka — taake samajh aaye ke agent kaise kaam karta hai, **bina asli WhatsApp number lagaye**.

Demo clothing store: **"Hammad Fabrics"** (Karachi).

## Architecture

```
[ Web Chat UI ]  <--->  [ FastAPI "brain" ]  <--->  [ Gemini LLM ]
   (demo only)         (app/agent.py — YEHI real product mein bhi use hoga)
```

**Real WhatsApp version mein kya change hoga:** sirf connector badlega.
- Abhi: browser chat UI → `POST /api/chat`
- Real: Meta WhatsApp webhook → `POST /api/chat` (wahi endpoint, wahi `agent.py`)

Matlab: **dimagh (agent.py) same rahega** — sirf "kaan" (WhatsApp webhook) lagana parega.

## Project layout

```
backend/
  app/main.py      # FastAPI: /api/chat, /api/faqs CRUD, /api/health
  app/agent.py     # Brain: handoff detection + Gemini call (never crashes)
  app/models.py    # Pydantic models
  app/store.py     # FAQ storage (local JSON file)
  data/faqs.json   # Seeded FAQs (edit via /admin page too)
  tests/           # pytest suite
frontend/
  app/page.tsx     # WhatsApp-style chat UI
  app/admin/page.tsx  # FAQ manager (add/edit/delete)
```

## Local run

**Backend** (http://localhost:8000):
```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
GEMINI_API_KEY=your_key_here .venv/bin/uvicorn app.main:app --reload --port 8000
```

**Frontend** (http://localhost:3000):
```bash
cd frontend
npm install
npm run dev
```

**Tests:**
```bash
cd backend && .venv/bin/python -m pytest tests/ -v
```

## Env vars

| Var | Kahan | Kaam |
|---|---|---|
| `GEMINI_API_KEY` | backend | Google Gemini key (`gemini-2.0-flash`). **Na ho to** `/api/chat` crash nahi karta — demo-mode reply deta hai. Free key: aistudio.google.com |
| `NEXT_PUBLIC_API_URL` | frontend | Backend URL (default `http://localhost:8000`) |

## Agent behavior (demo mein kya seekhne ko milega)

1. **FAQ se jawab:** customer sawal pooche → agent FAQs mein se jawab de (Roman Urdu ya English — customer jis mein bole).
2. **Nahi pata → imaandaari:** FAQ mein na ho to "Iska jawab mujhe confirm karke dena parega" + `handoff: true`.
3. **Hard handoff:** "human", "insan", "call", "number", "rabta", "manager" waghera likho → team se connect wala reply + `handoff: true`.
4. **WhatsApp style:** jawab 1-3 chhoti lines mein, essay nahi.

## Real WhatsApp plug-in (baad mein)

1. Meta Developer account → WhatsApp Business Platform → number + webhook URL.
2. Webhook `POST /webhook` add karo jo Meta ka message nikaal kar **wahi** `get_reply()` call kare.
3. Reply Meta ke `messages` API se wapis bhejo.
4. `app/agent.py` ko chhune ki zaroorat **nahi** — wo already tayyar hai.
