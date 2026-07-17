import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { assessMoodRisk, buildUserProfile } from "@/lib/ai";

const schema = z.object({
  score: z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5).optional(),
  stress: z.number().int().min(1).max(5).optional(),
  note: z.string().max(2000).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const logs = await prisma.moodLog.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ logs });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    const body = schema.parse(await req.json());
    const energy = body.energy ?? 3;
    const stress = body.stress ?? 3;
    const riskLevel = assessMoodRisk(body.score, stress, body.note);
    const log = await prisma.moodLog.create({
      data: {
        userId: session.id,
        score: body.score,
        energy,
        stress,
        note: body.note,
        riskLevel,
      },
    });
    await buildUserProfile(session.id);
    return NextResponse.json({ log, riskLevel });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "参数不合法" }, { status: 400 });
    }
    return NextResponse.json({ error: "打卡失败" }, { status: 500 });
  }
}
