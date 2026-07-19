import {
  ANATOMICAL_PARTS,
  bilibiliSearch,
  type DailyStatus,
  type Exercise,
  type Intensity,
  type LongTermGoal,
  type TrainingPlan,
} from "@/lib/training-types";

function ex(
  name: string,
  opts: Partial<Exercise> & { instruction: string; category: Exercise["category"] }
): Exercise {
  return {
    name,
    sets: opts.sets ?? 3,
    reps: opts.reps ?? "10-12次",
    rest: opts.rest ?? "休息30-45秒",
    instruction: opts.instruction,
    targetMuscle: opts.targetMuscle,
    category: opts.category,
    duration: opts.duration,
    videoUrl: bilibiliSearch(name),
  };
}

function isFatigued(daily: DailyStatus) {
  return daily.workload === "high" || daily.sleepQuality <= 3 || daily.energyLevel === "low";
}

function hasKnee(parts: string[]) {
  return parts.some((p) => p.startsWith("knee"));
}
function hasLowerBack(parts: string[]) {
  return parts.includes("back-lower");
}
function hasShoulder(parts: string[]) {
  return parts.some((p) => p.startsWith("shoulder"));
}
function hasNeck(parts: string[]) {
  return parts.includes("neck");
}

function partNames(ids: string[]) {
  return ids
    .map((id) => ANATOMICAL_PARTS.find((p) => p.id === id)?.name || id)
    .join("、");
}

function baseFatLoss(intensity: Intensity): Exercise[] {
  if (intensity === "low") {
    return [
      ex("原地踏步", { sets: 1, reps: "持续3分钟", duration: "3min", category: "cardio", targetMuscle: "心肺", instruction: "保持直立，节奏平稳，呼吸自然。" }),
      ex("靠墙静蹲（浅蹲）", { sets: 3, reps: "20-30秒", category: "legs", targetMuscle: "大腿", instruction: "膝盖不超过脚尖，背部贴墙，感受前侧大腿。" }),
      ex("站姿体侧屈", { sets: 2, reps: "左右各10次", category: "core", targetMuscle: "侧腰", instruction: "缓慢侧屈，避免猛甩。" }),
      ex("猫牛式", { sets: 2, reps: "8-10次", category: "stretch", targetMuscle: "脊柱", instruction: "跟随呼吸，脊柱逐节活动。" }),
    ];
  }
  return [
    ex("开合跳或快速踏步", { sets: 3, reps: "30秒", duration: "30s", category: "cardio", targetMuscle: "心肺", instruction: "保持核心收紧，落地轻柔。" }),
    ex("徒手深蹲", { sets: 3, reps: "12-15次", category: "legs", targetMuscle: "臀腿", instruction: "膝盖跟随脚尖方向，起身呼气。" }),
    ex("俯卧撑（可跪姿）", { sets: 3, reps: "8-12次", category: "push", targetMuscle: "胸肩", instruction: "身体一条直线，肘部约45度。" }),
    ex("平板支撑", { sets: 3, reps: "20-40秒", duration: "30s", category: "core", targetMuscle: "核心", instruction: "腰背中立，不要塌腰。" }),
    ex("弓步走", { sets: 2, reps: "左右各8次", category: "legs", targetMuscle: "臀腿", instruction: "前膝对准脚尖，后膝轻点地面。" }),
  ];
}

function baseMuscle(intensity: Intensity, focus: string[]): Exercise[] {
  const full = !focus.length || focus.includes("全身");
  const list: Exercise[] = [
    ex("动态关节热身", { sets: 1, reps: "2分钟", duration: "2min", category: "stretch", targetMuscle: "全身", instruction: "肩绕环、髋绕环、高抬腿各20秒。" }),
  ];
  if (full || focus.includes("胸部") || focus.includes("肩部") || focus.includes("手臂")) {
    list.push(ex("俯卧撑变式", { sets: intensity === "high" ? 4 : 3, reps: intensity === "high" ? "10-15次" : "8-12次", category: "push", targetMuscle: "胸/肩/三头", instruction: "控制速度，底部稍停。" }));
  }
  if (full || focus.includes("背部") || focus.includes("手臂")) {
    list.push(ex("反向划船（桌下/弹力带）", { sets: 3, reps: "10-12次", category: "pull", targetMuscle: "背/二头", instruction: "肩胛后收下沉，肘贴身。" }));
  }
  if (full || focus.includes("腿部")) {
    list.push(ex("深蹲或分腿蹲", { sets: 3, reps: "10-12次", category: "legs", targetMuscle: "臀腿", instruction: "脚掌踩实，膝盖与脚尖同向。" }));
  }
  if (full || focus.includes("核心")) {
    list.push(ex("死虫式", { sets: 3, reps: "左右各8次", category: "core", targetMuscle: "核心", instruction: "腰贴地，对侧手脚缓慢伸展。" }));
  }
  if (list.length < 4) {
    list.push(ex("臀桥", { sets: 3, reps: "12次", category: "legs", targetMuscle: "臀部", instruction: "顶峰挤压臀肌1秒。" }));
  }
  return list;
}

function baseRecovery(parts: string[]): Exercise[] {
  const list: Exercise[] = [
    ex("腹式呼吸", { sets: 1, reps: "1分钟", duration: "1min", category: "stretch", targetMuscle: "副交感", instruction: "吸气4秒，呼气6秒，放松肩膀。" }),
    ex("猫牛式", { sets: 2, reps: "10次", category: "stretch", targetMuscle: "脊柱", instruction: "动作幅度小而可控。" }),
    ex("髋部开合（仰卧）", { sets: 2, reps: "左右各8次", category: "stretch", targetMuscle: "髋", instruction: "脚掌相对，膝盖缓慢开合。" }),
  ];
  if (hasKnee(parts)) {
    list.push(ex("直腿抬高", { sets: 2, reps: "左右各10次", category: "legs", targetMuscle: "股四头", instruction: "膝关节保持微伸但不锁死。" }));
    list.push(ex("踝泵", { sets: 2, reps: "20次", category: "stretch", targetMuscle: "小腿", instruction: "促进循环，动作轻柔。" }));
  }
  if (hasLowerBack(parts)) {
    list.push(ex("仰卧抱膝", { sets: 2, reps: "30秒", duration: "30s", category: "stretch", targetMuscle: "下背", instruction: "缓慢抱膝，不要猛拉。" }));
    list.push(ex("臀桥（小幅度）", { sets: 2, reps: "10次", category: "legs", targetMuscle: "臀", instruction: "激活臀肌分担下背压力。" }));
  }
  if (hasShoulder(parts) || hasNeck(parts)) {
    list.push(ex("肩胛墙滑", { sets: 2, reps: "8次", category: "stretch", targetMuscle: "肩胛", instruction: "手臂贴墙缓慢上滑，避免耸肩。" }));
    list.push(ex("颈侧拉伸", { sets: 2, reps: "左右各20秒", duration: "20s", category: "stretch", targetMuscle: "颈部", instruction: "轻柔侧倾，不要旋转猛拉。" }));
  }
  if (list.length < 5) {
    list.push(ex("世界最伟大拉伸（简化）", { sets: 2, reps: "左右各4次", category: "stretch", targetMuscle: "全身", instruction: "弓步+胸椎打开，动作缓慢。" }));
  }
  return list;
}

function adaptForPain(exercises: Exercise[], parts: string[]): Exercise[] {
  let next = [...exercises];
  if (hasKnee(parts)) {
    next = next.filter((e) => !/深蹲|开合跳|弓步|跑步|跳跃/.test(e.name));
    next.push(
      ex("仰卧臀桥", { sets: 3, reps: "12次", category: "legs", targetMuscle: "臀", instruction: "无膝冲击，顶峰收紧臀部。" }),
      ex("坐姿直腿抬高", { sets: 2, reps: "左右各10次", category: "legs", targetMuscle: "大腿前侧", instruction: "动作缓慢，避免弹震。" })
    );
  }
  if (hasLowerBack(parts)) {
    next = next.filter((e) => !/硬拉|俯身|负重体前屈/.test(e.name));
    next.push(ex("鸟狗式", { sets: 2, reps: "左右各8次", category: "core", targetMuscle: "核心/下背稳定", instruction: "对侧手脚伸展，骨盆保持稳定。" }));
  }
  if (hasShoulder(parts)) {
    next = next.filter((e) => !/过头|推举|宽距俯卧撑/.test(e.name));
  }
  // de-dup by name
  const seen = new Set<string>();
  return next.filter((e) => {
    if (seen.has(e.name)) return false;
    seen.add(e.name);
    return true;
  });
}

export function generateLocalTrainingPlan(goal: LongTermGoal, daily: DailyStatus): TrainingPlan {
  const fatigued = isFatigued(daily);
  const parts = goal.uncomfortableParts || [];
  let intensity: Intensity = fatigued ? "low" : daily.workload === "low" && daily.energyLevel === "high" ? "high" : "moderate";
  if (goal.type === "recovery" || parts.length >= 3) intensity = "low";

  let exercises: Exercise[] = [];
  let type = "";
  let name = "";

  if (goal.type === "fat-loss") {
    exercises = baseFatLoss(intensity);
    type = intensity === "low" ? "低冲击燃脂与唤醒" : "间歇燃脂与全身循环";
    name = fatigued ? "高压舒缓・轻燃脂唤醒" : "今日燃脂推进计划";
  } else if (goal.type === "muscle-gain") {
    exercises = baseMuscle(intensity, goal.focusAreas || []);
    type = "抗阻与肌群激活";
    name = fatigued ? "恢复向・维持力量刺激" : "今日增肌训练计划";
  } else {
    exercises = baseRecovery(parts);
    type = "康复拉伸与关节稳定";
    name = "康复保护・柔韧激活计划";
    intensity = "low";
  }

  exercises = adaptForPain(exercises, parts);

  const reasons: string[] = [];
  if (fatigued) {
    reasons.push(
      `检测到今日状态偏疲劳（工作负载=${daily.workload}，睡眠=${daily.sleepQuality}/5，精力=${daily.energyLevel}），因此将强度下调，优先用可完成、低阻力的动作帮你恢复节律，而不是硬撑高强度。`
    );
  } else {
    reasons.push("今日状态尚可，计划在安全前提下推进你的长期目标。");
  }
  if (parts.length) {
    reasons.push(
      `已记录不适部位：${partNames(parts)}。计划已避开相关高负荷动作，并用稳定与拉伸替代。若疼痛加重请立即停止并就医。`
    );
  }
  if (goal.type === "fat-loss" && goal.targetWeightLoss) {
    reasons.push(`减脂目标约 ${goal.targetWeightLoss}kg，建议配合饮水和规律作息，训练以可持续为先。`);
  }
  if (goal.type === "muscle-gain" && goal.focusAreas?.length) {
    reasons.push(`增肌关注部位：${goal.focusAreas.join("、")}。`);
  }
  if (daily.extraNotes || daily.voiceTranscript) {
    reasons.push(`已参考你的补充说明：${daily.extraNotes || daily.voiceTranscript}`);
  }

  return {
    id: "local-" + Date.now().toString(36),
    name,
    type,
    durationMinutes: intensity === "low" ? 18 : intensity === "high" ? 35 : 25,
    intensity,
    adjustmentReason: reasons.join(""),
    exercises,
    wellnessTargets: {
      hydrationLiters: fatigued ? 2.2 : 2.5,
      stretchFocus: parts.length
        ? partNames(parts).split("、").slice(0, 3)
        : ["髋部灵活性", "胸椎打开", "小腿放松"],
    },
    createdAt: new Date().toISOString(),
    citations: [
      "NSCA Essentials of Personal Training — periodization and fatigue management principles",
      "NASM Essentials of Personal Fitness Training — OPT model stabilization endurance guidelines",
    ],
    source: "local",
  };
}

export async function generateTrainingPlanWithLLM(
  goal: LongTermGoal,
  daily: DailyStatus
): Promise<TrainingPlan | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const local = generateLocalTrainingPlan(goal, daily);
    const res = await fetch(base + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "你是专业体能与康复教练（NSCA/NASM 导向）。根据长期目标与今日状态生成今日训练计划 JSON。字段: name,type,durationMinutes,intensity(low|moderate|high),adjustmentReason,exercises[{name,sets,reps,duration,rest,instruction,targetMuscle,category,videoUrl}],wellnessTargets{hydrationLiters,stretchFocus[]},citations[]。videoUrl 用 bilibili 搜索链接。高疲劳/低睡眠必须降强度；有不适部位必须避让高负荷动作。只输出 JSON。",
          },
          {
            role: "user",
            content: JSON.stringify({ longTermGoal: goal, dailyStatus: daily, fallbackExample: local }, null, 2),
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrainingPlan;
    if (!parsed.exercises?.length) return null;
    parsed.id = parsed.id || "ai-" + Date.now().toString(36);
    parsed.createdAt = new Date().toISOString();
    parsed.source = "openai";
    parsed.exercises = parsed.exercises.map((e) => ({
      ...e,
      videoUrl: e.videoUrl || bilibiliSearch(e.name),
    }));
    return parsed;
  } catch {
    return null;
  }
}

export async function generateTrainingPlan(goal: LongTermGoal, daily: DailyStatus): Promise<TrainingPlan> {
  const ai = await generateTrainingPlanWithLLM(goal, daily);
  return ai || generateLocalTrainingPlan(goal, daily);
}
