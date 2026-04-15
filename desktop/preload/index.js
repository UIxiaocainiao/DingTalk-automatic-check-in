const { contextBridge, ipcRenderer } = require("electron");

const localApiBaseUrl = "http://127.0.0.1:8000";

contextBridge.exposeInMainWorld("dingtalkDesktop", {
  isDesktop: true,
  apiBaseUrl: localApiBaseUrl,
  getRuntimeInfo: () => ipcRenderer.invoke("desktop:get-runtime-info"),
  openLogsDir: () => ipcRenderer.invoke("desktop:open-logs-dir"),
  openConfigDir: () => ipcRenderer.invoke("desktop:open-config-dir"),
  restartBackend: () => ipcRenderer.invoke("desktop:restart-backend"),
});
