import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const createSchema = z.object({
  journalEntryId: z.string().optional(),
  title: z.string().min(1).max(100),
  startAt: z.string().min(1),
  endAt: z.string().optional(),
  location: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
  reminderOffsetMinutes: z.number().int().min(0).max(24 * 60).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const schedules = await prisma.diarySchedule.findMany({
    where: { userId: session.id },
    orderBy: { startAt: "asc" },
  });
  return NextResponse.json({ schedules });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = createSchema.parse(await req.json());
    const startAt = new Date(body.startAt);
    if (Number.isNaN(startAt.getTime())) return NextResponse.json({ error: "开始时间不合法" }, { status: 400 });
    const endAt = body.endAt ? new Date(body.endAt) : null;
    if (endAt && Number.isNaN(endAt.getTime())) return NextResponse.json({ error: "结束时间不合法" }, { status: 400 });
    if (body.journalEntryId) {
      const entry = await prisma.journalEntry.findFirst({ where: { id: body.journalEntryId, userId: session.id } });
      if (!entry) return NextResponse.json({ error: "日记不存在" }, { status: 404 });
    }
    const schedule = await prisma.diarySchedule.create({
      data: {
        userId: session.id,
        journalEntryId: body.journalEntryId,
        title: body.title,
        startAt,
        endAt: endAt ?? undefined,
        location: body.location,
        note: body.note,
        source: "diary",
        reminderOffsetMinutes: body.reminderOffsetMinutes ?? 15,
      },
    });
    return NextResponse.json({ schedule });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "参数不合法" }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
