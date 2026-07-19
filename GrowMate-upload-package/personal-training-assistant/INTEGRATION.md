# 已集成到 GrowMate 主应用

原包：Vite + Express + Gemini「个人训练安排助手」。

主应用：
- 页面：/training
- API：/api/training/goal | /api/training/generate | /api/training/plans
- 本地规则：apps/web/src/lib/training-plan.ts（无 Key 可生成）
- 可选 LLM：OPENAI_API_KEY 优先，失败回退本地

本目录保留原独立实现，便于对照。
