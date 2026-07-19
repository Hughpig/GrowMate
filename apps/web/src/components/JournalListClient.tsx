"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

type Analysis = {
  event_tags?: string[];
  emotion_label?: string;
  personality_label?: string;
  values_label?: string;
  happiness_label?: string;
};
type Entry = {
  id: string; title: string; content: string; mood: number | null; tags: string[];
  isPrivate: boolean; timePeriod?: string; analysis?: Analysis | null; createdAt: string;
};
type TagStat = { name: string; category: string; count: number };
type Schedule = { id: string; title: string; startAt: string; reminderOffsetMinutes: number };

export function JournalListClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tags, setTags] = useState<TagStat[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAll(tag = selectedTag, d = date) {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (tag) params.set("tag", tag);
      if (d) params.set("date", d);
      const [entriesRes, tagsRes, schedulesRes] = await Promise.all([
        fetch(`/api/journal?${params.toString()}`),
        fetch("/api/journal/tags"),
        fetch("/api/schedules"),
      ]);
      if (!entriesRes.ok) throw new Error("加载日记失败");
      const entriesData = await entriesRes.json();
      setEntries(entriesData.entries || []);
      if (tagsRes.ok) setTags((await tagsRes.json()).tags || []);
      if (schedulesRes.ok) setSchedules((await schedulesRes.json()).schedules || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const upcoming = useMemo(
    () => schedules.filter((s) => new Date(s.startAt).getTime() >= Date.now() - 60 * 60 * 1000).slice(0, 5),
    [schedules]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="section-title">成长日记</h1>
          <p className="muted mt-1 text-sm">纯文字沉淀 + AI 多层标签（事件 / 情绪 / 性格 / 价值观 / 幸福度），识别计划可加入日程</p>
        </div>
        <Link href="/journal/new" className="btn btn-primary">新建记录</Link>
      </div>

      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-stone-600">
            日期
            <input type="date" className="input ml-2 w-auto" value={date} onChange={(e) => { setDate(e.target.value); loadAll(selectedTag, e.target.value); }} />
          </label>
          <button className="btn btn-ghost" onClick={() => { setSelectedTag(""); setDate(""); loadAll("", ""); }}>清除筛选</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 ? (
            <span className="text-sm text-stone-500">暂无标签，写几条日记后会自动出现</span>
          ) : tags.map((tag) => (
            <button
              key={`${tag.category}-${tag.name}`}
              className={`badge cursor-pointer ${selectedTag === tag.name ? "badge-brand" : ""}`}
              onClick={() => {
                const next = selectedTag === tag.name ? "" : tag.name;
                setSelectedTag(next);
                loadAll(next, date);
              }}
            >
              {tag.category}·{tag.name} ({tag.count})
            </button>
          ))}
        </div>
      </div>

      {upcoming.length ? (
        <div className="card p-4">
          <h2 className="font-semibold">即将到来的日程</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {upcoming.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{s.title}</span>
                <span className="text-stone-500">{formatDate(s.startAt)} · 提前 {s.reminderOffsetMinutes} 分钟</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-stone-500">加载中...</p> : null}

      {!loading && !entries.length ? (
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold">档案还是空白</h2>
          <p className="muted mt-2 text-sm">从今天的情绪、想法或一点点进步开始写起。</p>
          <Link href="/journal/new" className="btn btn-primary mt-4">写下第一篇</Link>
        </div>
      ) : null}

      <div className="relative space-y-4 before:absolute before:left-4 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-stone-200">
        {entries.map((e) => (
          <article key={e.id} className="card relative ml-2 p-5 pl-10">
            <span className="absolute left-[-2px] top-6 h-3 w-3 rounded-full border-2 border-white bg-teal-600 shadow" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{e.title}</h2>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                {e.timePeriod ? <span className="badge">{e.timePeriod}</span> : null}
                {e.mood ? <span className="badge">情绪 {e.mood}/5</span> : null}
                <span className="badge">{e.isPrivate ? "私密" : "可公开"}</span>
                <span>{formatDate(e.createdAt)}</span>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-700">{e.content}</p>
            {e.analysis ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(e.analysis.event_tags || []).map((t) => (
                  <span key={`${e.id}-event-${t}`} className="badge badge-brand">事件·{t}</span>
                ))}
                {e.analysis.emotion_label ? <span className="badge badge-violet">情绪·{e.analysis.emotion_label}</span> : null}
                {e.analysis.personality_label ? <span className="badge">性格·{e.analysis.personality_label}</span> : null}
                {e.analysis.values_label ? <span className="badge">价值观·{e.analysis.values_label}</span> : null}
                {e.analysis.happiness_label ? <span className="badge">幸福度·{e.analysis.happiness_label}</span> : null}
              </div>
            ) : e.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {e.tags.map((t) => <span key={`${e.id}-${t}`} className="badge badge-violet">#{t}</span>)}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
