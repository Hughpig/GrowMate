# Git 说明

首次提交已完成，提交哈希：`a7ef1f1`

由于 Codex 沙箱对项目根目录 `.git` 写入受限，提交对象暂存在：

```text
work/gitdir
```

请在本机 PowerShell **运行一次** 完成规范化：

```powershell
cd C:\Users\zxq\Documents\Codex\2026-07-17\ni-h
powershell -ExecutionPolicy Bypass -File .\tools\finalize-git.ps1
```

完成后即可正常使用：

```powershell
git log -1
git status
```

在未 finalize 前，也可临时访问该提交：

```powershell
git --git-dir=work/gitdir --work-tree=. log -1 --oneline
```
