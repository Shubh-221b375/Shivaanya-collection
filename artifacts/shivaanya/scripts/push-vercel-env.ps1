# Push server + build env vars to Vercel from .env.local (run once after: npx vercel login)
# Usage (from artifacts/shivaanya):  .\scripts\push-vercel-env.ps1

$ErrorActionPreference = "Stop"
$appRoot = Split-Path $PSScriptRoot -Parent
Set-Location $appRoot

$envFile = Join-Path $appRoot ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Error ".env.local not found. Copy .env.example and fill in keys first."
}

$vars = @(
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "ORDER_NOTIFY_EMAIL",
  "ORDER_SITE_URL",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_SMS_FROM",
  "TWILIO_NOTIFY_PHONE",
  "GOOGLE_SHEETS_WEBHOOK_URL",
  "GOOGLE_SHEETS_WEBHOOK_SECRET",
  "VITE_MEDIA_BASE_URL"
)

function Get-DotEnvValue([string]$name) {
  foreach ($line in Get-Content $envFile) {
    if ($line -match "^\s*$name\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim().Trim('"')
    }
  }
  return $null
}

Write-Host "Linking Vercel project (artifacts/shivaanya)..." -ForegroundColor Cyan
npx vercel link --yes 2>&1 | Out-Host

foreach ($name in $vars) {
  $val = Get-DotEnvValue $name
  if ([string]::IsNullOrWhiteSpace($val)) {
    Write-Host "Skip $name (empty in .env.local)" -ForegroundColor DarkYellow
    continue
  }
  Write-Host "Setting $name for production..." -ForegroundColor Green
  $val | npx vercel env add $name production --force 2>&1 | Out-Host
}

Write-Host "`nRedeploy: npx vercel --prod" -ForegroundColor Cyan
