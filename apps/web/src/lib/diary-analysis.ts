export type ScheduleCandidate = {
  title: string;
  startAt: string;
  location?: string;
  note?: string;
};

export type DiaryAnalysis = {
  event_tags: string[];
  emotion_label: string;
  personality_label: string;
  values_label: string;
  happiness_label: string;
  schedule_candidate: ScheduleCandidate | null;
  model_version: string;
};

const EVENT_RULES: Array<[string, string[]]> = [
  ["社交", ["朋友", "同事", "聚会", "聊天", "约", "见面", "老公", "老婆", "家人"]],
  ["朋友", ["朋友", "闺蜜"]],
  ["吃饭", ["吃饭", "吃了饭", "晚餐", "午餐", "早餐", "饭店", "火锅", "喝咖啡"]],
  ["工作轻闲", ["下班无事", "工作日晚上下班无事", "不忙"]],
  ["工作投入", ["加班", "项目", "开会", "汇报", "任务"]],
  ["购物", ["购物", "衣服", "裤子", "搭配", "买"]],
  ["休闲", ["看电影", "散步", "旅行", "放松"]],
  ["健康", ["生病", "不舒服", "医院", "吃药", "头疼"]],
];

const NEGATIVE = ["累", "加班", "没等我", "难过", "焦虑", "生气", "失望", "压力", "崩溃"];
const POSITIVE = ["开心", "放松", "幸福", "满足", "顺利", "舒服", "喜欢", "很好"];
const SOCIAL_REWARD = ["朋友", "逛街", "吃饭", "吃了饭", "放松"];
const PLAN_WORDS = [
  "明天", "后天", "下周", "周一", "周二", "周三", "周四", "周五", "周六", "周日",
  "星期", "点", "预约", "计划", "打算", "准备", "要去", "开会", "看电影",
];

function chineseNumber(text: string): number | null {
  const map: Record<string, number> = {
    "零": 0, "一": 1, "二": 2, "两": 2, "三": 3, "四": 4, "五": 5,
    "六": 6, "七": 7, "八": 8, "九": 9, "十": 10,
  };
  if (map[text] !== undefined) return map[text];
  if (text === "十一") return 11;
  if (text === "十二") return 12;
  if (/^\d{1,2}$/.test(text)) return Number(text);
  return null;
}

export function detectScheduleCandidate(content: string, now = new Date()): ScheduleCandidate | null {
  if (!PLAN_WORDS.some((w) => content.includes(w))) return null;

  let start = new Date(now);
  if (content.includes("明天")) {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 0, 0);
  } else if (content.includes("后天")) {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 15, 0, 0);
  } else {
    const md = content.match(/(\d{1,2})月(\d{1,2})日/);
    if (md) {
      const month = Number(md[1]) - 1;
      const day = Number(md[2]);
      start = new Date(now.getFullYear(), month, day, 15, 0, 0);
      if (start < now) start.setFullYear(start.getFullYear() + 1);
    }
  }

  const timeMatch =
    content.match(/(上午|下午|晚上)?\s*([一二三四五六七八九十两\d]{1,2})\s*点\s*([半一二三四五六七八九十\d]+)?\s*分?/) ||
    content.match(/(\d{1,2}):(\d{2})/);

  if (timeMatch) {
    if (timeMatch[0].includes(":")) {
      start.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
    } else {
      const period = timeMatch[1] || "";
      let hour = chineseNumber(timeMatch[2] || "") ?? 15;
      let minute = 0;
      if (timeMatch[3] === "半") minute = 30;
      else if (timeMatch[3]) minute = chineseNumber(timeMatch[3]) ?? 0;
      if ((period === "下午" || period === "晚上") && hour < 12) hour += 12;
      if (period === "上午" && hour === 12) hour = 0;
      start.setHours(hour, minute, 0, 0);
    }
  } else if (!content.includes("明天") && !content.includes("后天")) {
    start.setHours(Math.max(now.getHours() + 1, 15), 0, 0, 0);
  }

  let title = content.slice(0, 40).replace(/\s+/g, " ").trim();
  if (content.includes("看电影")) title = "看电影";
  else if (content.includes("开会")) title = "开会";
  else if (content.includes("约会") || content.includes("见面")) title = "与朋友见面";

  return {
    title: title || "待办日程",
    startAt: start.toISOString(),
    note: content.slice(0, 120),
  };
}

export function localDiaryAnalysis(content: string, now = new Date()): DiaryAnalysis {
  const event_tags = EVENT_RULES.filter(([, words]) => words.some((w) => content.includes(w))).map(([label]) => label);
  if (!event_tags.length) event_tags.push("日常记录");

  const hasNegative = NEGATIVE.some((w) => content.includes(w));
  const hasPositive = POSITIVE.some((w) => content.includes(w));
  const socialReward = SOCIAL_REWARD.some((w) => content.includes(w));

  let emotion_label = "情绪稳定";
  let happiness_label = "幸福度中等";
  if ((hasPositive || socialReward) && !hasNegative) {
    emotion_label = "情绪稳定偏愉悦";
    happiness_label = "幸福度高";
  } else if (hasNegative && hasPositive) {
    emotion_label = "情绪混合";
    happiness_label = "幸福度中等";
  } else if (hasNegative) {
    emotion_label = "情绪低落或烦躁";
    happiness_label = "幸福度低";
  }

  let personality_label = "无明确性格倾向";
  let values_label = "无明确价值观倾向";
  if (["朋友", "聚会", "逛街", "聊天"].some((w) => content.includes(w))) {
    personality_label = "性格外向";
    values_label = "价值观重视陪伴";
  } else if (["加班", "任务", "项目", "汇报"].some((w) => content.includes(w))) {
    personality_label = "性格负责克制";
    values_label = "价值观重视责任";
  }

  return {
    event_tags,
    emotion_label,
    personality_label,
    values_label,
    happiness_label,
    schedule_candidate: detectScheduleCandidate(content, now),
    model_version: "local-rules-v1",
  };
}

export async function analyzeDiaryEntry(content: string): Promise<DiaryAnalysis> {
  const local = localDiaryAnalysis(content);
  if (!process.env.OPENAI_API_KEY) return local;
  try {
    const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const res = await fetch(base + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "你是日记多层标签分析器。只输出 JSON，字段: event_tags(string[]), emotion_label, personality_label, values_label, happiness_label。不要诊断疾病。",
          },
          { role: "user", content },
        ],
      }),
    });
    if (!res.ok) return local;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return local;
    const parsed = JSON.parse(raw) as Partial<DiaryAnalysis>;
    return {
      event_tags: Array.isArray(parsed.event_tags) && parsed.event_tags.length ? parsed.event_tags : local.event_tags,
      emotion_label: parsed.emotion_label || local.emotion_label,
      personality_label: parsed.personality_label || local.personality_label,
      values_label: parsed.values_label || local.values_label,
      happiness_label: parsed.happiness_label || local.happiness_label,
      schedule_candidate: local.schedule_candidate,
      model_version: "openai+" + local.model_version,
    };
  } catch {
    return local;
  }
}

export function flattenAnalysisTags(analysis: DiaryAnalysis): string[] {
  return [...new Set([
    ...analysis.event_tags,
    analysis.emotion_label,
    analysis.personality_label,
    analysis.values_label,
    analysis.happiness_label,
  ].filter(Boolean))];
}
