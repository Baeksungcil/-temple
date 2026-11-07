# Temple v6 — 2026-11-06

Entry starts background music at the default 35% after the user's gesture.
Ambient/environment/practical illumination lowered; local visitor has a dedicated fill
light. Window shafts remain stronger against the darker room.

The previous fellowship room now displays 고해성사실; its stable room ID remains
fellowship to preserve protocol compatibility. The booth has solid side/back navigation
bounds and an open central entrance. Its action appears within 3.6 world units.
The form uses plain text, stays local to this browser, and sends nothing to chat or
storage. A maximum of three bubbles rise in world space and disappear after 8 seconds.
Mobile keyboard insets also apply to the confession input.

The YouTube iframe stays in one DOM container rather than being reparented/reloaded.
It starts from the worship-video gesture and pauses on return. Retry and direct
YouTube links are available. Browser test confirmed actual video time advancing.

15 Node tests passed; production build passed with the existing bundle warning.
Mobile Chrome emulation verified entry audio playback, YouTube time 3.095214 seconds,
proximity form visibility, literal text (HTML not executed), and bubble expiry.
The confession interaction was tested in a component harness; navigation reachability
was tested independently. Actual phone keyboard, audio output and GPU performance
remain user-device checks. Browser API playback does not prove speaker audibility.

Notification preference: notification_sounds/play_notification.ps1 plays the local
crickets_10s.wav, exactly ten seconds. Recorded in AGENTS.md for future work.

Public gateway must restart after a build to refresh its dist file allowlist.
The current tunnel remains https://talked-were-bargain-effort.trycloudflare.com .
Only that site URL should be presented as a mobile link; Cloudflare documentation
is not the Temple website. PC, backend, gateway and tunnel must remain running.
