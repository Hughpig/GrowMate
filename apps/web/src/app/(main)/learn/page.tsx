import Link from "next/link";
import { prisma } from "@/lib/db";
import { MODULE_META } from "@/lib/utils";

export default async function LearnPage() {
  const modules = await prisma.courseModule.findMany({
    include: { _count: { select: { courses: true } } },
  });

  const order = ["fitness", "nutrition", "tech", "mental"];
  modules.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">四大专业成长模块</h1>
        <p className="muted mt-1 text-sm">
          团队结构化内容体系，结合 AI 档案进行个性化投喂
        </p>
      </div>
      <div className="grid-2">
        {modules.map((m) => {
          const meta = MODULE_META[m.slug] || {
            name: m.name,
            description: m.description,
            color: "from-stone-400 to-stone-600",
          };
          return (
            <Link
              key={m.id}
              href={`/learn/${m.slug}`}
              className="card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={`h-2 bg-gradient-to-r ${meta.color}`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold">{meta.name}</h2>
                  <span className="badge">{m._count.courses} 课</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {meta.description}
                </p>
                <div className="mt-4 text-sm font-medium text-teal-700">
                  进入模块 →
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
