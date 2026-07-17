import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const COOKIE_NAME = "growmate_token";
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "growmate-dev-secret-change-me-in-production"
);

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: SessionUser) {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      id: payload.sub,
      email: payload.email,
      displayName:
        typeof payload.displayName === "string" ? payload.displayName : "User",
    };
  } catch {
    return null;
  }
}

// 客户端版本 - 使用 document.cookie
export function getClientSession(): Promise<SessionUser | null> {
  return new Promise((resolve) => {
    try {
      const cookies = document.cookie.split(';');
      let token = null;
      
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === COOKIE_NAME) {
          token = value;
          break;
        }
      }
      
      if (!token) {
        resolve(null);
        return;
      }
      
      // 在客户端，我们无法验证 token，只能返回基本信息
      // 实际的验证应该在服务端进行
      resolve(null);
    } catch (error) {
      resolve(null);
    }
  });
}

// 简化的客户端会话检查
export async function getSessionClient(): Promise<SessionUser | null> {
  try {
    const response = await fetch('/api/auth/session');
    if (!response.ok) return null;
    const session = await response.json();
    return session;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  // 客户端版本
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days
  
  document.cookie = `${COOKIE_NAME}=${token}; expires=${expires.toUTCString()}; path=/; ${
    process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
  }SameSite=Lax`;
}

export async function clearAuthCookie() {
  // 客户端版本
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// 服务端版本保持不变
export async function setAuthCookieServer(token: string) {
  // 这个函数只在服务端使用
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookieServer() {
  // 这个函数只在服务端使用
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  // 服务端版本
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, displayName: true },
  });
  return user;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}