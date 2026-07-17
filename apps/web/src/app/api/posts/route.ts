import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  communitySlug: z.string(),
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(5000),
  isAnonymous: z.boolean().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("community");

  const posts = await prisma.post.findMany({
    where: slug ? { community: { slug } } : undefined,
    include: {
      community: true,
      author: { select: { id: true, displayName: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    posts: posts.map((p) => ({
      ...p,
      authorName: p.isAnonymous ? "匿名用户" : p.author.displayName,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    const body = schema.parse(await req.json());
    const community = await prisma.community.findUnique({
      where: { slug: body.communitySlug },
    });
    if (!community) {
      return NextResponse.json({ error: "社区不存在" }, { status: 404 });
    }
    const post = await prisma.post.create({
      data: {
        communityId: community.id,
        authorId: session.id,
        title: body.title,
        content: body.content,
        isAnonymous: body.isAnonymous ?? community.slug === "mental",
      },
    });
    return NextResponse.json({ post });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "参数不合法" }, { status: 400 });
    }
    return NextResponse.json({ error: "发帖失败" }, { status: 500 });
  }
}
