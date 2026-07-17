"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CourseCompleteButton({
  courseId,
  status,
}: {
  courseId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const done = status === "completed";

  async function mark() {
    if (done || loading) return;
    setLoading(true);
    try {
      await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, status: "completed" }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={`btn ${done ? "btn-secondary" : "btn-primary"}`}
      onClick={() => void mark()}
      disabled={done || loading}
    >
      {done ? "已完成" : loading ? "记录中..." : "标记完成"}
    </button>
  );
}
