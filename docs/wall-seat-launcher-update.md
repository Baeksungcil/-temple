# Temple wall video, seating, touch zoom, snow and desktop launcher

The one YouTube iframe belongs to the physical screen behind the pastor. It starts
muted on connection and loops. The worship-video action changes the camera to frame
that screen; it temporarily lifts the walking camera distance/polar limits so the
video is not cropped. Returning restores those limits and continues the same video.
There is no floating mini player. Sound can be enabled in the viewing controls.

Seated body height rises from 0.8 to 1.3 instead of lowering into the bench. With
visitor scale 0.85, the pelvis bottom is 0.9384, matching the 0.94 seat top. The
visible toolbar changes to 일어나기 and returns to 앉기 after standing. Remote
visitors share the same corrected pose.

A short two-finger tap zooms the camera in by 22%; moving/pinching fingers keep
OrbitControls behavior. Snow uses 780 transparent points, excludes navigation
picking and honors reduced-motion preferences.

Start-Temple.ps1 starts only missing world/gateway services and reuses a working
mobile tunnel, or creates a new temporary URL when necessary. It stores the latest
address in mobile-url.txt. The desktop shortcut starts it independently of VS Code.
All helpers run hidden; errors are written to server/desktop-start-error.txt and
shown when the shortcut is used. Node and built dist are local prerequisites.
The PC must remain powered on. The temporary mobile URL can change after restart.

Geometry, protocol and navigation checks passed. Mobile Chromium tested seating,
toolbar labels and two-finger touch events in a component harness; the complete
app tested autoplay, enlargement without cropping, and continuous playback after
return. These are automated browser checks, not an actual phone audio/GPU test.
