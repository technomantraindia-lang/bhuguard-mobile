$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $root
npx --yes tsx qa/cli.ts navigation
exit $LASTEXITCODE
