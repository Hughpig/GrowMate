import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PostForm } from "@/components/PostForm";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = await prisma.community.findUnique({
    where: { slug },
  });
  if (!community) notFound();

  const posts = await prisma.post.findMany({
    where: { communityId: community.id },
    include: {
      author: { select: { displayName: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/community" className="text-sm text-teal-700">
          ← 返回社区列表
        </Link>
        <h1 className="section-title mt-2">{community.name}</h1>
        <p className="muted mt-1 text-sm">{community.description}</p>
        {community.slug === "mental" ? (
          <div className="mt-3 rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-900">
            本区鼓励无评判倾诉。你可以选择匿名。若遇到危机情绪，请同时寻求现实支持。
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {posts.map((p) => (
            <article key={p.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{p.title}</h2>
                <span className="text-xs text-stone-400">
                  {formatDate(p.createdAt)}
                </span>
              </div>
              <div className="mt-1 text-xs text-stone-500">
                {p.isAnonymous ? "匿名用户" : p.author.displayName}
                {" · "}
                {p._count.comments} 评论
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-700">
                {p.content}
              </p>
            </article>
          ))}
          {!posts.length ? (
            <div className="card p-8 text-center text-sm text-stone-500">
              还没有帖子，来发第一条温暖的表达吧。
            </div>
          ) : null}
        </div>
        <div className="lg:col-span-2">
          <PostForm
            communitySlug={community.slug}
            defaultAnonymous={community.slug === "mental"}
          />
        </div>
      </div>
    </div>
  );
}
