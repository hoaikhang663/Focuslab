"use strict";

const { app, BrowserWindow, dialog, session } = require("electron");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const LOOPBACK_HOST = "localhost";
const LOOPBACK_PORT = 41739;
const TRUSTED_POPUP_HOSTS = [
  "accounts.google.com",
  "focusforge-dce04.firebaseapp.com",
  "focusforge-dce04.web.app"
];
const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".ico", "image/x-icon"],
  [".mp3", "audio/mpeg"],
  [".ogg", "audio/ogg"],
  [".wav", "audio/wav"]
]);

let mainWindow;
let localServer;
let appOrigin;

function isTrustedPopupUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && TRUSTED_POPUP_HOSTS.some((host) =>
      url.hostname === host || url.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

function isLoopbackAddress(address) {
  return address === "::1" || address === "127.0.0.1" || address === "::ffff:127.0.0.1";
}

function resolveAppFile(urlPath, appRoot) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(urlPath);
  } catch {
    return null;
  }

  const relativePath = decodedPath.replace(/^\/+/, "") || "index.html";
  const segments = relativePath.split(/[\\/]/);
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;
  if (relativePath !== "index.html" && relativePath !== "style.css" && relativePath !== "script.js"
    && relativePath !== "assets/focusforge-flame.svg"
    && relativePath !== "favicon.ico" && relativePath !== "favicon-16x16.png"
    && relativePath !== "favicon-32x32.png"
    && !(segments[0] === "music" && segments.length === 2)) return null;

  const extension = path.extname(relativePath).toLowerCase();
  if (!MIME_TYPES.has(extension)) return null;
  const absolutePath = path.resolve(appRoot, relativePath);
  const pathFromRoot = path.relative(appRoot, absolutePath);
  if (pathFromRoot.startsWith("..") || path.isAbsolute(pathFromRoot)) return null;
  return absolutePath;
}

function createLocalServer(appRoot) {
  return http.createServer((request, response) => {
    if (!isLoopbackAddress(request.socket.remoteAddress)
      || !["localhost", `localhost:${LOOPBACK_PORT}`].includes(request.headers.host)
      || !["GET", "HEAD"].includes(request.method)) {
      response.writeHead(403, { "Cache-Control": "no-store" });
      response.end("Forbidden");
      return;
    }

    let requestPath;
    try {
      requestPath = new URL(request.url, `http://${LOOPBACK_HOST}`).pathname;
    } catch {
      response.writeHead(400, { "Cache-Control": "no-store" });
      response.end("Bad request");
      return;
    }

    const filePath = resolveAppFile(requestPath, appRoot);
    if (!filePath) {
      response.writeHead(404, { "Cache-Control": "no-store" });
      response.end("Not found");
      return;
    }

    fs.stat(filePath, (statError, fileInfo) => {
      if (statError || !fileInfo.isFile()) {
        response.writeHead(404, { "Cache-Control": "no-store" });
        response.end("Not found");
        return;
      }

      const headers = {
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
        "Content-Length": fileInfo.size,
        "Content-Type": MIME_TYPES.get(path.extname(filePath).toLowerCase()),
        "X-Content-Type-Options": "nosniff"
      };
      const range = request.headers.range;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match) {
          response.writeHead(416, { "Content-Range": `bytes */${fileInfo.size}` });
          response.end();
          return;
        }
        const start = match[1] ? Number(match[1]) : Math.max(0, fileInfo.size - Number(match[2]));
        const end = match[2] ? Number(match[2]) : fileInfo.size - 1;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= fileInfo.size) {
          response.writeHead(416, { "Content-Range": `bytes */${fileInfo.size}` });
          response.end();
          return;
        }
        const boundedEnd = Math.min(end, fileInfo.size - 1);
        headers["Content-Length"] = boundedEnd - start + 1;
        headers["Content-Range"] = `bytes ${start}-${boundedEnd}/${fileInfo.size}`;
        response.writeHead(206, headers);
        if (request.method === "HEAD") {
          response.end();
          return;
        }
        fs.createReadStream(filePath, { start, end: boundedEnd }).pipe(response);
        return;
      }

      response.writeHead(200, headers);
      if (request.method === "HEAD") {
        response.end();
        return;
      }
      fs.createReadStream(filePath).pipe(response);
    });
  });
}

function startLocalServer(appRoot) {
  if (localServer?.listening) return Promise.resolve();
  return new Promise((resolve, reject) => {
    localServer = createLocalServer(appRoot);
    localServer.once("error", reject);
    localServer.listen(LOOPBACK_PORT, LOOPBACK_HOST, () => {
      localServer.removeListener("error", reject);
      resolve();
    });
  });
}

function guardWindowNavigation(window, allowedOrigin) {
  window.webContents.on("will-navigate", (event, destination) => {
    if (destination !== allowedOrigin && !destination.startsWith(`${allowedOrigin}/`)) event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (!isTrustedPopupUrl(url)) return { action: "deny" };
    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        width: 520,
        height: 720,
        autoHideMenuBar: true,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true
        }
      }
    };
  });
}

async function createMainWindow() {
  const appRoot = app.isPackaged ? app.getAppPath() : path.resolve(__dirname, "..");
  await startLocalServer(appRoot);
  appOrigin = `http://${LOOPBACK_HOST}:${LOOPBACK_PORT}`;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 900,
    minHeight: 640,
    icon: path.join(appRoot, "electron", "focusforge-app.ico"),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  guardWindowNavigation(mainWindow, appOrigin);
  mainWindow.webContents.on("console-message", (event) => {
    const level = ["debug", "info", "warn", "error"][event.level] || "log";
    console[level](`[renderer:${event.lineNumber}] ${event.message}`);
  });
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error(`Renderer process exited: ${details.reason} (code ${details.exitCode})`);
  });
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => { mainWindow = null; });
  await mainWindow.loadURL(`${appOrigin}/`);
}

app.setAppUserModelId("com.focusforge.desktop");
const hasSingleInstance = app.requestSingleInstanceLock();
if (!hasSingleInstance) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      const trustedOrigin = webContents.getURL().startsWith(`${appOrigin}/`);
      callback(trustedOrigin && permission === "notifications");
    });

    try {
      await createMainWindow();
    } catch (error) {
      console.error(`Could not start FocusForge: ${error.stack || error.message}`);
      dialog.showErrorBox(
        "Không thể khởi động FocusForge",
        `Ứng dụng không mở được cổng localhost:${LOOPBACK_PORT}. Hãy đóng ứng dụng khác đang dùng cổng này rồi thử lại.\n\n${error.message}`
      );
      app.quit();
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow().catch((error) => {
          console.error(`Could not reopen FocusForge: ${error.stack || error.message}`);
          dialog.showErrorBox("Không thể khởi động FocusForge", error.message);
        });
      }
    });
  });
}

app.on("before-quit", () => {
  if (localServer) {
    localServer.close();
    localServer = null;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
