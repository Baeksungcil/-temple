$notificationPlayer = New-Object System.Media.SoundPlayer((Join-Path $PSScriptRoot 'crickets_10s.wav'))
try { $notificationPlayer.Load(); $notificationPlayer.PlaySync() } finally { $notificationPlayer.Dispose() }
