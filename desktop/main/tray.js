const fs = require("node:fs");
const { Menu, Tray, nativeImage } = require("electron");

const { getDesktopAsset } = require("./paths");

let tray = null;

function resolveTrayIcon() {
  const candidates = ["trayTemplate.png", "icon.png", "icon.ico", "icon.icns"];
  for (const assetName of candidates) {
    const assetPath = getDesktopAsset(assetName);
    if (fs.existsSync(assetPath)) {
      return nativeImage.createFromPath(assetPath);
    }
  }
  return nativeImage.createEmpty();
}

function createTray(actions) {
  if (tray) return tray;

  tray = new Tray(resolveTrayIcon());
  tray.setToolTip("DingTalk Hybrid Desktop");

  const contextMenu = Menu.buildFromTemplate([
    { label: "打开控制台", click: actions.openMainWindow },
    { type: "separator" },
    { label: "重启后端服务", click: actions.restartBackend },
    { label: "打开日志目录", click: actions.openLogsDir },
    { label: "打开配置目录", click: actions.openConfigDir },
    { type: "separator" },
    { label: "退出", click: actions.quitApp },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("double-click", actions.openMainWindow);
  return tray;
}

function destroyTray() {
  tray?.destroy();
  tray = null;
}

module.exports = {
  createTray,
  destroyTray,
};
