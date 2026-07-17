"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOOD_LABELS } from "@/lib/utils";

export function MoodForm() {
  const router = useRouter();
  const [score, setScore] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<{ riskLevel: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, energy, stress, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "打卡失败");
        return;
      }
      setResult({ riskLevel: data.riskLevel });
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6">
      <div>
        <label className="label">
          情绪指数：{score}（{MOOD_LABELS[score - 1]}）
        </label>
        <input
          className="input"
          type="range"
          min={1}
          max={5}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
        />
      </div>
      <div className="grid-2">
        <div>
          <label className="label">精力：{energy}</label>
          <input
            className="input"
            type="range"
            min={1}
            max={5}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">压力：{stress}</label>
          <input
            className="input"
            type="range"
            min={1}
            max={5}
            value={stress}
            onChange={(e) => setStress(Number(e.target.value))}
          />
        </div>
      </div>
      <div>
        <label className="label">一句话备注（可选）</label>
        <textarea
          className="textarea"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="发生了什么？身体感受如何？"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {result ? (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            result.riskLevel === "alert"
              ? "bg-red-50 text-red-700"
              : result.riskLevel === "watch"
                ? "bg-orange-50 text-orange-700"
                : "bg-teal-50 text-teal-700"
          }`}
        >
          已记录。风险等级：
          {result.riskLevel === "normal"
            ? "正常"
            : result.riskLevel === "watch"
              ? "关注"
              : "预警"}
          。档案与推荐已更新。
        </div>
      ) : null}
      <button className="btn btn-primary" disabled={loading}>
        {loading ? "提交中..." : "完成情绪打卡"}
      </button>
    </form>
  );
}
