# Git 说明

## 当前状态

首次提交已完成：

| Commit | Message |
|--------|---------|
| `a7ef1f1` | chore: initial commit for GrowMate MVP |
| `e1f82fb` | docs: add git finalize helper for sandbox-created repo |

若你已经运行过 `tools/finalize-git.ps1` 并看到 **Promoting work/gitdir -> .git**，说明仓库主体已经就绪。  
脚本末尾若出现 `fatal: not in a git directory`，多半是旧脚本在 `git config` 步骤的误报，**一般可忽略**。

请在项目根目录验证：

```powershell
cd C:\Users\zxq\Documents\Codex\2026-07-17\ni-h
git log --oneline
git status
```

若能看到两条 commit，说明一切正常。

## 可选清理

```powershell
# 去掉绝对 worktree 路径（提高可移植性）
git config --unset-all core.worktree

# 删除空的备份目录
Remove-Item -Recurse -Force .git-empty-backup-* -ErrorAction SilentlyContinue
```

## 再次 finalize（仅当 .git 仍无提交时）

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\finalize-git.ps1
```
