import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildUserProfile } from "@/lib/ai";
import { MoodChart } from "@/components/MoodChart";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const profile = await buildUserProfile(session.id);
  const recentJournals = await prisma.journalEntry.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="section-title">你好，{session.displayName}</h1>
          <p className="muted mt-1 text-sm">
            今天也值得被记录。你的成长档案正在持续进化。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/journal/new" className="btn btn-primary">
            写日记
          </Link>
          <Link href="/mood" className="btn btn-secondary">
            情绪打卡
          </Link>
          <Link href="/ai" className="btn btn-secondary">
            AI 陪伴
          </Link>
        </div>
      </div>

      {profile.riskLevel !== "normal" ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            profile.riskLevel === "alert"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-orange-200 bg-orange-50 text-orange-800"
          }`}
        >
          心理监护提示：检测到近期情绪
          {profile.riskLevel === "alert" ? "持续偏低" : "波动偏大"}。
          建议优先进行情绪疏导，或前往
          <Link href="/community/mental" className="mx-1 font-semibold underline">
            情绪心理社区
          </Link>
          /
          <Link href="/learn/mental" className="mx-1 font-semibold underline">
            心理健康课程
          </Link>
          。
        </div>
      ) : null}

      <div className="grid-3">
        {[
          ["日记沉淀", profile.stats.journalCount, "篇"],
          ["情绪打卡", profile.stats.moodCount, "次"],
          ["社区表达", profile.stats.postCount, "帖"],
          ["平均情绪", profile.stats.avgMood ?? "—", "/5"],
          ["平均压力", profile.stats.avgStress ?? "—", "/5"],
          [
            "监护状态",
            profile.riskLevel === "normal"
              ? "平稳"
              : profile.riskLevel === "watch"
                ? "关注"
                : "预警",
            "",
          ],
        ].map(([label, value, unit]) => (
          <div key={String(label)} className="card p-5">
            <div className="text-sm text-stone-500">{label}</div>
            <div className="mt-2 text-3xl font-bold tracking-tight">
              {value}
              <span className="ml-1 text-sm font-medium text-stone-400">
                {unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">情绪与压力曲线</h2>
            <Link href="/mood" className="text-sm text-teal-700">
              去打卡 →
            </Link>
          </div>
          <MoodChart data={profile.moodTrend} />
        </div>
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-bold">AI 今日推荐</h2>
          <ul className="mt-3 space-y-2">
            {profile.recommendations.map((r) => (
              <li
                key={r}
                className="rounded-xl bg-white/80 px-3 py-2 text-sm leading-6 text-stone-700"
              >
                {r}
              </li>
            ))}
          </ul>
          <Link href="/archive" className="btn btn-secondary mt-4 w-full">
            查看完整 AI 档案
          </Link>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">最近成长记录</h2>
          <Link href="/journal" className="text-sm text-teal-700">
            全部日记 →
          </Link>
        </div>
        <div className="space-y-3">
          {recentJournals.map((j) => (
            <div
              key={j.id}
              className="rounded-xl border border-stone-200 bg-white/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{j.title}</h3>
                <span className="text-xs text-stone-400">
                  {formatDate(j.createdAt)}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                {j.content}
              </p>
            </div>
          ))}
          {!recentJournals.length ? (
            <p className="text-sm text-stone-500">还没有日记，去写第一篇吧。</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
