"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ANATOMICAL_PARTS,
  FOCUS_AREAS,
  type DailyStatus,
  type EnergyLevel,
  type GoalType,
  type LongTermGoal,
  type TrainingPlan,
  type Workload,
} from "@/lib/training-types";

const GOAL_OPTIONS: { type: GoalType; label: string; desc: string }[] = [
  { type: "fat-loss", label: "减脂", desc: "燃脂 / 轻间歇 / 可持续" },
  { type: "muscle-gain", label: "增肌", desc: "抗阻 / 肌群激活" },
  { type: "recovery", label: "康复恢复", desc: "拉伸 / 稳定 / 避险" },
];

export function TrainingAssistantClient() {
  const [step, setStep] = useState<"goal" | "daily" | "plan" | "player">("goal");
  const [goalType, setGoalType] = useState<GoalType>("fat-loss");
  const [targetWeightLoss, setTargetWeightLoss] = useState(3);
  const [timelineWeeks, setTimelineWeeks] = useState(8);
  const [focusAreas, setFocusAreas] = useState<string[]>(["全身"]);
  const [uncomfortableParts, setUncomfortableParts] = useState<string[]>([]);
  const [customGoalText, setCustomGoalText] = useState("");
  const [workload, setWorkload] = useState<Workload>("moderate");
  const [sleepQuality, setSleepQuality] = useState(3);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>("normal");
  const [extraNotes, setExtraNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [history, setHistory] = useState<TrainingPlan[]>([]);
  const [exIndex, setExIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [gRes, pRes] = await Promise.all([fetch("/api/training/goal"), fetch("/api/training/plans")]);
        if (gRes.ok) {
          const data = await gRes.json();
          if (data.goal) {
            setGoalType(data.goal.type);
            if (data.goal.targetWeightLoss) setTargetWeightLoss(data.goal.targetWeightLoss);
            if (data.goal.timelineWeeks) setTimelineWeeks(data.goal.timelineWeeks);
            if (data.goal.focusAreas?.length) setFocusAreas(data.goal.focusAreas);
            setUncomfortableParts(data.goal.uncomfortableParts || []);
            setCustomGoalText(data.goal.customGoalText || "");
          }
        }
        if (pRes.ok) {
          const data = await pRes.json();
          setHistory(data.plans || []);
          if (data.plans?.[0]) setPlan(data.plans[0]);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (step !== "player" || paused) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [step, paused]);

  const longTermGoal: LongTermGoal = useMemo(() => ({
    type: goalType,
    targetWeightLoss: goalType === "fat-loss" ? targetWeightLoss : undefined,
    timelineWeeks: goalType === "fat-loss" ? timelineWeeks : undefined,
    focusAreas: goalType === "muscle-gain" ? focusAreas : [],
    uncomfortableParts,
    customGoalText: customGoalText || undefined,
  }), [goalType, targetWeightLoss, timelineWeeks, focusAreas, uncomfortableParts, customGoalText]);

  const dailyStatus: DailyStatus = { workload, sleepQuality, energyLevel, extraNotes: extraNotes || undefined };

  function togglePart(id: string) {
    setUncomfortableParts((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function toggleFocus(area: string) {
    setFocusAreas((prev) => {
      if (area === "全身") return ["全身"];
      const without = prev.filter((x) => x !== "全身" && x !== area);
      if (prev.includes(area)) return without.length ? without : ["全身"];
      return [...without, area];
    });
  }

  async function generate() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/training/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ longTermGoal, dailyStatus, saveGoal: true }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "生成失败"); return; }
      setPlan(data.plan);
      setHistory((h) => [data.plan, ...h.filter((p) => p.id !== data.plan.id)].slice(0, 20));
      setStep("plan"); setExIndex(0); setSeconds(0);
    } catch { setError("网络错误"); }
    finally { setLoading(false); }
  }

  const current = plan?.exercises?.[exIndex];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="section-title">个人训练安排助手</h1>
          <p className="muted mt-1 text-sm">根据长期目标 + 今日状态动态生成训练计划；高疲劳自动降强度，不适部位自动避险</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {([["goal","长期目标"],["daily","今日状态"],["plan","计划"],["player","训练"]] as const).map(([s,label], i) => (
            <button key={s} className={`badge cursor-pointer ${step === s ? "badge-brand" : ""}`} onClick={() => setStep(s)}>
              {i + 1}. {label}
            </button>
          ))}
        </div>
      </div>

      {step === "goal" ? (
        <div className="card space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {GOAL_OPTIONS.map((g) => (
              <button key={g.type} type="button" onClick={() => setGoalType(g.type)}
                className={`rounded-xl border p-4 text-left transition ${goalType === g.type ? "border-teal-500 bg-teal-50" : "border-stone-200 bg-white"}`}>
                <div className="font-semibold">{g.label}</div>
                <div className="mt-1 text-xs text-stone-500">{g.desc}</div>
              </button>
            ))}
          </div>
          {goalType === "fat-loss" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">目标减重 (kg)<input className="input mt-1" type="number" min={1} max={30} value={targetWeightLoss} onChange={(e) => setTargetWeightLoss(Number(e.target.value) || 1)} /></label>
              <label className="text-sm">周期 (周)<input className="input mt-1" type="number" min={2} max={52} value={timelineWeeks} onChange={(e) => setTimelineWeeks(Number(e.target.value) || 4)} /></label>
            </div>
          ) : null}
          {goalType === "muscle-gain" ? (
            <div>
              <div className="label mb-2">关注肌群</div>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map((a) => (
                  <button key={a} type="button" className={`badge cursor-pointer ${focusAreas.includes(a) ? "badge-brand" : ""}`} onClick={() => toggleFocus(a)}>{a}</button>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <div className="label mb-2">不适部位（可选）</div>
            <div className="flex flex-wrap gap-2">
              {ANATOMICAL_PARTS.map((p) => (
                <button key={p.id} type="button" className={`badge cursor-pointer ${uncomfortableParts.includes(p.id) ? "badge-violet" : ""}`} onClick={() => togglePart(p.id)}>{p.name}</button>
              ))}
            </div>
            {uncomfortableParts.length ? <p className="mt-2 text-xs text-amber-700">已启用动态避险：将避开相关高负荷动作。</p> : null}
          </div>
          <label className="block text-sm">补充说明<textarea className="textarea mt-1" value={customGoalText} onChange={(e) => setCustomGoalText(e.target.value)} placeholder="例如：只能居家训练、只有哑铃…" /></label>
          <button className="btn btn-primary" type="button" onClick={() => setStep("daily")}>下一步：填写今日状态</button>
        </div>
      ) : null}

      {step === "daily" ? (
        <div className="card space-y-5 p-6">
          <div>
            <div className="label mb-2">今日工作负载</div>
            <div className="flex flex-wrap gap-2">
              {([["low","低"],["moderate","中"],["high","高"]] as const).map(([v,label]) => (
                <button key={v} type="button" className={`badge cursor-pointer ${workload === v ? "badge-brand" : ""}`} onClick={() => setWorkload(v)}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-2">昨晚睡眠质量：{sleepQuality}/5</div>
            <input className="input" type="range" min={1} max={5} value={sleepQuality} onChange={(e) => setSleepQuality(Number(e.target.value))} />
          </div>
          <div>
            <div className="label mb-2">今日精力</div>
            <div className="flex flex-wrap gap-2">
              {([["low","偏低"],["normal","正常"],["high","充沛"]] as const).map(([v,label]) => (
                <button key={v} type="button" className={`badge cursor-pointer ${energyLevel === v ? "badge-brand" : ""}`} onClick={() => setEnergyLevel(v)}>{label}</button>
              ))}
            </div>
          </div>
          <label className="block text-sm">额外备注<textarea className="textarea mt-1" value={extraNotes} onChange={(e) => setExtraNotes(e.target.value)} placeholder="例如：膝盖隐隐作痛、睡眠被打断…" /></label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" type="button" onClick={() => setStep("goal")}>上一步</button>
            <button className="btn btn-primary" type="button" disabled={loading} onClick={generate}>{loading ? "正在生成计划..." : "生成今日训练计划"}</button>
          </div>
        </div>
      ) : null}

      {step === "plan" && plan ? (
        <div className="space-y-4">
          <div className="card space-y-3 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="mt-1 text-sm text-stone-500">{plan.type} · {plan.durationMinutes} 分钟 · 强度 {plan.intensity}{plan.source ? ` · 来源 ${plan.source}` : ""}</p>
              </div>
              <button className="btn btn-primary" type="button" onClick={() => { setStep("player"); setExIndex(0); setSeconds(0); setPaused(false); }}>开始训练</button>
            </div>
            {plan.adjustmentReason ? (
              <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-4 text-sm leading-7 text-stone-700">
                <div className="mb-1 font-medium text-teal-900">教练调整说明</div>
                {plan.adjustmentReason}
              </div>
            ) : null}
            <div className="text-sm text-stone-600">饮水目标约 <b>{plan.wellnessTargets?.hydrationLiters ?? 2}</b> 升；拉伸关注：{(plan.wellnessTargets?.stretchFocus || []).join("、") || "全身放松"}</div>
          </div>
          <div className="space-y-3">
            {plan.exercises.map((e, i) => (
              <article key={`${e.name}-${i}`} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{i + 1}. {e.name}</h3>
                  <span className="badge">{e.category || "move"}</span>
                </div>
                <p className="mt-2 text-sm text-stone-600">{e.sets ? `${e.sets} 组 · ` : ""}{e.reps || e.duration || ""}{e.rest ? ` · ${e.rest}` : ""}{e.targetMuscle ? ` · ${e.targetMuscle}` : ""}</p>
                <p className="mt-2 text-sm leading-6 text-stone-700">{e.instruction}</p>
                {e.videoUrl ? <a className="mt-2 inline-block text-sm text-teal-700 underline" href={e.videoUrl} target="_blank" rel="noreferrer">Bilibili 教学搜索</a> : null}
              </article>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" type="button" onClick={() => setStep("daily")}>返回调整状态</button>
            <button className="btn btn-primary" type="button" disabled={loading} onClick={generate}>{loading ? "重新生成中..." : "重新生成"}</button>
          </div>
        </div>
      ) : null}

      {step === "plan" && !plan ? (
        <div className="card p-8 text-center">
          <p className="text-stone-600">还没有计划，先完成目标和今日状态。</p>
          <button className="btn btn-primary mt-4" type="button" onClick={() => setStep("goal")}>去设置</button>
        </div>
      ) : null}

      {step === "player" && plan && current ? (
        <div className="card space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs text-stone-500">动作 {exIndex + 1} / {plan.exercises.length}</div>
              <h2 className="text-2xl font-semibold">{current.name}</h2>
            </div>
            <div className="text-right text-sm">
              <div className="font-mono text-lg font-bold text-teal-700">{Math.floor(seconds / 60)}分{seconds % 60}秒</div>
              <div className="text-stone-500">累计课时</div>
            </div>
          </div>
          <p className="text-sm leading-7 text-stone-700">{current.instruction}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border p-3 text-center text-sm"><div className="text-stone-500">组数</div><div className="font-bold">{current.sets ?? "-"}</div></div>
            <div className="rounded-xl border p-3 text-center text-sm"><div className="text-stone-500">负荷</div><div className="font-bold">{current.reps || current.duration || "-"}</div></div>
            <div className="rounded-xl border p-3 text-center text-sm"><div className="text-stone-500">休息</div><div className="font-bold">{current.rest || "-"}</div></div>
            <div className="rounded-xl border p-3 text-center text-sm"><div className="text-stone-500">部位</div><div className="font-bold">{current.targetMuscle || "-"}</div></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" type="button" disabled={exIndex === 0} onClick={() => setExIndex((i) => Math.max(0, i - 1))}>上一个</button>
            <button className="btn btn-primary" type="button" onClick={() => setPaused((p) => !p)}>{paused ? "继续" : "暂停"}</button>
            <button className="btn btn-ghost" type="button" onClick={() => { if (exIndex + 1 < plan.exercises.length) setExIndex((i) => i + 1); else setStep("plan"); }}>
              {exIndex + 1 < plan.exercises.length ? "下一个" : "完成训练"}
            </button>
            {current.videoUrl ? <a className="btn btn-ghost" href={current.videoUrl} target="_blank" rel="noreferrer">看教学</a> : null}
          </div>
        </div>
      ) : null}

      {history.length > 1 ? (
        <div className="card p-4">
          <h3 className="font-semibold">历史计划</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {history.slice(0, 8).map((h) => (
              <li key={h.id}>
                <button type="button" className="text-left text-teal-800 hover:underline" onClick={() => { setPlan(h); setStep("plan"); }}>
                  {h.name} · {new Date(h.createdAt).toLocaleString("zh-CN")} · {h.intensity}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
