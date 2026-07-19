import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateTrainingPlan } from "@/lib/training-plan";
import type { DailyStatus, LongTermGoal } from "@/lib/training-types";

const schema = z.object({
  longTermGoal: z.object({
    type: z.enum(["fat-loss", "muscle-gain", "recovery"]),
    targetWeightLoss: z.number().optional(),
    timelineWeeks: z.number().optional(),
    focusAreas: z.array(z.string()).optional(),
    uncomfortableParts: z.array(z.string()).default([]),
    customGoalText: z.string().optional(),
  }),
  dailyStatus: z.object({
    workload: z.enum(["low", "moderate", "high"]),
    sleepQuality: z.number().int().min(1).max(5),
    energyLevel: z.enum(["low", "normal", "high"]),
    voiceTranscript: z.string().optional(),
    extraNotes: z.string().optional(),
  }),
  saveGoal: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = schema.parse(await req.json());
    const goal = body.longTermGoal as LongTermGoal;
    const daily = body.dailyStatus as DailyStatus;

    if (body.saveGoal !== false) {
      const existing = await prisma.trainingGoal.findFirst({
        where: { userId: session.id },
        orderBy: { updatedAt: "desc" },
      });
      const data = {
        type: goal.type,
        targetWeightLoss: goal.targetWeightLoss,
        timelineWeeks: goal.timelineWeeks,
        focusAreas: JSON.stringify(goal.focusAreas || []),
        uncomfortableParts: JSON.stringify(goal.uncomfortableParts || []),
        customGoalText: goal.customGoalText,
      };
      if (existing) await prisma.trainingGoal.update({ where: { id: existing.id }, data });
      else await prisma.trainingGoal.create({ data: { userId: session.id, ...data } });
    }

    const plan = await generateTrainingPlan(goal, daily);
    const record = await prisma.trainingPlanRecord.create({
      data: {
        userId: session.id,
        name: plan.name,
        type: plan.type,
        durationMinutes: plan.durationMinutes,
        intensity: plan.intensity,
        adjustmentReason: plan.adjustmentReason || "",
        exercisesJson: JSON.stringify(plan.exercises),
        wellnessJson: JSON.stringify(plan.wellnessTargets),
        citationsJson: JSON.stringify(plan.citations || []),
        goalSnapshotJson: JSON.stringify(goal),
        dailyStatusJson: JSON.stringify(daily),
        source: plan.source || "local",
      },
    });

    return NextResponse.json({ plan: { ...plan, id: record.id }, recordId: record.id });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "参数不合法", details: e.flatten() }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
