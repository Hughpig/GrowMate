import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { safeJsonParse } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const rows = await prisma.trainingPlanRecord.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const plans = rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    durationMinutes: r.durationMinutes,
    intensity: r.intensity,
    adjustmentReason: r.adjustmentReason,
    exercises: safeJsonParse(r.exercisesJson, []),
    wellnessTargets: safeJsonParse(r.wellnessJson, { hydrationLiters: 2, stretchFocus: [] }),
    citations: safeJsonParse(r.citationsJson, []),
    createdAt: r.createdAt,
    source: r.source,
  }));
  return NextResponse.json({ plans });
}
