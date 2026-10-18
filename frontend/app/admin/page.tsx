"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Faq {
  id: number;
  question: string;
  answer: string;
}

export default function AdminPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [eq, setEq] = useState("");
  const [ea, setEa] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`${API_URL}/api/faqs`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFaqs(await res.json());
      setError(null);
    } catch {
      setError("Backend se connect nahi ho saka. Kya backend chal raha hai?");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addFaq() {
    if (!q.trim() || !a.trim()) return;
    const res = await fetch(`${API_URL}/api/faqs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q.trim(), answer: a.trim() }),
    });
    if (res.ok) {
      setQ("");
      setA("");
      load();
    }
  }

  function startEdit(f: Faq) {
    setEditingId(f.id);
    setEq(f.question);
    setEa(f.answer);
  }

  async function saveEdit(id: number) {
    const res = await fetch(`${API_URL}/api/faqs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: eq.trim(), answer: ea.trim() }),
    });
    if (res.ok) {
      setEditingId(null);
      load();
    }
  }

  async function delFaq(id: number) {
    if (!confirm("Ye FAQ delete kar dein?")) return;
    const res = await fetch(`${API_URL}/api/faqs/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-[#075e54] px-6 py-4 shadow">
        <h1 className="text-xl font-bold text-white">Hammad Fabrics — FAQ Manager</h1>
        <p className="text-sm text-emerald-100">
          Ye FAQs AI assistant ke "dimagh" mein jate hain. Yahan badlo, chat mein asar dekho.
        </p>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded bg-red-100 px-4 py-2 text-sm text-red-800">{error}</div>
        )}

        {/* Add form */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <h2 className="mb-3 font-semibold">Naya FAQ add karo</h2>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sawal (jaise customer poochega)"
            className="mb-2 w-full rounded border px-3 py-2 text-sm outline-none focus:border-[#075e54]"
          />
          <textarea
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="Jawab"
            rows={2}
            className="mb-3 w-full rounded border px-3 py-2 text-sm outline-none focus:border-[#075e54]"
          />
          <button
            onClick={addFaq}
            disabled={!q.trim() || !a.trim()}
            className="rounded bg-[#075e54] px-4 py-2 text-sm font-medium text-white hover:bg-[#064e46] disabled:opacity-40"
          >
            Add FAQ
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {faqs.map((f) =>
            editingId === f.id ? (
              <div key={f.id} className="rounded-lg bg-white p-4 shadow">
                <input
                  value={eq}
                  onChange={(e) => setEq(e.target.value)}
                  className="mb-2 w-full rounded border px-3 py-2 text-sm outline-none focus:border-[#075e54]"
                />
                <textarea
                  value={ea}
                  onChange={(e) => setEa(e.target.value)}
                  rows={2}
                  className="mb-3 w-full rounded border px-3 py-2 text-sm outline-none focus:border-[#075e54]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(f.id)}
                    className="rounded bg-[#075e54] px-3 py-1.5 text-sm text-white hover:bg-[#064e46]"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded bg-gray-200 px-3 py-1.5 text-sm hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div key={f.id} className="rounded-lg bg-white p-4 shadow">
                <div className="font-medium">{f.question}</div>
                <div className="mt-1 text-sm text-gray-600">{f.answer}</div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => startEdit(f)}
                    className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => delFaq(f.id)}
                    className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
          {faqs.length === 0 && !error && (
            <p className="text-center text-sm text-gray-500">Koi FAQ nahi hai — upar se add karo.</p>
          )}
        </div>
      </main>
    </div>
  );
}
