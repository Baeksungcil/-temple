param([switch]$NoBrowser,[switch]$NoUI)
$ErrorActionPreference='Stop'
$templeRoot=$PSScriptRoot
$nodePath='C:\Program Files\nodejs\node.exe'
$runtimeDir=Join-Path $templeRoot 'server'
$mutex=New-Object System.Threading.Mutex($false,'Local\TempleServerLauncher20261105')
$acquired=$false
function Read-Health([string]$url) {
 try { return Invoke-RestMethod -Uri $url -TimeoutSec 5 } catch { return $null }
}
function Read-SharedLog([string]$path) {
 $stream=$null;$reader=$null
 try {
  $stream=[IO.File]::Open($path,[IO.FileMode]::Open,[IO.FileAccess]::Read,([IO.FileShare]::ReadWrite -bor [IO.FileShare]::Delete))
  $reader=[IO.StreamReader]::new($stream)
  return $reader.ReadToEnd()
 } catch [IO.IOException] { return '' }
 finally {if($reader){$reader.Dispose()}elseif($stream){$stream.Dispose()}}
}
function Ensure-Service([string]$name,[string]$entry,[string]$healthUrl,[string]$expected) {
 $health=Read-Health $healthUrl
 if(($expected -eq 'world' -and $health.status -eq 'ok' -and $health.capacity -eq 100) -or ($expected -eq 'gateway' -and $health.service -eq 'temple-mobile-preview')) { return }
 $out=Join-Path $runtimeDir ('desktop-'+$name+'.log');$err=Join-Path $runtimeDir ('desktop-'+$name+'-error.log')
 Start-Process -FilePath $nodePath -ArgumentList $entry -WorkingDirectory $templeRoot -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $err | Out-Null
 for($attempt=0;$attempt -lt 25;$attempt++) {
  Start-Sleep -Milliseconds 400;$health=Read-Health $healthUrl
  if(($expected -eq 'world' -and $health.status -eq 'ok' -and $health.capacity -eq 100) -or ($expected -eq 'gateway' -and $health.service -eq 'temple-mobile-preview')) { return }
 }
 throw ($name+' did not start. Check '+$err)
}
try {
 $acquired=$mutex.WaitOne(0)
 if(-not $acquired){ Write-Output 'Temple is already starting.';exit 0 }
 if(-not(Test-Path -LiteralPath $nodePath)){throw 'Node.js is not installed.'}
 if(-not(Test-Path -LiteralPath (Join-Path $templeRoot 'dist\index.html'))){throw 'Build the Temple site first.'}
 if(-not(Test-Path -LiteralPath (Join-Path $templeRoot 'server\node_modules\ws\package.json'))){throw 'Temple world dependency ws is missing.'}
 Ensure-Service 'world' 'server/index.js' 'http://127.0.0.1:8790/health' 'world'
 Ensure-Service 'gateway' 'mobile-gateway.mjs' 'http://127.0.0.1:8810/__mobile_health' 'gateway'
 $originPath=Join-Path $templeRoot 'public-origin.json';$origin=$null
 if(Test-Path -LiteralPath $originPath){try{$saved=Get-Content -LiteralPath $originPath -Raw | ConvertFrom-Json;if($saved.origin -match '^https://[a-z0-9-]+\.trycloudflare\.com$'){$remote=Read-Health ($saved.origin+'/__mobile_health');if($remote.service -eq 'temple-mobile-preview'){$origin=$saved.origin}}}catch{}}
 if(-not $origin){
  $tunnelPath=Join-Path $templeRoot '.tools\cloudflared.exe'
  if(-not(Test-Path -LiteralPath $tunnelPath)){throw 'Temple tunnel program is missing.'}
  $stamp=Get-Date -Format 'yyyyMMdd-HHmmss';$out=Join-Path $runtimeDir ('desktop-tunnel-'+$stamp+'.log');$err=Join-Path $runtimeDir ('desktop-tunnel-'+$stamp+'-error.log')
  $configPath=Join-Path $templeRoot '.tools\cloudflared.yml'
  $tunnelArgs='tunnel --config "'+$configPath+'" --url http://127.0.0.1:8810 --no-autoupdate'
  Start-Process -FilePath $tunnelPath -ArgumentList $tunnelArgs -WorkingDirectory $templeRoot -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $err | Out-Null
  for($attempt=0;$attempt -lt 60;$attempt++){
   Start-Sleep -Milliseconds 500
   if(Test-Path -LiteralPath $err){$match=[regex]::Match((Read-SharedLog $err),'https://[a-z0-9-]+\.trycloudflare\.com');if($match.Success){$origin=$match.Value;break}}
  }
  if(-not $origin){throw ('Could not obtain a mobile URL. Check '+$err)}
  [IO.File]::WriteAllText($originPath,(@{origin=$origin}|ConvertTo-Json -Compress))
  $connected=$false
  for($attempt=0;$attempt -lt 60;$attempt++){ $remote=Read-Health ($origin+'/__mobile_health');if($remote.service -eq 'temple-mobile-preview'){$connected=$true;break};Start-Sleep -Milliseconds 1000 }
  if(-not $connected){throw 'The mobile URL is not reachable yet. Please click the Temple icon again.'}
 }
 $siteUrl=$origin+'/?open=desktop'
 [IO.File]::WriteAllText((Join-Path $templeRoot 'mobile-url.txt'),$siteUrl)
 [IO.File]::WriteAllText((Join-Path $runtimeDir 'desktop-runtime.json'),(@{url=$siteUrl;checkedAt=(Get-Date -Format o);world='ok';gateway='ok'}|ConvertTo-Json))
 Write-Output ('Temple ready: '+$siteUrl)
 if(-not $NoBrowser){Start-Process $siteUrl | Out-Null}
} catch {
 [IO.File]::WriteAllText((Join-Path $runtimeDir 'desktop-start-error.txt'),$_.Exception.Message)
 if(-not $NoUI){Add-Type -AssemblyName System.Windows.Forms;[System.Windows.Forms.MessageBox]::Show($_.Exception.Message,'Temple server')|Out-Null}
 throw
} finally {if($acquired){$mutex.ReleaseMutex()};$mutex.Dispose()}
