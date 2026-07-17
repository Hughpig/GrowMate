import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const modules = await prisma.courseModule.findMany({
    include: {
      courses: { orderBy: { order: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  const session = await getSession();
  let progressMap: Record<string, string> = {};
  if (session) {
    const progress = await prisma.courseProgress.findMany({
      where: { userId: session.id },
    });
    progressMap = Object.fromEntries(
      progress.map((p) => [p.courseId, p.status])
    );
  }

  return NextResponse.json({
    modules: modules.map((m) => ({
      ...m,
      courses: m.courses.map((c) => ({
        ...c,
        status: progressMap[c.id] || "not_started",
      })),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await req.json()) as { courseId?: string; status?: string };
  if (!body.courseId) {
    return NextResponse.json({ error: "缺少 courseId" }, { status: 400 });
  }
  const status = body.status || "completed";
  const progress = await prisma.courseProgress.upsert({
    where: {
      userId_courseId: { userId: session.id, courseId: body.courseId },
    },
    create: {
      userId: session.id,
      courseId: body.courseId,
      status,
      completedAt: status === "completed" ? new Date() : null,
    },
    update: {
      status,
      completedAt: status === "completed" ? new Date() : null,
    },
  });
  return NextResponse.json({ progress });
}
