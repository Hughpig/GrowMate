"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PostForm({
  communitySlug,
  defaultAnonymous = false,
}: {
  communitySlug: string;
  defaultAnonymous?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(defaultAnonymous);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communitySlug,
          title,
          content,
          isAnonymous,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "发帖失败");
        return;
      }
      setTitle("");
      setContent("");
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3 p-5">
      <h3 className="font-semibold">发布到本社区</h3>
      <input
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="标题"
        required
      />
      <textarea
        className="textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="真诚表达，互相陪伴"
        required
      />
      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
        />
        匿名发布
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="btn btn-primary" disabled={loading}>
        {loading ? "发布中..." : "发布"}
      </button>
    </form>
  );
}
