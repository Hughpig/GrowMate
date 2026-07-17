import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo123456", 10);

  const demo = await prisma.user.upsert({
    where: { email: "demo@growmate.app" },
    update: {},
    create: {
      email: "demo@growmate.app",
      passwordHash,
      displayName: "演示用户",
      bio: "用记录沉淀成长，用陪伴对抗孤独。",
    },
  });

  const communities = [
    {
      slug: "growth",
      name: "成长日记",
      description: "分享感悟、复盘、人生经历与自我成长",
      icon: "sprout",
      tone: "supportive",
    },
    {
      slug: "mental",
      name: "情绪心理",
      description: "纯情绪出口，倾诉压力与心事，无评判交流",
      icon: "heart",
      tone: "healing",
    },
    {
      slug: "fitness",
      name: "运动体能",
      description: "训练打卡、健身经验、互相监督",
      icon: "dumbbell",
      tone: "training",
    },
    {
      slug: "nutrition",
      name: "饮食营养",
      description: "食谱分享、健康饮食、身材管理互助",
      icon: "apple",
      tone: "supportive",
    },
    {
      slug: "tech",
      name: "技术学习",
      description: "编程、Linux、AI 自学交流与答疑",
      icon: "code",
      tone: "learning",
    },
  ];

  for (const c of communities) {
    await prisma.community.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
  }

  const modules = [
    {
      slug: "fitness",
      name: "体能训练",
      description: "专业体能计划、居家/户外训练、体态矫正与科学打卡",
      courses: [
        {
          title: "零基础居家热身与体态唤醒",
          summary: "10 分钟唤醒身体，改善久坐圆肩",
          level: "beginner",
          durationMin: 15,
          order: 1,
          content:
            "课程目标：建立「每天都能完成」的最小训练单元。\n\n1. 颈肩环绕 1 分钟\n2. 开胸拉伸 2 分钟\n3. 深蹲激活 3 组×8\n4. 平板支撑 3×20 秒\n5. 训练后记录感受与完成度",
        },
        {
          title: "有氧耐力入门：间歇快走",
          summary: "用可控强度提升心肺与情绪稳定性",
          level: "beginner",
          durationMin: 25,
          order: 2,
          content:
            "方法：快走 3 分钟 + 慢走 2 分钟，循环 4 组。\n注意呼吸节奏，结束后写情绪打卡。",
        },
      ],
    },
    {
      slug: "nutrition",
      name: "营养搭配",
      description: "日常饮食、减脂增肌与健康习惯培养",
      courses: [
        {
          title: "一日三餐结构公式",
          summary: "蛋白质 + 蔬果 + 优质碳水的稳定搭配",
          level: "beginner",
          durationMin: 20,
          order: 1,
          content:
            "早餐：蛋白质 + 碳水\n午餐：蛋白质 + 蔬菜 + 碳水\n晚餐：蛋白质 + 大量蔬菜 + 少量碳水\n记录一周饮食，观察精力与情绪变化。",
        },
        {
          title: "情绪性进食识别与替代",
          summary: "把「解压吃」变成可执行的替代动作",
          level: "beginner",
          durationMin: 15,
          order: 2,
          content:
            "识别触发：焦虑/无聊/疲惫。\n替代动作：喝水、散步 5 分钟、写 3 句情绪日记。",
        },
      ],
    },
    {
      slug: "tech",
      name: "技术学习",
      description: "计算机基础、Linux、Python、自动化与 AI 入门",
      courses: [
        {
          title: "Linux 命令行第一课",
          summary: "目录、文件与权限的最小必要知识",
          level: "beginner",
          durationMin: 40,
          order: 1,
          content:
            "掌握：pwd / ls / cd / mkdir / touch / cat / cp / mv / rm\n练习：创建学习目录并写 README。",
        },
        {
          title: "Python 入门：变量、条件与循环",
          summary: "用小脚本完成第一段自动化思维",
          level: "beginner",
          durationMin: 45,
          order: 2,
          content:
            "学习变量、if、for。\n作业：写一个「每日情绪记录」命令行小工具。",
        },
        {
          title: "AI 应用入门：会提问比会模型更重要",
          summary: "结构化 Prompt 与个人知识整理",
          level: "beginner",
          durationMin: 30,
          order: 3,
          content:
            "Prompt 公式：角色 + 任务 + 约束 + 输出格式。\n把本周学习笔记喂给 AI 生成复盘。",
        },
      ],
    },
    {
      slug: "mental",
      name: "心理健康",
      description: "情绪疏导、认知调整与轻量心理监护",
      courses: [
        {
          title: "情绪命名：把感受说清楚",
          summary: "降低内耗的第一步是准确描述情绪",
          level: "beginner",
          durationMin: 15,
          order: 1,
          content:
            "练习：用「我现在感到…，因为…，我需要…」句式写 5 分钟。\n避免自我攻击式表达。",
        },
        {
          title: "焦虑时的 5 分钟着陆法",
          summary: "身体优先，思维随后",
          level: "beginner",
          durationMin: 10,
          order: 2,
          content:
            "1. 双脚踩实地面\n2. 吸气 4 秒，呼气 6 秒 × 8 轮\n3. 说出 5 个可见物体\n4. 写下一件「今天可控的小事」并完成",
        },
      ],
    },
  ];

  for (const mod of modules) {
    const module = await prisma.courseModule.upsert({
      where: { slug: mod.slug },
      update: {
        name: mod.name,
        description: mod.description,
      },
      create: {
        slug: mod.slug,
        name: mod.name,
        description: mod.description,
      },
    });

    for (const course of mod.courses) {
      const existing = await prisma.course.findFirst({
        where: { moduleId: module.id, title: course.title },
      });
      if (!existing) {
        await prisma.course.create({
          data: { ...course, moduleId: module.id },
        });
      }
    }
  }

  // demo 内容
  const journalCount = await prisma.journalEntry.count({
    where: { userId: demo.id },
  });
  if (journalCount === 0) {
    await prisma.journalEntry.createMany({
      data: [
        {
          userId: demo.id,
          title: "开启我的成长档案",
          content:
            "今天注册了伴成长。我想认真记录情绪、学习和训练，不再让日子无声滑过。有点紧张，但也期待被理解。",
          mood: 4,
          tags: JSON.stringify(["启程", "期待"]),
          isPrivate: true,
        },
        {
          userId: demo.id,
          title: "工作压力下的内耗",
          content:
            "下午会议后有些焦虑，脑子里循环「是不是做得不够好」。晚上跑步 20 分钟后好一些。需要建立复盘而不是自责的习惯。",
          mood: 2,
          tags: JSON.stringify(["焦虑", "复盘"]),
          isPrivate: true,
        },
        {
          userId: demo.id,
          title: "Python 学习打卡",
          content:
            "完成了变量和循环的练习，写了一个简单的待办脚本。虽然慢，但有掌控感。准备下周学 Linux 基础。",
          mood: 4,
          tags: JSON.stringify(["技术", "打卡"]),
          isPrivate: false,
        },
      ],
    });

    const now = Date.now();
    for (let i = 10; i >= 0; i--) {
      const score = i === 3 || i === 4 ? 2 : i === 7 ? 3 : 4;
      const stress = score <= 2 ? 4 : 2;
      await prisma.moodLog.create({
        data: {
          userId: demo.id,
          score,
          energy: score >= 4 ? 4 : 3,
          stress,
          note: score <= 2 ? "有点低落，压力偏大" : "状态还行",
          riskLevel: score <= 2 ? "watch" : "normal",
          createdAt: new Date(now - i * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  const growth = await prisma.community.findUnique({ where: { slug: "growth" } });
  const mental = await prisma.community.findUnique({ where: { slug: "mental" } });
  const tech = await prisma.community.findUnique({ where: { slug: "tech" } });

  const postCount = await prisma.post.count();
  if (postCount === 0 && growth && mental && tech) {
    await prisma.post.createMany({
      data: [
        {
          communityId: growth.id,
          authorId: demo.id,
          title: "把每天过成可回看的档案",
          content:
            "以前总觉得日记没用，直到发现「记录」本身就是抗遗忘、抗内耗的工具。欢迎和我一起坚持。",
          isAnonymous: false,
        },
        {
          communityId: mental.id,
          authorId: demo.id,
          title: "今天有点喘不过气",
          content:
            "不是大事，是很多小事叠在一起。写出来就好一点。如果有人看见，谢谢你愿意停一下。",
          isAnonymous: true,
        },
        {
          communityId: tech.id,
          authorId: demo.id,
          title: "零基础 Linux 学习路线求互助",
          content:
            "计划：命令行 → 文件权限 → shell 脚本。有没有一起打卡的伙伴？",
          isAnonymous: false,
        },
      ],
    });
  }

  console.log("Seed completed. Demo user: demo@growmate.app / demo123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
