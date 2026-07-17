import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, safeJsonParse } from "@/lib/utils";

export default async function JournalPage() {
  const session = await getSession();
  if (!session) return null;

  const entries = await prisma.journalEntry.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="section-title">成长日记</h1>
          <p className="muted mt-1 text-sm">
            碎片记录永久沉淀，形成独一无二的人生档案时间轴
          </p>
        </div>
        <Link href="/journal/new" className="btn btn-primary">
          新建记录
        </Link>
      </div>

      {!entries.length ? (
        <EmptyState
          title="档案还是空白"
          description="从今天的情绪、困惑或一点点进步开始写起。"
          actionHref="/journal/new"
          actionLabel="写下第一篇"
        />
      ) : (
        <div className="relative space-y-4 before:absolute before:left-4 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-stone-200">
          {entries.map((e) => {
            const tags = safeJsonParse<string[]>(e.tags, []);
            return (
              <article key={e.id} className="card relative ml-2 p-5 pl-10">
                <span className="absolute left-[-2px] top-6 h-3 w-3 rounded-full border-2 border-white bg-teal-600 shadow" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{e.title}</h2>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    {e.mood ? <span className="badge">情绪 {e.mood}/5</span> : null}
                    <span className="badge">{e.isPrivate ? "私密" : "可公开"}</span>
                    <span>{formatDate(e.createdAt)}</span>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-700">
                  {e.content}
                </p>
                {tags.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <span key={t} className="badge badge-violet">
                        #{t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
