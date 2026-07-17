"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string; riskHint?: string };

export function AiChat() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "你好，我是你的专属成长陪伴 AI。你可以和我聊情绪、目标、学习或训练。你记录得越多，我越懂你。",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.error || "暂时无法回复" },
        ]);
        return;
      }
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply,
          riskHint: data.riskHint,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "网络异常，请稍后再试。" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex h-[640px] flex-col overflow-hidden">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${
              m.role === "user"
                ? "ml-auto bg-teal-700 text-white"
                : "bg-white border border-stone-200 text-stone-800"
            }`}
          >
            {m.content}
            {m.riskHint ? (
              <div className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-red-700">
                {m.riskHint}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="border-t border-stone-200 bg-white/70 p-4">
        <div className="flex gap-2">
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="说说你现在的状态、困惑或目标…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button className="btn btn-primary" onClick={() => void send()} disabled={loading}>
            {loading ? "…" : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
}
