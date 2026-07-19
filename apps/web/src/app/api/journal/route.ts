import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildUserProfile } from "@/lib/ai";
import { analyzeDiaryEntry, flattenAnalysisTags } from "@/lib/diary-analysis";
import { timePeriodFromDate, validateDiaryText } from "@/lib/diary-validate";
import { safeJsonParse } from "@/lib/utils";

const schema = z.object({
  title: z.string().max(100).optional(),
  content: z.string().min(1).max(2000),
  mood: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().optional(),
});

function serializeEntry(entry: {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: number | null;
  tags: string;
  isPrivate: boolean;
  timePeriod: string;
  analysisStatus: string;
  analysisJson: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...entry,
    tags: safeJsonParse<string[]>(entry.tags, []),
    analysis: safeJsonParse(entry.analysisJson, null),
  };
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag")?.trim();
  const date = searchParams.get("date")?.trim();
  const entries = await prisma.journalEntry.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });
  let filtered = entries;
  if (date) filtered = filtered.filter((e) => e.createdAt.toISOString().slice(0, 10) === date);
  if (tag) filtered = filtered.filter((e) => safeJsonParse<string[]>(e.tags, []).includes(tag));
  return NextResponse.json({ entries: filtered.map(serializeEntry) });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const body = schema.parse(await req.json());
    const content = body.content.trim();
    const validationError = validateDiaryText(content);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    const analysis = await analyzeDiaryEntry(content);
    const tags = [...new Set([...(body.tags || []), ...flattenAnalysisTags(analysis)])];
    const title =
      (body.title && body.title.trim()) ||
      content.replace(/\s+/g, " ").slice(0, 24) ||
      "无标题日记";
    const entry = await prisma.journalEntry.create({
      data: {
        userId: session.id,
        title,
        content,
        mood: body.mood,
        tags: JSON.stringify(tags),
        isPrivate: body.isPrivate ?? true,
        timePeriod: timePeriodFromDate(),
        analysisStatus: "done",
        analysisJson: JSON.stringify(analysis),
      },
    });
    await buildUserProfile(session.id);
    return NextResponse.json({ entry: serializeEntry(entry) });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "参数不合法" }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
