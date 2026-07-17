"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState(mode === "login" ? "demo@growmate.app" : "");
  const [password, setPassword] = useState(mode === "login" ? "demo123456" : "");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login"
            ? { email, password }
            : { email, password, displayName }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "请求失败");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto w-full max-w-md space-y-4 p-6">
      <div>
        <h1 className="section-title">
          {mode === "login" ? "欢迎回来" : "创建你的成长档案"}
        </h1>
        <p className="muted mt-1 text-sm">
          {mode === "login"
            ? "继续你的长期沉淀与专属陪伴"
            : "从第一篇记录开始，AI 将逐步理解你"}
        </p>
      </div>

      {mode === "register" ? (
        <div>
          <label className="label">昵称</label>
          <input
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="你希望被如何称呼"
            required
          />
        </div>
      ) : null}

      <div>
        <label className="label">邮箱</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label">密码</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button className="btn btn-primary w-full" disabled={loading}>
        {loading ? "处理中..." : mode === "login" ? "登录" : "注册并开启"}
      </button>

      {mode === "login" ? (
        <p className="text-center text-sm text-stone-500">
          演示账号已预填：demo@growmate.app / demo123456
        </p>
      ) : null}
    </form>
  );
}
