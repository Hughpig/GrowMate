import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { safeJsonParse } from "@/lib/utils";

type ProgressInfo = {
  status: string;
  notes: string;
  studyTime: number;
};

type Lesson = {
  title?: string;
  content?: string;
  codeExamples?: unknown[];
  exercises?: unknown[];
};

function parseLessons(raw: unknown): Lesson[] {
  if (Array.isArray(raw)) return raw as Lesson[];
  if (typeof raw !== "string" || !raw.trim()) return [];
  return safeJsonParse<Lesson[]>(raw, []);
}

export async function GET() {
  const modules = await prisma.courseModule.findMany({
    include: {
      courses: { orderBy: { order: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  const session = await getSession();
  let progressMap: Record<string, ProgressInfo> = {};
  if (session) {
    const progress = await prisma.courseProgress.findMany({
      where: { userId: session.id },
    });
    progressMap = Object.fromEntries(
      progress.map((p) => [
        p.courseId,
        {
          status: p.status,
          notes: p.notes ?? "",
          studyTime: p.studyTime ?? 0,
        },
      ])
    );
  }

  return NextResponse.json({
    modules: modules.map((m) => ({
      ...m,
      courses: m.courses.map((c) => ({
        ...c,
        lessons: parseLessons((c as { lessons?: unknown }).lessons),
        progress: progressMap[c.id] || {
          status: "not_started",
          notes: "",
          studyTime: 0,
        },
      })),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await req.json()) as {
    courseId?: string;
    status?: string;
    notes?: string;
    studyTime?: number;
  };
  if (!body.courseId) {
    return NextResponse.json({ error: "缺少 courseId" }, { status: 400 });
  }
  const status = body.status || "completed";
  const completedAt = status === "completed" ? new Date() : null;

  const progress = await prisma.courseProgress.upsert({
    where: {
      userId_courseId: { userId: session.id, courseId: body.courseId },
    },
    create: {
      userId: session.id,
      courseId: body.courseId,
      status,
      completedAt,
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.studyTime !== undefined ? { studyTime: body.studyTime } : {}),
    },
    update: {
      status,
      completedAt,
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.studyTime !== undefined ? { studyTime: body.studyTime } : {}),
    },
  });
  return NextResponse.json({ progress });
}