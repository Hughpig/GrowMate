import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createToken,
  hashPassword,
  setAuthCookie,
} from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1).max(40),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const exists = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (exists) {
      return NextResponse.json({ error: "邮箱已被注册" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash: await hashPassword(body.password),
        displayName: body.displayName,
      },
    });

    await prisma.aiProfile.create({
      data: {
        userId: user.id,
        summary: "档案已创建，开始记录后将生成专属画像。",
      },
    });

    const token = await createToken({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "参数不合法" }, { status: 400 });
    }
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
