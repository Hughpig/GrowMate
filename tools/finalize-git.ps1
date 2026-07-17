# Finalize GrowMate Git repository (run once in PowerShell)
# Moves the initial commit from work/gitdir into standard .git

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path (Join-Path $repo "work\gitdir\HEAD"))) {
  # script may live in tools/
  $repo = Split-Path -Parent $repo
}
Set-Location $repo

$source = Join-Path $repo "work\gitdir"
if (-not (Test-Path (Join-Path $source "refs\heads\master"))) {
  Write-Error "Cannot find initial commit at work/gitdir. Nothing to finalize."
}

$target = Join-Path $repo ".git"
if (Test-Path $target) {
  $hasCommit = Test-Path (Join-Path $target "refs\heads\master")
  if ($hasCommit) {
    Write-Host "Standard .git already has commits. Done."
    git -C $repo log -1 --oneline
    exit 0
  }
  $backup = Join-Path $repo (".git-empty-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
  Write-Host "Backing up empty .git to $backup"
  Rename-Item -LiteralPath $target -NewName (Split-Path $backup -Leaf)
}

Write-Host "Promoting work/gitdir -> .git"
Move-Item -LiteralPath $source -Destination $target

# Drop absolute worktree override so repo is portable
git -C $repo config --unset-all core.worktree 2>$null
git -C $repo status -sb
git -C $repo log -1 --stat
Write-Host ""
Write-Host "Git finalize complete. You can use normal git commands now."
