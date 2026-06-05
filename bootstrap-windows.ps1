$ErrorActionPreference = "Stop"

$ProjectParent = Join-Path $HOME "Plan5F"
$ProjectDir = Join-Path $ProjectParent "holiday"
$RepoUrl = "https://github.com/capstere/holiday.git"

function Write-Step($Message) {
  Write-Host "`n▶ $Message" -ForegroundColor Cyan
}

function Write-Warn($Message) {
  Write-Host "`n⚠ $Message" -ForegroundColor Yellow
}

function Fail($Message) {
  Write-Host "`n✖ $Message" -ForegroundColor Red
  exit 1
}

function Refresh-PathForCommonTools {
  $extraPaths = @(
    "C:\Program Files\Git\cmd",
    "C:\Program Files\nodejs",
    "$env:LOCALAPPDATA\Microsoft\WindowsApps"
  )

  foreach ($path in $extraPaths) {
    if ((Test-Path $path) -and ($env:Path -notlike "*$path*")) {
      $env:Path = "$env:Path;$path"
    }
  }
}

function Has-Command($Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Ensure-Winget {
  Refresh-PathForCommonTools
  if (Has-Command "winget") { return }

  Fail "winget saknas. Installera 'App Installer' från Microsoft Store, eller installera Git och Node.js LTS manuellt, och kör sedan kommandot igen."
}

function Install-WithWinget($Id, $Label) {
  Ensure-Winget
  Write-Step "Installerar $Label via winget..."
  winget install --id $Id --exact --source winget --accept-package-agreements --accept-source-agreements
  Refresh-PathForCommonTools
}

function Ensure-Git {
  Refresh-PathForCommonTools
  if (Has-Command "git") {
    Write-Step "Git finns redan: $(git --version)"
    return
  }

  Write-Warn "Git saknas. Försöker installera automatiskt."
  Install-WithWinget "Git.Git" "Git"

  if (-not (Has-Command "git")) {
    Fail "Git kunde inte hittas efter installation. Stäng och öppna VS Code igen och kör samma kommando en gång till."
  }

  Write-Step "Git installerat: $(git --version)"
}

function Ensure-Node {
  Refresh-PathForCommonTools
  if ((Has-Command "node") -and (Has-Command "npm")) {
    Write-Step "Node finns redan: node $(node --version), npm $(npm --version)"
    return
  }

  Write-Warn "Node.js/npm saknas. Försöker installera Node.js LTS automatiskt."
  Install-WithWinget "OpenJS.NodeJS.LTS" "Node.js LTS"

  if (-not ((Has-Command "node") -and (Has-Command "npm"))) {
    Fail "Node/npm kunde inte hittas efter installation. Stäng och öppna VS Code igen och kör samma kommando en gång till."
  }

  Write-Step "Node installerat: node $(node --version), npm $(npm --version)"
}

function Clone-OrUpdateRepo {
  New-Item -ItemType Directory -Force -Path $ProjectParent | Out-Null

  if (Test-Path (Join-Path $ProjectDir ".git")) {
    Write-Step "Projektet finns redan. Uppdaterar från GitHub..."
    Set-Location $ProjectDir
    git pull --ff-only
    return
  }

  if (Test-Path $ProjectDir) {
    Fail "$ProjectDir finns redan men verkar inte vara ett Git-repo. Byt namn på mappen eller ta bort den och kör igen."
  }

  Write-Step "Laddar ner projektet till $ProjectDir ..."
  git clone $RepoUrl $ProjectDir
  Set-Location $ProjectDir
}

function Start-Game {
  Write-Step "Installerar projektpaket..."
  npm install

  Write-Step "Startar Plan 5F Z4-prototypen..."
  Write-Host "`nOm webbläsaren inte öppnas automatiskt, öppna:" -ForegroundColor White
  Write-Host "  http://localhost:5173/z4.html`n" -ForegroundColor Green
  Write-Host "Controls: WASD move · mouse look · Shift faster · R reset · M minimap · O openings · C collision · Esc release mouse`n" -ForegroundColor DarkGray
  npm run play
}

Write-Host "`nPlan 5F Windows bootstrap" -ForegroundColor Cyan
Ensure-Git
Ensure-Node
Clone-OrUpdateRepo
Start-Game
