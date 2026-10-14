# FocusLab local music

All local playback files belong in this folder. The playlist in `script.js` uses these exact paths:

| Track | File path from the project root |
| --- | --- |
| Quiet Afternoon | `music/quiet-afternoon.mp3` |
| Coffee Break | `music/coffee-break.mp3` |
| Soft Night | `music/soft-night.mp3` |
| Deep Work | `music/deep-work.mp3` |
| Tiếng mưa thư giãn | `music/rain.mp3` |

The player supports browser-compatible MP3 (`.mp3`), OGG (`.ogg`), and WAV (`.wav`) files. The default entries above use MP3. If you add an OGG or WAV instead, update that entry's `src` in the `LOCAL_TRACKS` list near the top of `script.js`, for example:

```js
{ id: "local-study-01", title: "Deep Work", artist: "Artist", category: "study", src: "music/deep-work.ogg" }
```

Paths are relative to `index.html`. The same relative URL works in a local web server and in an Electron app that packages the `music/` folder beside the app's web assets.

Add only audio you own or are licensed to use. The player reports a missing file or unsupported format with the track path. YouTube playback remains separate and uses its own saved playlist.

All system tracks, including rain, are regular Lo-fi playlist items. Choose the Sleep & Calm filter for Soft Night and Tiếng mưa thư giãn. The player has no separate ambient folders or controls.
