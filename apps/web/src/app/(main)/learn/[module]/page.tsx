import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CourseCompleteButton } from "@/components/CourseCompleteButton";
import { MODULE_META } from "@/lib/utils";

export default async function LearnModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: slug } = await params;
  const session = await getSession();
  const courseModule = await prisma.courseModule.findUnique({
    where: { slug },
    include: { courses: { orderBy: { order: "asc" } } },
  });
  if (!courseModule) notFound();

  let progressMap: Record<string, string> = {};
  if (session) {
    const progress = await prisma.courseProgress.findMany({
      where: {
        userId: session.id,
        courseId: { in: courseModule.courses.map((c) => c.id) },
      },
    });
    progressMap = Object.fromEntries(progress.map((p) => [p.courseId, p.status]));
  }

  const meta = MODULE_META[slug] || {
    name: courseModule.name,
    description: courseModule.description,
    color: "from-stone-400 to-stone-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/learn" className="text-sm text-teal-700">
          ← 返回课程模块
        </Link>
        <div className={`mt-3 h-2 w-24 rounded-full bg-gradient-to-r ${meta.color}`} />
        <h1 className="section-title mt-3">{meta.name}</h1>
        <p className="muted mt-1 text-sm">{meta.description}</p>
      </div>

      <div className="space-y-4">
        {courseModule.courses.map((c, idx) => {
          const status = progressMap[c.id] || "not_started";
          return (
            <article key={c.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-stone-400">第 {idx + 1} 课</div>
                  <h2 className="mt-1 text-lg font-bold">{c.title}</h2>
                  <p className="mt-1 text-sm text-stone-600">{c.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="badge">{c.level}</span>
                    <span className="badge">{c.durationMin} 分钟</span>
                    <span
                      className={`badge ${
                        status === "completed" ? "badge-brand" : ""
                      }`}
                    >
                      {status === "completed" ? "已完成" : "未开始"}
                    </span>
                  </div>
                </div>
                <CourseCompleteButton courseId={c.id} status={status} />
              </div>
              <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-stone-50 p-4 text-sm leading-7 text-stone-700">
                {c.content}
              </pre>
            </article>
          );
        })}
      </div>
    </div>
  );
}
