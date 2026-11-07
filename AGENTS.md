# Temple notification preference

The user requests a gentle ten-second cricket sound immediately before a final
completion response, or a request for the user to click, approve, or answer.
Run `notification_sounds/play_notification.ps1` once at those points, not for
routine progress updates. It plays the existing local ten-second WAV.
If playback fails, report the failure without claiming that the user heard it.
