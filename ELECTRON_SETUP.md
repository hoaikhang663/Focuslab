# FocusForge desktop development

FocusForge keeps one shared `index.html`, `style.css`, `script.js`, and `music/` folder for both the website and desktop app. Electron serves those same packaged files over an HTTP loopback listener at `http://localhost:41739`; the listener binds only to `localhost`, serves read-only application assets, and closes when the desktop app exits. It is not a public server and does not expose a write API.

The stable local origin allows desktop `localStorage` to persist between launches. Its port differs from VS Code Live Server, so website and desktop browser storage are separate. The app does not import, delete, or overwrite data between these environments.

## Run on Windows

```powershell
npm install
npm run desktop
```

The local port `41739` must be available. The desktop app reports a startup error if another process already uses it.

## Build a Windows installer

```powershell
npm run dist:win
```

The NSIS installer is written to `release/`. This only builds a local installer; it does not publish or distribute it. The package includes the HTML, CSS, JavaScript, Electron main/preload files, and all `music/` assets.

## Security and sign-in

The renderer has `contextIsolation`, `sandbox`, and `webSecurity` enabled, with Node integration disabled. The preload exposes only a read-only desktop marker. The local listener accepts only loopback requests for known static assets; it has no API for changing user data. Only HTTPS popup windows for the configured Google/Firebase authentication hosts are allowed.

Email/Password and Google sign-in continue to use the existing Firebase Web SDK from its CDN. The app does not change Firebase configuration, authorized domains, Firestore rules, or user data. Firebase Authentication must have `localhost` in its authorized domains. Google may block OAuth sign-in in embedded Electron Chromium even when the popup opens; if so, do not change production settings or add an alternate OAuth flow until that behavior and a safe callback approach have been reviewed.
