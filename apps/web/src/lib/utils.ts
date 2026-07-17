import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const MOOD_LABELS = ["很差", "偏低", "一般", "不错", "很好"] as const;

export const COMMUNITY_META: Record<
  string,
  { name: string; description: string; tone: string }
> = {
  growth: {
    name: "成长日记",
    description: "分享感悟、复盘、人生经历与自我成长",
    tone: "supportive",
  },
  mental: {
    name: "情绪心理",
    description: "纯情绪出口，倾诉压力与心事，无评判交流",
    tone: "healing",
  },
  fitness: {
    name: "运动体能",
    description: "训练打卡、健身经验、互相监督",
    tone: "training",
  },
  nutrition: {
    name: "饮食营养",
    description: "食谱分享、健康饮食、身材管理互助",
    tone: "supportive",
  },
  tech: {
    name: "技术学习",
    description: "编程、Linux、AI 自学交流与答疑",
    tone: "learning",
  },
};

export const MODULE_META: Record<
  string,
  { name: string; description: string; color: string }
> = {
  fitness: {
    name: "体能训练",
    description: "居家/户外训练、体态矫正、科学打卡",
    color: "from-orange-400 to-rose-500",
  },
  nutrition: {
    name: "营养搭配",
    description: "饮食搭配、减脂增肌、健康作息指导",
    color: "from-emerald-400 to-teal-500",
  },
  tech: {
    name: "技术学习",
    description: "Linux / Python / 自动化 / AI 入门",
    color: "from-sky-400 to-indigo-500",
  },
  mental: {
    name: "心理健康",
    description: "情绪疏导、认知调整、轻量心理监护",
    color: "from-violet-400 to-fuchsia-500",
  },
};