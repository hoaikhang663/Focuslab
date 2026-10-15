# Firebase setup

The Firebase web SDK is loaded from Google's CDN at runtime; no package manager or API key secret is required. The Firebase web configuration in `script.js` identifies the public web app and is not an authorization boundary.

Before using sign-in and cloud sync:

1. In Firebase Console, enable Google and Email/Password under Authentication → Sign-in method.
2. Add the web app's host (for local development, `localhost`) under Authentication → Settings → Authorized domains.
3. Create a Cloud Firestore database.
4. Publish the rules in [`firestore.rules`](./firestore.rules).

The app stores profile data and calendar entries in `users/{uid}/data/progress`. Focus sessions are separate documents in `users/{uid}/focusSessions/{sessionId}` so session history does not grow inside one Firestore document. Reads and writes are limited by the rules to the authenticated owner.

On first sign-in, existing local data is merged by record ID with the account's cloud data and uploaded only after both Firestore reads finish. If the cloud is unavailable, local data remains available and no cloud write is started. Audio files and audio-player preferences are not synced.

For the website, run the app through a local web server such as VS Code Live Server. Firebase CDN modules and Google popup authentication require an HTTP(S) origin rather than directly opening `index.html` with `file://`.

For Windows desktop development, see [`ELECTRON_SETUP.md`](./ELECTRON_SETUP.md). Electron serves the unchanged app files on a localhost-only HTTP origin so Firebase CDN modules can load. The desktop origin uses a different port from Live Server, so its localStorage is separate; the app does not automatically copy local data between web and desktop.
