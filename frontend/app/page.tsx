"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Role = "user" | "assistant";

interface Msg {
  role: Role;
  content: string;
  time: string;
  handoff?: boolean;
}

function now(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const WELCOME: Msg = {
  role: "assistant",
  content: "Assalam-o-Alaikum! Hammad Fabrics mein khush aamdeed. Kapron ke baare mein kuch poochna hai? ",
  time: now(),
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function send() {
    const text = input.trim();
    if (!text || typing) return;
    setError(null);
    const userMsg: Msg = { role: "user", content: text, time: now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setTyping(true);

    try {
      const history = next.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { reply: string; handoff: boolean } = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, time: now(), handoff: data.handoff },
      ]);
    } catch {
      setError("Backend se connect nahi ho saka. Kya backend chal raha hai? (README dekho)");
    } finally {
      setTyping(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[#0b141a]">
      {/* Header */}
      <header className="flex items-center gap-3 bg-[#075e54] px-4 py-3 shadow-md">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-bold text-[#075e54]">
          HF
        </div>
        <div className="flex-1">
          <div className="font-semibold text-white">Hammad Fabrics</div>
          <div className="text-xs text-emerald-100">online · AI assistant</div>
        </div>

      </header>

      {/* Messages */}
      <main className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-lg px-3 py-2 text-[15px] leading-snug shadow ${
                m.role === "user" ? "bg-[#005c4b] text-white" : "bg-[#202c33] text-[#e9edef]"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
              <div className="mt-1 flex items-center justify-end gap-1">
                {m.handoff && <span className="mr-1 text-[11px] text-amber-300">🔄 team se connect</span>}
                <span className="text-[11px] text-gray-400">{m.time}</span>
              </div>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-lg bg-[#202c33] px-4 py-3 shadow">
              <span className="typing-dot inline-block h-2 w-2 rounded-full bg-gray-400" />
              <span className="typing-dot inline-block h-2 w-2 rounded-full bg-gray-400" />
              <span className="typing-dot inline-block h-2 w-2 rounded-full bg-gray-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {error && (
        <div className="bg-red-900/60 px-4 py-2 text-center text-sm text-red-200">{error}</div>
      )}

      {/* Input */}
      <footer className="flex items-center gap-2 bg-[#0b141a] px-3 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message likhein…"
          className="flex-1 rounded-full bg-[#202c33] px-4 py-2.5 text-[15px] text-[#e9edef] placeholder-gray-500 outline-none focus:ring-1 focus:ring-[#00a884]"
        />
        <button
          onClick={send}
          disabled={typing || !input.trim()}
          aria-label="Send"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00a884] text-white shadow transition hover:bg-[#06cf9c] disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </footer>
    </div>
  );
}
