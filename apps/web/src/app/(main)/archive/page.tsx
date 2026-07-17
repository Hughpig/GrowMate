import Link from "next/link";
import { getSession } from "@/lib/auth";
import { buildUserProfile } from "@/lib/ai";
import { MoodChart } from "@/components/MoodChart";

export default async function ArchivePage() {
  const session = await getSession();
  if (!session) return null;
  const profile = await buildUserProfile(session.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="section-title">AI 个人成长档案</h1>
          <p className="muted mt-1 text-sm">
            动态更新的专属成长档案 & 心理人格档案
          </p>
        </div>
        <Link href="/ai" className="btn btn-primary">
          与 AI 对话解读档案
        </Link>
      </div>

      <div className="card p-6">
        <div className="badge badge-brand">档案摘要</div>
        <p className="mt-3 text-base leading-8 text-stone-700">{profile.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.personalityTags.map((t) => (
            <span key={t} className="badge badge-violet">
              {t}
            </span>
          ))}
          <span
            className={`badge ${
              profile.riskLevel === "alert"
                ? "badge-danger"
                : profile.riskLevel === "watch"
                  ? "badge-warn"
                  : "badge-brand"
            }`}
          >
            监护：
            {profile.riskLevel === "normal"
              ? "平稳"
              : profile.riskLevel === "watch"
                ? "关注"
                : "预警"}
          </span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card p-5">
          <h2 className="font-bold">优势建模</h2>
          <ul className="mt-3 space-y-2">
            {profile.strengths.map((s) => (
              <li key={s} className="rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-900">
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">可成长短板</h2>
          <ul className="mt-3 space-y-2">
            {profile.weaknesses.map((s) => (
              <li key={s} className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-900">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid-2">
        <div className="card p-5">
          <h2 className="font-bold">情绪规律</h2>
          <p className="mt-3 text-sm leading-7 text-stone-700">
            {profile.emotionPattern}
          </p>
          <div className="mt-4">
            <MoodChart data={profile.moodTrend} />
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">阶段性目标</h2>
          <ul className="mt-3 space-y-2">
            {profile.goals.map((g) => (
              <li key={g} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
                {g}
              </li>
            ))}
          </ul>
          <h3 className="mt-5 font-bold">个性化推荐</h3>
          <ul className="mt-3 space-y-2">
            {profile.recommendations.map((r) => (
              <li key={r} className="text-sm leading-6 text-stone-600">
                • {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
