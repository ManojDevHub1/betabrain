const { app, BrowserWindow, Menu, protocol, net, shell, session } = require("electron");
const path = require("path");

/* -------------------------------------------------------------------------- */
/*             1. MANDATORY WEBGPU & CHROMIUM HARDWARE FLAGS                  */
/* -------------------------------------------------------------------------- */
// Must be appended before app.whenReady()
app.commandLine.appendSwitch("enable-unsafe-webgpu");
app.commandLine.appendSwitch("enable-features", "WebGPU");
app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");
app.commandLine.appendSwitch("use-angle", "default");
app.commandLine.appendSwitch("force_high_performance_gpu");
app.commandLine.appendSwitch("gpu-preference", "2"); // 2 = Dedicated High-Performance Discrete GPU (NVIDIA/AMD)

/* -------------------------------------------------------------------------- */
/*         2. REGISTER PRIVILEGED SCHEME FOR SECURE IN-APP ASSETS             */
/* -------------------------------------------------------------------------- */
// Enables WebGPU, IndexedDB, and Fetch APIs to run identically to a secure web origin
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    title: "BetaBrain // The Clean Room",
    backgroundColor: "#F7F7F9",
    autoHideMenuBar: true, // Hide top menu bar for clean native software look
    webPreferences: {
      // 1. ENABLE CONTEXT ISOLATION (Crucial security boundary between renderer and preload)
      contextIsolation: true,
      // 2. DISABLE NODE INTEGRATION (Prevents renderer process from accessing local filesystem or Node APIs)
      nodeIntegration: false,
      // 3. DISABLE REMOTE MODULE (Completely blocks legacy remote code execution vulnerabilities)
      enableRemoteModule: false,
      // 4. SECURE WEB SECURITY (Enforces same-origin policy and blocks insecure content execution)
      webSecurity: true,
      allowRunningInsecureContent: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Explicitly disable the default menu bar completely
  mainWindow.setMenuBarVisibility(false);
  Menu.setApplicationMenu(null);

  const isDev = process.env.NODE_ENV === "development";

  // Navigation Guard: Prevent renderer from navigating away to malicious external URLs
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const allowedPrefix = isDev ? "http://localhost:3000" : "app://";
    if (!navigationUrl.startsWith(allowedPrefix)) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  // Window Open Guard: Open external links in user's default browser and deny in-app popups
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    // In production, load the Next.js exported static build via custom app:// protocol
    mainWindow.loadURL("app://./index.html");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Enforce strict CSP at the network session level
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self' app: file:; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' app: https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' app: https://fonts.googleapis.com; font-src 'self' app: data: https://fonts.gstatic.com; img-src 'self' app: data: blob: https:; connect-src 'self' app: blob: data: https://huggingface.co https://*.huggingface.co https://cdn-lfs.huggingface.co https://*.hf.co https://raw.githubusercontent.com https://github.com http://localhost:* ws://localhost:*; worker-src 'self' blob:; child-src 'self' blob:; frame-src 'self' data: blob:; object-src 'none'; base-uri 'self'; form-action 'self';",
        ],
      },
    });
  });

  // Block unneeded sensitive device permissions (camera, microphone, geolocation)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(false);
  });

  // Protocol handler: resolves app://./ paths directly to Next.js out/ directory
  protocol.handle("app", (request) => {
    try {
      const url = new URL(request.url);
      let relativePath = decodeURIComponent(url.pathname);
      if (relativePath === "/" || relativePath === "") {
        relativePath = "/index.html";
      }

      const outDir = path.normalize(path.join(__dirname, "../out"));
      const targetPath = path.normalize(path.join(outDir, relativePath));

      // Security check: Prevent directory traversal outside of out/ directory
      if (!targetPath.startsWith(outDir)) {
        return new Response("Access Denied", { status: 403 });
      }

      return net.fetch(`file:///${targetPath.replace(/\\/g, "/")}`);
    } catch (err) {
      console.error("Protocol resolution error:", err);
      return new Response("Not Found", { status: 404 });
    }
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
