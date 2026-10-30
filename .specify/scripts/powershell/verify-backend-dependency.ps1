[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$webRoot = (Get-Location).Path
$backendRoot = Join-Path (Split-Path $webRoot -Parent) 'gestion-de-trabajo-becario-backend'
$backendFeature = Join-Path $backendRoot 'specs\001-becas-upb-management'
$requiredFiles = @(
  (Join-Path $backendFeature 'spec.md'),
  (Join-Path $backendFeature 'tasks.md'),
  (Join-Path $backendRoot 'openapi.yaml')
)

$missing = @($requiredFiles | Where-Object { -not (Test-Path -LiteralPath $_) })
if ($missing.Count -gt 0) {
  Write-Error ("Backend dependency is incomplete. Missing: " + ($missing -join ', '))
  exit 1
}

$unfinished = Select-String -LiteralPath (Join-Path $backendFeature 'tasks.md') -Pattern '^- \[ \] T\d+' -AllMatches
if ($unfinished) {
  Write-Error 'Backend dependency is incomplete: tasks.md contains unfinished tasks.'
  exit 1
}

$openapi = Get-Content -LiteralPath (Join-Path $backendRoot 'openapi.yaml') -Raw
foreach ($route in @('/me/rating:', '/applications/{id}/evaluation:')) {
  if ($openapi -notmatch [regex]::Escape($route)) {
    Write-Error "Backend contract is incomplete: missing $route"
    exit 1
  }
}

Write-Output 'Backend dependency ready: spec, tasks, evaluation contract, and OpenAPI routes are complete.'
