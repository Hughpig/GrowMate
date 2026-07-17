import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function CommunityIndexPage() {
  const communities = await prisma.community.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">垂直陪伴社区</h1>
        <p className="muted mt-1 text-sm">
          分区隔离、氛围纯净：有人听、有人陪、有人教、一起成长
        </p>
      </div>
      <div className="grid-2">
        {communities.map((c) => (
          <Link
            key={c.id}
            href={`/community/${c.slug}`}
            className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{c.name}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {c.description}
                </p>
              </div>
              <span className="badge">{c._count.posts} 帖</span>
            </div>
            <div className="mt-4 text-sm font-medium text-teal-700">进入社区 →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
