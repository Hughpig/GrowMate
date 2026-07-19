import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { safeJsonParse } from "@/lib/utils";

const schema = z.object({
  type: z.enum(["fat-loss", "muscle-gain", "recovery"]),
  targetWeightLoss: z.number().positive().optional(),
  timelineWeeks: z.number().int().positive().optional(),
  focusAreas: z.array(z.string()).optional(),
  uncomfortableParts: z.array(z.string()).default([]),
  customGoalText: z.string().max(500).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const goal = await prisma.trainingGoal.findFirst({
    where: { userId: session.id },
    orderBy: { updatedAt: "desc" },
  });
  if (!goal) return NextResponse.json({ goal: null });
  return NextResponse.json({
    goal: {
      ...goal,
      focusAreas: safeJsonParse(goal.focusAreas, []),
      uncomfortableParts: safeJsonParse(goal.uncomfortableParts, []),
    },
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = schema.parse(await req.json());
    const existing = await prisma.trainingGoal.findFirst({
      where: { userId: session.id },
      orderBy: { updatedAt: "desc" },
    });
    const data = {
      type: body.type,
      targetWeightLoss: body.targetWeightLoss,
      timelineWeeks: body.timelineWeeks,
      focusAreas: JSON.stringify(body.focusAreas || []),
      uncomfortableParts: JSON.stringify(body.uncomfortableParts || []),
      customGoalText: body.customGoalText,
    };
    const goal = existing
      ? await prisma.trainingGoal.update({ where: { id: existing.id }, data })
      : await prisma.trainingGoal.create({ data: { userId: session.id, ...data } });
    return NextResponse.json({
      goal: {
        ...goal,
        focusAreas: safeJsonParse(goal.focusAreas, []),
        uncomfortableParts: safeJsonParse(goal.uncomfortableParts, []),
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "参数不合法" }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
