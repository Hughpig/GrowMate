"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EMOJI_RE, MAX_DIARY_LENGTH } from "@/lib/diary-constants";

type ScheduleCandidate = { title: string; startAt: string; location?: string; note?: string };
type Analysis = {
  event_tags?: string[];
  emotion_label?: string;
  personality_label?: string;
  values_label?: string;
  happiness_label?: string;
  schedule_candidate?: ScheduleCandidate | null;
};

function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function JournalForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(3);
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastAnalysis, setLastAnalysis] = useState<Analysis | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleEntryId, setScheduleEntryId] = useState<string | null>(null);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleStart, setScheduleStart] = useState("");
  const [reminderOffset, setReminderOffset] = useState(15);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState("");

  const clientHint = useMemo(() => {
    if (!content.trim()) return "请输入纯文字日记内容";
    if (content.length > MAX_DIARY_LENGTH) return `字数超限，单条最多 ${MAX_DIARY_LENGTH} 字`;
    if (EMOJI_RE.test(content) || /data:image\/|!\[.*\]\(|<img[\s>]/i.test(content)) {
      return "仅允许纯文字输入，不能包含图片或表情";
    }
    return "";
  }, [content]);

  function openScheduleDialog(entryId: string, candidate: ScheduleCandidate) {
    setScheduleEntryId(entryId);
    setScheduleTitle(candidate.title || "待办日程");
    setScheduleStart(toLocalInputValue(candidate.startAt));
    setReminderOffset(15);
    setScheduleMsg("");
    setScheduleOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (clientHint) { setError(clientHint); return; }
    setLoading(true); setError(""); setLastAnalysis(null);
    const payload = { title: title.trim() || undefined, content, mood, isPrivate };
    setContent("");
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "保存失败"); return; }
      setLastAnalysis(data.entry?.analysis || null);
      const candidate = data.entry?.analysis?.schedule_candidate as ScheduleCandidate | null | undefined;
      if (candidate?.startAt) openScheduleDialog(data.entry.id, candidate);
      else { router.push("/journal"); router.refresh(); }
    } catch { setError("网络错误"); }
    finally { setLoading(false); }
  }

  async function confirmSchedule() {
    if (!scheduleEntryId || !scheduleTitle.trim() || !scheduleStart) {
      setScheduleMsg("请填写日程标题与时间"); return;
    }
    setScheduleSaving(true); setScheduleMsg("");
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journalEntryId: scheduleEntryId,
          title: scheduleTitle.trim(),
          startAt: new Date(scheduleStart).toISOString(),
          reminderOffsetMinutes: reminderOffset,
          note: lastAnalysis?.schedule_candidate?.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setScheduleMsg(data.error || "创建日程失败"); return; }
      setScheduleOpen(false); router.push("/journal"); router.refresh();
    } catch { setScheduleMsg("网络错误"); }
    finally { setScheduleSaving(false); }
  }

  function skipSchedule() {
    setScheduleOpen(false); router.push("/journal"); router.refresh();
  }

  return (
    <>
      <form onSubmit={onSubmit} className="card space-y-4 p-6">
        <div>
          <label className="label">标题（可选）</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="不填则自动取正文前几字" />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="label">内容（纯文字，最多 {MAX_DIARY_LENGTH} 字）</label>
            <span className="text-xs text-stone-500">{content.length} / {MAX_DIARY_LENGTH}</span>
          </div>
          <textarea
            className="textarea min-h-40"
            value={content}
            onChange={(e) => {
              let next = e.target.value;
              if (EMOJI_RE.test(next)) {
                next = next.replace(EMOJI_RE, "");
                setError("已过滤表情，仅保留纯文字");
              }
              setContent(next);
            }}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text/plain") || "";
              const html = e.clipboardData.getData("text/html") || "";
              const items = [...(e.clipboardData?.items || [])];
              if (items.some((item) => item.type.startsWith("image/")) || /data:image\/|<img[\s>]/i.test(html) || /data:image\//i.test(text)) {
                e.preventDefault();
                setError("已拦截图文内容，仅允许纯文字");
              }
            }}
            placeholder="今天和朋友出去逛街了，还吃了饭，工作日晚上下班无事"
            required
          />
          <p className="mt-1 text-xs text-stone-500">保存后自动生成事件 / 情绪 / 性格 / 价值观 / 幸福度多层标签；识别到计划会询问是否加入日程。</p>
        </div>
        <div className="grid-2">
          <div>
            <label className="label">当下情绪（1-5）</label>
            <input className="input" type="range" min={1} max={5} value={mood} onChange={(e) => setMood(Number(e.target.value))} />
            <div className="mt-1 text-sm text-stone-500">当前：{mood}</div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
              仅自己可见（默认私密）
            </label>
          </div>
        </div>
        {clientHint ? <p className="text-sm text-amber-700">{clientHint}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {lastAnalysis ? (
          <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-3 text-sm">
            <div className="font-medium text-teal-900">刚刚生成的多层标签</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(lastAnalysis.event_tags || []).map((t) => (
                <span key={`e-${t}`} className="badge badge-brand">事件·{t}</span>
              ))}
              {lastAnalysis.emotion_label ? <span className="badge badge-violet">情绪·{lastAnalysis.emotion_label}</span> : null}
              {lastAnalysis.personality_label ? <span className="badge">性格·{lastAnalysis.personality_label}</span> : null}
              {lastAnalysis.values_label ? <span className="badge">价值观·{lastAnalysis.values_label}</span> : null}
              {lastAnalysis.happiness_label ? <span className="badge">幸福度·{lastAnalysis.happiness_label}</span> : null}
            </div>
          </div>
        ) : null}
        <button className="btn btn-primary" disabled={loading || !!clientHint}>
          {loading ? "分析并保存中..." : "沉淀到档案"}
        </button>
      </form>

      {scheduleOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md space-y-4 p-6">
            <div>
              <h2 className="text-lg font-semibold">识别到计划，加入日程？</h2>
              <p className="muted mt-1 text-sm">默认提前 {reminderOffset} 分钟提醒，可修改时间与标题。</p>
            </div>
            <div>
              <label className="label">标题</label>
              <input className="input" value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)} />
            </div>
            <div>
              <label className="label">开始时间</label>
              <input className="input" type="datetime-local" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} />
            </div>
            <div>
              <label className="label">提前提醒（分钟）</label>
              <input className="input" type="number" min={0} max={1440} value={reminderOffset} onChange={(e) => setReminderOffset(Number(e.target.value) || 0)} />
            </div>
            {scheduleMsg ? <p className="text-sm text-red-600">{scheduleMsg}</p> : null}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={skipSchedule} disabled={scheduleSaving}>暂不加入</button>
              <button type="button" className="btn btn-primary" onClick={confirmSchedule} disabled={scheduleSaving}>
                {scheduleSaving ? "创建中..." : "确认加入日程"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
