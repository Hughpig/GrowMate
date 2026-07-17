import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { companionReply } from "@/lib/ai";

const schema = z.object({
  message: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    const body = schema.parse(await req.json());
    const result = await companionReply(session.id, body.message);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "参数不合法" }, { status: 400 });
    }
    return NextResponse.json({ error: "对话失败" }, { status: 500 });
  }
}
