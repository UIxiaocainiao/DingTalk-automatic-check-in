const fs = require("node:fs");
const path = require("node:path");
const { app } = require("electron");

function getProjectRoot() {
  return path.resolve(__dirname, "../..");
}

function getResourceRoot() {
  return app.isPackaged ? process.resourcesPath : getProjectRoot();
}

function getFrontendDistDir() {
  return path.join(getResourceRoot(), "frontend", "dist");
}

function getFrontendIndexPath() {
  return path.join(getFrontendDistDir(), "index.html");
}

function getBackendRoot() {
  return path.join(getResourceRoot(), "backend");
}

function getBackendEntryPath() {
  return path.join(getBackendRoot(), "api_server.py");
}

function getPlatformToolsInstallRoot() {
  return path.join(getBackendDataRoot(), "platform-tools");
}

function getBackendDataRoot() {
  return path.join(app.getPath("userData"), "backend-data");
}

function getBackendLogDir() {
  return path.join(getBackendDataRoot(), "logs");
}

function getBackendRuntimeDir() {
  return path.join(getBackendDataRoot(), "runtime");
}

function getDesktopAsset(name) {
  return path.join(app.getAppPath(), "assets", name);
}

function getPreloadEntryPath() {
  return app.isPackaged
    ? path.join(app.getAppPath(), "preload", "index.js")
    : path.resolve(__dirname, "../preload/index.js");
}

function ensureRuntimeDirs() {
  const dirs = [getBackendDataRoot(), getBackendLogDir(), getBackendRuntimeDir(), getPlatformToolsInstallRoot()];
  dirs.forEach((dir) => fs.mkdirSync(dir, { recursive: true }));
}

module.exports = {
  ensureRuntimeDirs,
  getBackendDataRoot,
  getBackendEntryPath,
  getBackendLogDir,
  getBackendRoot,
  getBackendRuntimeDir,
  getDesktopAsset,
  getFrontendDistDir,
  getFrontendIndexPath,
  getPlatformToolsInstallRoot,
  getPreloadEntryPath,
  getProjectRoot,
};
