$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
$node='C:\Program Files\nodejs\node.exe'
if(-not (Test-Path -LiteralPath '.\server\node_modules\ws\package.json')) { & $node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' ci --prefix server --offline --omit=dev --legacy-peer-deps --install-links --ignore-scripts --cache .npm-cache; if($LASTEXITCODE -ne 0){throw 'Server dependency installation failed'} }
& $node server/index.js
