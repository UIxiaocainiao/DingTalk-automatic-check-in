const { app, dialog, ipcMain, shell } = require("electron");

const { getApiBaseUrl, restartBackend, stopBackend } = require("./backend");
const { getBackendLogDir, getBackendRuntimeDir } = require("./paths");
const { runStartup } = require("./startup");
const { createTray, destroyTray } = require("./tray");
const { createMainWindow, showMainWindow } = require("./window");

let appIsQuitting = false;

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
}

if (hasSingleInstanceLock) {
  app.on("second-instance", () => {
    showMainWindow();
  });
}

function registerIpcHandlers() {
  ipcMain.handle("desktop:get-runtime-info", async () => ({
    isDesktop: true,
    isPackaged: app.isPackaged,
    appVersion: app.getVersion(),
    apiBaseUrl: getApiBaseUrl(),
  }));

  ipcMain.handle("desktop:open-logs-dir", async () => shell.openPath(getBackendLogDir()));
  ipcMain.handle("desktop:open-config-dir", async () => shell.openPath(getBackendRuntimeDir()));
  ipcMain.handle("desktop:restart-backend", async () => restartBackend());
}

async function boot() {
  try {
    await runStartup();
    const window = await createMainWindow();

    window.on("close", (event) => {
      if (!appIsQuitting) {
        event.preventDefault();
        window.hide();
      }
    });

    createTray({
      openMainWindow: () => showMainWindow(),
      restartBackend: async () => restartBackend(),
      openLogsDir: async () => shell.openPath(getBackendLogDir()),
      openConfigDir: async () => shell.openPath(getBackendRuntimeDir()),
      quitApp: () => {
        appIsQuitting = true;
        app.quit();
      },
    });
    registerIpcHandlers();
  } catch (error) {
    dialog.showErrorBox("启动失败", `${error.message}\n\n请先确认 Python3 可用，并且 backend 能正常启动。`);
    app.quit();
  }
}

if (hasSingleInstanceLock) {
  app.whenReady().then(boot);
}

app.on("activate", async () => {
  await createMainWindow();
  showMainWindow();
});

app.on("before-quit", () => {
  appIsQuitting = true;
});

app.on("will-quit", async (event) => {
  event.preventDefault();
  destroyTray();
  await stopBackend();
  app.exit(0);
});
