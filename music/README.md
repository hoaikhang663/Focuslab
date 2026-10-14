# FocusLab local music

The app does not bundle audio files. To make the four default system-music entries playable, add your own licensed files to this folder with these exact names:

| Track | File path from the project root |
| --- | --- |
| Quiet Afternoon | `music/quiet-afternoon.mp3` |
| Coffee Break | `music/coffee-break.mp3` |
| Soft Night | `music/soft-night.mp3` |
| Deep Work | `music/deep-work.mp3` |

The player supports browser-compatible MP3 (`.mp3`), OGG (`.ogg`), and WAV (`.wav`) files. The default entries above use MP3. If you add an OGG or WAV instead, update that entry's `src` in the `LOCAL_TRACKS` list near the top of `script.js`, for example:

```js
{ id: "local-study-01", title: "Deep Work", artist: "Artist", category: "study", src: "music/deep-work.ogg" }
```

Paths are relative to `index.html`. The same relative URL works in a local web server and in an Electron app that packages the `music/` folder beside the app's web assets.

No audio files are included. Add only files you own or are licensed to use. The player reports a missing file or unsupported format with the track path; the separate YouTube player continues to work independently.

The existing ambient-sound controls use separate paths outside `music/`. They also have no bundled audio. To enable them, add licensed MP3 files at `audio/ambient/rain.mp3`, `audio/ambient/ocean.mp3`, `audio/ambient/cafe.mp3`, and `audio/ambient/campfire.mp3`.
