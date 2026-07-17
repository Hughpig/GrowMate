import { prisma } from "./db";
import { safeJsonParse } from "./utils";

export type ProfileView = {
  summary: string;
  personalityTags: string[];
  strengths: string[];
  weaknesses: string[];
  emotionPattern: string;
  goals: string[];
  riskLevel: "normal" | "watch" | "alert";
  moodTrend: { date: string; score: number; stress: number }[];
  recommendations: string[];
  stats: {
    journalCount: number;
    moodCount: number;
    postCount: number;
    avgMood: number | null;
    avgStress: number | null;
  };
};

function avg(nums: number[]) {
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function detectRisk(scores: number[], stresses: number[]): "normal" | "watch" | "alert" {
  if (!scores.length) return "normal";
  const recent = scores.slice(0, 7);
  const lowCount = recent.filter((s) => s <= 2).length;
  const highStress = stresses.slice(0, 7).filter((s) => s >= 4).length;
  if (lowCount >= 4 || (lowCount >= 3 && highStress >= 3)) return "alert";
  if (lowCount >= 2 || highStress >= 3) return "watch";
  return "normal";
}

/** 规则引擎版 AI 档案建模 — 可替换为 LLM 输出 */
export async function buildUserProfile(userId: string): Promise<ProfileView> {
  const [journals, moods, posts, existing] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.moodLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.aiProfile.findUnique({ where: { userId } }),
  ]);

  const moodScores = moods.map((m) => m.score);
  const stressScores = moods.map((m) => m.stress);
  const avgMood = avg(moodScores);
  const avgStress = avg(stressScores);
  const riskLevel = detectRisk(moodScores, stressScores);

  const allText = [
    ...journals.map((j) => `${j.title} ${j.content}`),
    ...moods.map((m) => m.note || ""),
    ...posts.map((p) => `${p.title} ${p.content}`),
  ]
    .join("\n")
    .toLowerCase();

  const tags = new Set<string>();
  const strengths = new Set<string>();
  const weaknesses = new Set<string>();
  const goals = new Set<string>();

  if (/目标|计划|复盘/.test(allText)) {
    tags.add("目标导向");
    strengths.add("善于复盘与规划");
  }
  if (/焦虑|压力|内耗|迷茫/.test(allText)) {
    tags.add("高敏感");
    weaknesses.add("容易内耗与焦虑");
  }
  if (/训练|跑步|健身|体能/.test(allText)) {
    tags.add("运动意识");
    strengths.add("关注身体状态");
    goals.add("保持规律运动");
  }
  if (/饮食|营养|减脂|增肌/.test(allText)) {
    tags.add("健康饮食");
    goals.add("建立稳定饮食习惯");
  }
  if (/python|linux|编程|代码|学习/.test(allText)) {
    tags.add("技术学习者");
    strengths.add("持续学习意愿强");
    goals.add("完成阶段性技术路线");
  }
  if (/感谢|陪伴|倾诉|社区/.test(allText)) {
    tags.add("渴望连接");
  }
  if ((avgMood ?? 3) >= 4) {
    tags.add("情绪较稳");
    strengths.add("整体心态积极");
  } else if ((avgMood ?? 3) <= 2.5) {
    tags.add("情绪低落期");
    weaknesses.add("近期情绪波动偏大");
  }
  if ((avgStress ?? 3) >= 4) {
    tags.add("高压状态");
    weaknesses.add("压力水平偏高");
  }

  if (!tags.size) tags.add("成长探索中");
  if (!strengths.size) strengths.add("愿意记录与自我觉察");
  if (!weaknesses.size) weaknesses.add("记录样本仍在积累中");
  if (!goals.size) goals.add("持续沉淀个人成长档案");

  let emotionPattern = "记录样本不足，持续打卡后将生成更精准的情绪规律。";
  if (moods.length >= 3) {
    if (riskLevel === "alert") {
      emotionPattern =
        "近一周情绪偏低且压力较高，建议降低任务强度，优先进行情绪疏导与规律作息。";
    } else if (riskLevel === "watch") {
      emotionPattern =
        "情绪存在波动，压力信号上升，适合通过日记复盘、轻运动与社区倾诉调节。";
    } else if ((avgMood ?? 3) >= 3.5) {
      emotionPattern =
        "整体情绪较平稳，可在稳定期推进技能学习与体能计划，巩固成长节奏。";
    } else {
      emotionPattern =
        "情绪处于中等水平，保持记录习惯有助于 AI 更准确识别触发源与改善路径。";
    }
  }

  const recommendations: string[] = [];
  if (riskLevel !== "normal") {
    recommendations.push("建议今日完成一次「心理健康」轻课程或情绪打卡疏导");
    recommendations.push("可在「情绪心理」社区匿名倾诉，获得同频陪伴");
  }
  if (/python|linux|编程|技术/.test(allText) || posts.some((p) => p.title.includes("技术"))) {
    recommendations.push("匹配技术学习路线：Linux 基础 → Python 入门 → 自动化");
  } else {
    recommendations.push("可从「技术学习」零基础路线开启一项可量化小目标");
  }
  if (/训练|健身/.test(allText)) {
    recommendations.push("推荐继续体能打卡，保持每周 3 次中等强度训练");
  } else {
    recommendations.push("尝试 10 分钟居家体态训练，降低久坐内耗");
  }
  if (journals.length < 3) {
    recommendations.push("多写 2-3 篇成长日记，AI 档案精度将显著提升");
  } else {
    recommendations.push("生成本周成长复盘，标记优势与可改进点");
  }

  const summary =
    journals.length + moods.length === 0
      ? "你的专属成长档案刚刚开启。从日记与情绪打卡开始，AI 将逐步理解你的性格、压力源与成长节奏。"
      : `基于 ${journals.length} 条记录与 ${moods.length} 次情绪数据，当前画像偏向「${[
          ...tags,
        ]
          .slice(0, 3)
          .join(" / ")}」。平均情绪 ${avgMood ?? "—"} / 5，压力 ${avgStress ?? "—"} / 5。${emotionPattern}`;

  const profileData = {
    summary,
    personalityTags: JSON.stringify([...tags]),
    strengths: JSON.stringify([...strengths]),
    weaknesses: JSON.stringify([...weaknesses]),
    emotionPattern,
    goals: JSON.stringify([...goals]),
    rawFeatures: JSON.stringify({
      avgMood,
      avgStress,
      riskLevel,
      journalCount: journals.length,
      moodCount: moods.length,
    }),
    lastAnalyzedAt: new Date(),
  };

  await prisma.aiProfile.upsert({
    where: { userId },
    create: { userId, ...profileData },
    update: profileData,
  });

  const moodTrend = [...moods]
    .reverse()
    .slice(-14)
    .map((m) => ({
      date: m.createdAt.toISOString().slice(0, 10),
      score: m.score,
      stress: m.stress,
    }));

  return {
    summary,
    personalityTags: [...tags],
    strengths: [...strengths],
    weaknesses: [...weaknesses],
    emotionPattern,
    goals: [...goals],
    riskLevel,
    moodTrend,
    recommendations,
    stats: {
      journalCount: journals.length,
      moodCount: moods.length,
      postCount: posts.length,
      avgMood,
      avgStress,
    },
  };
}

export async function companionReply(
  userId: string,
  message: string
): Promise<{ reply: string; riskHint?: string }> {
  const profile = await buildUserProfile(userId);
  const lower = message.toLowerCase();

  let riskHint: string | undefined;
  if (/不想活|自杀|自残|结束生命/.test(message)) {
    riskHint =
      "检测到可能的危机表达。请尽快联系身边信任的人或专业心理援助热线。你并不孤单。";
  } else if (profile.riskLevel === "alert") {
    riskHint = "系统监测到你近期情绪持续偏低，建议优先照顾身心，必要时寻求专业支持。";
  }

  // 可选：真实 LLM
  if (process.env.OPENAI_API_KEY) {
    try {
      const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: `你是 GrowMate 专属成长陪伴 AI。用户画像：${profile.summary}。标签：${profile.personalityTags.join(
                "、"
              )}。请温暖、具体、不评判地回应，给出可执行的小建议。不要声称自己是真人心理医生。`,
            },
            { role: "user", content: message },
          ],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (reply) return { reply, riskHint };
      }
    } catch {
      // fallback below
    }
  }

  // 规则引擎陪伴回复
  let reply = "";
  if (/焦虑|压力|内耗|迷茫|难受|低落/.test(message)) {
    reply = `我听到你现在的感受了。根据你的档案，你${
      profile.personalityTags.includes("高敏感") ? "对压力比较敏感，" : ""
    }近期情绪模式是：${profile.emotionPattern}\n\n可以先做三步小行动：\n1. 用 3 分钟写清「此刻最困扰我的一件事」\n2. 做 5 次缓慢深呼吸，降低生理唤醒\n3. 在情绪心理社区匿名倾诉，或打开心理健康轻课程\n\n你不是一个人在面对这些。`;
  } else if (/学习|编程|python|linux|技术/.test(lower) || /学习|编程|技术/.test(message)) {
    reply = `你有持续学习的意愿，这很棒。建议采用「最小可行学习单元」：\n- 今天只完成 25 分钟：选 Linux 或 Python 入门第一节\n- 学完立刻写 3 条笔记到成长日记\n- 在技术社区发一条打卡，获得外部反馈\n\nAI 会根据你的打卡节奏动态调整推荐难度。`;
  } else if (/运动|训练|健身|体能/.test(message)) {
    reply = `身体状态会影响情绪稳定性。若你最近压力偏高，优先选择低强度、可完成的训练（如 10 分钟拉伸/体态矫正），完成比完美更重要。打卡后我会把数据并入你的成长档案。`;
  } else if (/目标|计划|复盘/.test(message)) {
    reply = `我们把目标拆小：\n1. 本周只定 1 个主目标\n2. 拆成 3 个可打卡动作\n3. 每天晚上用日记写「完成了什么 / 卡在哪里」\n\n你的优势包括：${profile.strengths
      .slice(0, 2)
      .join("、")}。沿着优势推进会更可持续。`;
  } else {
    reply = `我在的。基于你当前的专属档案：\n${profile.summary}\n\n你可以继续和我聊情绪、目标、学习或训练。你写得越多，我越能给你更贴合的陪伴与建议。\n\n今日推荐：\n- ${profile.recommendations
      .slice(0, 2)
      .join("\n- ")}`;
  }

  return { reply, riskHint };
}

export function assessMoodRisk(score: number, stress: number, note?: string | null) {
  let riskLevel: "normal" | "watch" | "alert" = "normal";
  if (score <= 1 || (score <= 2 && stress >= 5)) riskLevel = "alert";
  else if (score <= 2 || stress >= 4) riskLevel = "watch";

  if (note && /自杀|自残|不想活|结束生命/.test(note)) {
    riskLevel = "alert";
  }
  return riskLevel;
}
