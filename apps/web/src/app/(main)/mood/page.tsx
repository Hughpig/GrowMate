import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MoodForm } from "@/components/MoodForm";
import { MoodChart } from "@/components/MoodChart";
import { formatDate } from "@/lib/utils";

export default async function MoodPage() {
  const session = await getSession();
  if (!session) return null;

  const logs = await prisma.moodLog.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const chartData = [...logs]
    .reverse()
    .map((m) => ({
      date: m.createdAt.toISOString().slice(0, 10),
      score: m.score,
      stress: m.stress,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">情绪打卡</h1>
        <p className="muted mt-1 text-sm">
          轻量心理监护的数据入口：情绪、精力、压力与备注
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <MoodForm />
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold">最近曲线</h2>
            <div className="mt-3">
              <MoodChart data={chartData} />
            </div>
          </div>
          <div className="card p-5">
            <h2 className="font-bold">打卡历史</h2>
            <div className="mt-3 space-y-2">
              {logs.map((l) => (
                <div
                  key={l.id}
                  className="flex items-start justify-between gap-3 rounded-xl bg-white/80 px-3 py-2 text-sm"
                >
                  <div>
                    <div>
                      情绪 {l.score} · 精力 {l.energy} · 压力 {l.stress}
                    </div>
                    {l.note ? (
                      <div className="mt-1 text-stone-500">{l.note}</div>
                    ) : null}
                  </div>
                  <div className="text-right text-xs text-stone-400">
                    <div>{formatDate(l.createdAt)}</div>
                    <div
                      className={
                        l.riskLevel === "alert"
                          ? "text-red-600"
                          : l.riskLevel === "watch"
                            ? "text-orange-600"
                            : "text-teal-700"
                      }
                    >
                      {l.riskLevel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
