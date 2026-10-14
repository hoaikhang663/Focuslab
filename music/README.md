# FocusLab local music

Place music files in this folder and reference them in the `LOCAL_TRACKS` list near the top of `script.js`.

The player supports browser-compatible MP3 (`.mp3`), OGG (`.ogg`), and WAV (`.wav`) files. For example:

```js
{ id: "local-study-01", title: "Deep Work", artist: "Artist", category: "study", src: "music/deep-work.ogg" }
```

The default playlist expects `quiet-afternoon.mp3`, `coffee-break.mp3`, `soft-night.mp3`, and `deep-work.mp3`. These files are intentionally not included; add your own licensed audio, or change each playlist entry to match the filename and format you add.

Keep the path relative to `index.html`. The same relative URL works in a local web server and in an Electron app that packages the `music/` folder beside the app's web assets.

No audio files are included. Add only files you own or are licensed to use. Missing files and unsupported formats are reported by the player.
