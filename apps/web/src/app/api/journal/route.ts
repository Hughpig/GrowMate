import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildUserProfile } from "@/lib/ai";

const schema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(10000),
  mood: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const entries = await prisma.journalEntry.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    const body = schema.parse(await req.json());
    const entry = await prisma.journalEntry.create({
      data: {
        userId: session.id,
        title: body.title,
        content: body.content,
        mood: body.mood,
        tags: JSON.stringify(body.tags || []),
        isPrivate: body.isPrivate ?? true,
      },
    });
    // 异步刷新画像（同步执行保证 demo 即时生效）
    await buildUserProfile(session.id);
    return NextResponse.json({ entry });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "参数不合法" }, { status: 400 });
    }
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
