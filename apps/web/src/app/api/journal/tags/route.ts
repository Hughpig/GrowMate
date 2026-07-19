import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { safeJsonParse } from "@/lib/utils";

type AnalysisBlob = {
  event_tags?: string[];
  emotion_label?: string;
  personality_label?: string;
  values_label?: string;
  happiness_label?: string;
};

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const entries = await prisma.journalEntry.findMany({
    where: { userId: session.id },
    select: { tags: true, analysisJson: true },
  });

  const counts = new Map<string, { name: string; category: string; count: number }>();

  for (const entry of entries) {
    const analysis = safeJsonParse<AnalysisBlob>(entry.analysisJson, {});
    const layered: Array<[string, string]> = [
      ...((analysis.event_tags || []).map((t) => ["事件", t] as [string, string])),
      analysis.emotion_label ? (["情绪", analysis.emotion_label] as [string, string]) : null,
      analysis.personality_label ? (["性格", analysis.personality_label] as [string, string]) : null,
      analysis.values_label ? (["价值观", analysis.values_label] as [string, string]) : null,
      analysis.happiness_label ? (["幸福度", analysis.happiness_label] as [string, string]) : null,
    ].filter((x): x is [string, string] => Boolean(x));

    if (!layered.length) {
      for (const t of safeJsonParse<string[]>(entry.tags, [])) layered.push(["标签", t]);
    }

    for (const [category, name] of layered) {
      const key = `${category}::${name}`;
      const prev = counts.get(key);
      counts.set(key, { name, category, count: (prev?.count || 0) + 1 });
    }
  }

  const tags = [...counts.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN")
  );
  return NextResponse.json({ tags });
}
