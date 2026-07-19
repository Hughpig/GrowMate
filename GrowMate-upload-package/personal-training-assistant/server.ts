/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Lazy initialize Gemini AI client
let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Dynamic Workout Generation API
  app.post('/api/generate-plan', async (req, res) => {
    try {
      const { longTermGoal, dailyStatus } = req.body;

      if (!longTermGoal || !dailyStatus) {
        return res.status(400).json({ error: 'Missing longTermGoal or dailyStatus in request body.' });
      }

      // Check key existence prior to generating to present a clear setup message
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          error: 'MISSING_API_KEY',
          message: '未检测到 Gemini API Key。请在 AI Studio 设置或 Secrets 控制面板中添加 GEMINI_API_KEY 环境变量，以启动智能计划调整！'
        });
      }

      const ai = getAI();

      // Build structured, friendly instruction prompt for Gemini
      const systemInstruction = `
你是一位专业的个人健康体能与康复教练，严格遵守美国国家体能协会 (NSCA) 和美国国家运动医学学会 (NASM) 的学术与实操指导规范。
你擅长为高压工作人群量身定制每日可执行、低阻力、高回报的训练计划。
你将根据用户的“长期目标”和“今日反馈状态”（如工作量、睡眠、精力、局部痛感部位）来动态调节、重构或生成今天的训练方案。

请严格遵守以下生理医学与体能设计原则：
1. **工作过度/高疲劳避险**：若用户今日 Workload 为 high，或 SleepQuality <= 3（满分5），或 EnergyLevel 为 low。你必须把训练强度降级（如由高强度转为低强度低冲击的有氧、抗阻拉伸、正念拉伸），在 \`adjustmentReason\` 中安慰用户，并说明由于疲劳而进行了轻量化减压设计。
2. **局部伤病痛感避险**：若 \`uncomfortableParts\` 包含特定痛点部位，训练计划必须 100% 避开该关节或肌肉的重力负荷，并在 \`adjustmentReason\` 中详细解释该计划是如何针对这些痛点做特殊安全保护的。
   - 比如：如果有膝盖不适(knee-l/knee-r)，则严禁深蹲、开合跳或跑步，替换为仰卧臀桥、上肢拉伸、平地温和步行等；如果有下背部不适(back-lower)，应严禁大重量俯身、硬拉动作，替换为猫式伸展、仰卧死虫式等。
3. **长期目标融合与运动学权威**：
   - 减脂 (fat-loss)：基于 NSCA 科学减脂指南提供渐进式燃脂、轻量级HIIT或低强度长有氧方案。
   - 增肌 (muscle-gain)：基于 NASM OPT (最佳运动表现训练) 模型提供各肌群抗阻训练，多用自重、哑铃或弹力带。
   - 康复 (recovery)：高强度抗阻绝对不出现，主要提供解剖部位拉伸、柔韧性与关节稳定性激活。

请输出符合以下格式的 JSON 数据，不需要任何 Markdown 标记包围或包裹（仅直接返回 JSON 纯文本）：
{
  "id": "随机字符串",
  "name": "今日定制计划名称 (例如: 膝痛安全护航・高压舒缓活力操)",
  "type": "训练类型描述 (例如: 低冲击拉伸与全身唤醒)",
  "durationMinutes": 20, 
  "intensity": "low" | "moderate" | "high",
  "adjustmentReason": "详细解释你今天是如何根据他们的高疲劳/低睡眠/身体痛点等状态量身调整的教练评语（中文，150-250字），带有亲切、专业、鼓励的语气。必须提及他们选中的不适部位或疲劳状态。",
  "exercises": [
    {
      "name": "动作名称",
      "sets": 3,
      "reps": "12-15次" (或为 "持续45秒"),
      "duration": "可选的持续时间 (例如: 45s)",
      "rest": "休息30秒",
      "instruction": "具体且极其简明的动作要领及安全注意事项",
      "targetMuscle": "目标刺激部位",
      "category": "push" | "pull" | "legs" | "core" | "stretch" | "cardio",
      "videoUrl": "一个指向专业、高点击真人视频动作教学的搜索链接。请统一生成Bilibili搜索链接以确保国内极速访问，格式为: https://search.bilibili.com/all?keyword=动作名称+健身教学"
    }
  ],
  "wellnessTargets": {
    "hydrationLiters": 2.5,
    "stretchFocus": ["伸展动作1", "伸展动作2"]
  },
  "citations": [
    "给出1-2条真实的NSCA或NASM指导性学术/专业标准文献引用作为权威背书，例如：'NSCA Essentials of Personal Training, 2nd Edition - Flexible periodization for high-fatigue populations'",
    "或者：'NASM Essentials of Personal Fitness Training, 7th Edition - OPT model stabilization endurance adaptation guidelines'"
  ]
}
`;

      const promptText = `
### 长期目标设定
- 类型: ${longTermGoal.type}
- 减脂目标: ${longTermGoal.targetWeightLoss ? `${longTermGoal.targetWeightLoss} kg` : '未设定'}
- 完成周期: ${longTermGoal.timelineWeeks ? `${longTermGoal.timelineWeeks} 周` : '未设定'}
- 增肌偏好肌群: ${longTermGoal.focusAreas?.join(', ') || '全身均衡'}
- 康复不适部位: ${longTermGoal.uncomfortableParts?.join(', ') || '无不适/健康状态'}
- 自定义补充: ${longTermGoal.customGoalText || '无'}

### 每日打卡状态 (反馈)
- 今日工作负载 (Workload): ${dailyStatus.workload}
- 昨晚睡眠质量 (Sleep Quality): ${dailyStatus.sleepQuality} / 5
- 今日身体精力 (Energy Level): ${dailyStatus.energyLevel}
- 语音或文字附加备注: ${dailyStatus.voiceTranscript || dailyStatus.extraNotes || '无附加反馈'}

请为他们定制今天的训练计划。请直接输出干净、不包含 \`\`\`json 开头或结尾的 JSON 纯文本。
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text || '{}';
      const trainingPlan = JSON.parse(responseText);
      
      // Add server-side timestamp
      trainingPlan.createdAt = new Date().toISOString();

      res.json(trainingPlan);
    } catch (error: any) {
      console.error('Error generating workout plan:', error);
      res.status(500).json({ error: 'Server Error', message: error.message || 'An unknown error occurred.' });
    }
  });

  // Vite static middleware and index routing setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VitaFlow Server] Express backend listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[VitaFlow Server] Failed to start server:', err);
});
