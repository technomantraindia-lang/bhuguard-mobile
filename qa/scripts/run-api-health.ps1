$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $root
npx --yes tsx qa/cli.ts api
exit $LASTEXITCODE
