# Finalize GrowMate Git repository (run once in PowerShell)
# Promotes work/gitdir into standard .git after sandbox initial commit.

$ErrorActionPreference = "Continue"
$scriptPath = $MyInvocation.MyCommand.Path
if (-not $scriptPath) { $scriptPath = $PSCommandPath }
$repo = Resolve-Path (Join-Path (Split-Path -Parent $scriptPath) "..") | Select-Object -ExpandProperty Path

Set-Location $repo
Write-Host "Repo: $repo"

$source = Join-Path $repo "work\gitdir"
$target = Join-Path $repo ".git"

if (-not (Test-Path (Join-Path $target "refs\heads\master"))) {
  if (-not (Test-Path (Join-Path $source "refs\heads\master"))) {
    Write-Error "Cannot find commits in .git or work/gitdir."
    exit 1
  }

  if (Test-Path $target) {
    $backup = Join-Path $repo (".git-empty-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
    Write-Host "Backing up empty .git to $backup"
    Rename-Item -LiteralPath $target -NewName (Split-Path $backup -Leaf)
  }

  Write-Host "Promoting work/gitdir -> .git"
  Move-Item -LiteralPath $source -Destination $target
} else {
  Write-Host "Standard .git already has commits."
}

# Make repo portable (ignore failures)
& git -C $repo config --unset-all core.worktree 2>$null | Out-Null

# Cleanup empty backups
Get-ChildItem -LiteralPath $repo -Force -Directory -Filter ".git-empty-backup-*" -ErrorAction SilentlyContinue |
  ForEach-Object {
    Write-Host "Removing backup $($_.Name)"
    Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
  }

Write-Host ""
Write-Host "=== git log ==="
& git -C $repo log --oneline
Write-Host ""
Write-Host "=== git status ==="
& git -C $repo status -sb
Write-Host ""
Write-Host "Git finalize complete. You can use normal git commands now."
