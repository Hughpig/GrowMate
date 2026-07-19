# GrowMate 上传与 PR 步骤

目标：

1. 先把本目录内容上传到 fork：`Colleencolleen/GrowMate`
2. 再从 fork 创建 PR 到上游：`Hughpig/GrowMate`

## 上传内容

上传这些目录和文件：

```text
ai-diary-web/
docs/
one-sentence-self-profile/
.gitignore
UPLOAD_AND_PR_STEPS.md
```

不要上传：

```text
ai-diary-web/data/
ai-diary-web/data/app.db
__pycache__/
*.pyc
.env
OPENAI_API_KEY
```

## 命令行步骤

```powershell
Set-Location 'E:\document\table'
git clone https://github.com/Colleencolleen/GrowMate.git
Set-Location 'E:\document\table\GrowMate'
git remote add upstream https://github.com/Hughpig/GrowMate.git
git fetch upstream
git checkout main
git pull upstream main
git checkout -b add-ai-diary-web
```

复制文件：

```powershell
Copy-Item -LiteralPath 'C:\Users\a1753\Documents\Codex\2026-07-18\10-ai-ai-ai-aaker-schwartz\GrowMate-upload-package\ai-diary-web' -Destination '.\ai-diary-web' -Recurse -Force
Copy-Item -LiteralPath 'C:\Users\a1753\Documents\Codex\2026-07-18\10-ai-ai-ai-aaker-schwartz\GrowMate-upload-package\docs' -Destination '.\docs' -Recurse -Force
Copy-Item -LiteralPath 'C:\Users\a1753\Documents\Codex\2026-07-18\10-ai-ai-ai-aaker-schwartz\GrowMate-upload-package\one-sentence-self-profile' -Destination '.\one-sentence-self-profile' -Recurse -Force
Copy-Item -LiteralPath 'C:\Users\a1753\Documents\Codex\2026-07-18\10-ai-ai-ai-aaker-schwartz\GrowMate-upload-package\.gitignore' -Destination '.\.gitignore' -Force
```

提交并推送到 fork：

```powershell
git status
git add ai-diary-web docs one-sentence-self-profile .gitignore
git commit -m "Add AI diary web prototype"
git push origin add-ai-diary-web
```

## 创建 PR

打开这个链接：

```text
https://github.com/Hughpig/GrowMate/compare/main...Colleencolleen:add-ai-diary-web
```

PR 标题：

```text
Add AI diary web prototype
```

PR 描述：

```text
新增 AI 多层标签日记网页端第一版原型。

包含：
- 网页端日记录入
- 注册、登录和多用户隔离
- SQLite 持久化
- 纯文字、2000 字、表情图片、敏感词拦截
- 本地规则 AI 标签分析兜底
- 可选 OpenAI 接入
- 标签筛选
- 明显计划识别、确认加入日程、默认 15 分钟提醒
- 项目说明书、进度账本和一句话画像 skill

未包含：
- 运行时数据库
- .env 或 OpenAI API Key
- Python 缓存文件
```

