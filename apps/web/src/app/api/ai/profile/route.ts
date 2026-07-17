import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { buildUserProfile } from "@/lib/ai";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const profile = await buildUserProfile(session.id);
  return NextResponse.json({ profile });
}

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const profile = await buildUserProfile(session.id);
  return NextResponse.json({ profile });
}
