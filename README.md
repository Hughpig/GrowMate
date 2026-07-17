# GrowMate · 伴成长

AI 陪伴式个人成长记录 + 多领域垂直社区平台（MVP）

> 让每一段经历都被记录，让每一次成长都有陪伴

## 产品定位

以**个人长期成长档案**为底座，以**AI 深度识人与陪伴**为内核，叠加体能 / 营养 / 心理 / 技术四大赋能体系，并提供垂直情绪与成长社区。

核心闭环：

`记录 → AI 建模 → 内容赋能 → 社区陪伴 → 心理监护 → 再建模`

区别于娱乐社交：不主打短期热闹，主打**长期沉淀、专属陪伴、精准赋能**。

## 功能一览（MVP）

| 模块 | 说明 | 路径 |
|------|------|------|
| 账号体系 | 注册 / 登录 / JWT Cookie 会话 | `/login` `/register` |
| 成长总览 | 数据看板、风险提示、今日推荐 | `/dashboard` |
| 成长日记 | 私密记录 + 时间轴沉淀 | `/journal` |
| 情绪打卡 | 情绪 / 精力 / 压力曲线 | `/mood` |
| AI 档案 | 成长档案 + 人格心理动态档案 | `/archive` |
| AI 陪伴 | 规则引擎对话，可接 OpenAI 兼容模型 | `/ai` |
| 垂直社区 | 成长 / 心理 / 运动 / 营养 / 技术 | `/community` |
| 成长课程 | 体能 / 营养 / 技术 / 心理四大模块 | `/learn` |

## 技术栈

| 层级 | 选型 |
|------|------|
| Web | Next.js 15 App Router + TypeScript + Tailwind CSS 4 |
| API | Next.js Route Handlers |
| ORM | Prisma |
| 数据库 | SQLite（本地开发，可迁 PostgreSQL） |
| 认证 | JWT + HttpOnly Cookie |
| AI | 规则画像引擎 + 可选 OpenAI 兼容接口 |

## 五层架构

1. **数据采集层** — 日记、情绪打卡、学习/训练记录、社区行为  
2. **AI 档案建模层** — 成长档案 + 人格心理动态档案  
3. **专业内容赋能层** — 体能 / 营养 / 技术 / 心理  
4. **垂直社区交互层** — 五个独立子社区  
5. **心理监护服务层** — 情绪监测、风险提示、复盘建议  

## 项目结构

```text
ni-h/
├── apps/web/                 # 全栈应用（页面 + API）
│   ├── prisma/               # 数据模型与种子数据
│   ├── src/app/              # App Router 页面与 API
│   ├── src/components/       # UI 组件
│   └── src/lib/              # 认证、AI、数据库工具
├── docs/                     # API 与路线图
├── outputs/                  # 产品架构等交付文档
├── package.json              # 根脚本入口
└── README.md
```

## 快速开始

### 环境要求

- Node.js 18+（推荐 20/22）
- npm

### 安装与启动

```bash
cd apps/web
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

浏览器打开：[http://localhost:3000](http://localhost:3000)

也可在仓库根目录：

```bash
npm run setup
npm run dev
```

### 演示账号

| 字段 | 值 |
|------|-----|
| 邮箱 | `demo@growmate.app` |
| 密码 | `demo123456` |

### 可选：接入真实大模型

复制环境变量模板并填写：

```bash
cp apps/web/.env.example apps/web/.env
```

在 `apps/web/.env` 中配置：

```env
OPENAI_API_KEY=your_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

未配置时，AI 陪伴自动回退到本地规则引擎，仍可完整体验。

## 常用脚本

在 `apps/web` 目录：

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务 |
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:push` | 同步数据库结构 |
| `npm run db:seed` | 写入演示数据 |
| `npm run db:studio` | 打开 Prisma Studio |

## 文档

- [产品架构与开发方案](outputs/产品架构与开发方案.md)
- [本地启动说明](outputs/本地启动说明.md)
- [API 一览](docs/API.md)
- [开发路线图](docs/ROADMAP.md)

## 设计原则（摘录）

1. **先存档，后社交** — 以个人档案为核心壁垒  
2. **隐私默认** — 日记默认私密，心理区支持匿名  
3. **AI + 可演进人工兜底** — 轻量风险识别，预留人工复核扩展  
4. **模块解耦** — 社区与课程可独立运营、后续可扩展领域  

## 许可证

本项目当前为私有创业原型，未声明开源许可证。如需开源请先补充 LICENSE。

---

GrowMate · 伴成长 — 记录、识人、陪伴、成长
