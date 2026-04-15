const http = require("node:http");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const {
  ensureRuntimeDirs,
  getBackendEntryPath,
  getBackendLogDir,
  getBackendRoot,
  getBackendRuntimeDir,
  getPlatformToolsInstallRoot,
} = require("./paths");

const BACKEND_HOST = process.env.DINGTALK_BACKEND_HOST || "127.0.0.1";
const BACKEND_PORT = Number(process.env.DINGTALK_BACKEND_PORT || 8000);
const BACKEND_HEALTH_PATH = "/api/health";
const HEALTH_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}${BACKEND_HEALTH_PATH}`;

let backendProcess = null;
let managedByDesktop = false;

function getApiBaseUrl() {
  return `http://${BACKEND_HOST}:${BACKEND_PORT}`;
}

function getBackendEnv() {
  const runtimeDir = getBackendRuntimeDir();
  const logsDir = getBackendLogDir();
  return {
    ...process.env,
    HOST: BACKEND_HOST,
    PORT: String(BACKEND_PORT),
    DINGTALK_PLATFORM_TOOLS_DIR: getPlatformToolsInstallRoot(),
    DINGTALK_CONSOLE_CONFIG_FILE: path.join(runtimeDir, "console-config.json"),
    DINGTALK_CONSOLE_PROCESS_FILE: path.join(logsDir, "dingtalk-random-scheduler.process.json"),
    DINGTALK_CONSOLE_LOG_FILE: path.join(logsDir, "dingtalk-random-scheduler.log"),
    DINGTALK_CONSOLE_ERR_LOG_FILE: path.join(logsDir, "dingtalk-random-scheduler.err.log"),
    DINGTALK_CONSOLE_CHECKIN_RECORDS_FILE: path.join(logsDir, "dingtalk-checkin-records.json"),
    DINGTALK_REMOTE_ADB_STATUS_FILE: path.join(runtimeDir, "remote-adb-status.json"),
    DINGTALK_CONSOLE_DEFAULT_STATE_FILE: path.join(logsDir, "dingtalk-random-scheduler.state.json"),
  };
}

function resolvePythonCommand() {
  const candidates =
    process.platform === "win32"
      ? [
          { command: "py", preArgs: ["-3"] },
          { command: "python", preArgs: [] },
          { command: "python3", preArgs: [] },
        ]
      : [
          { command: "python3", preArgs: [] },
          { command: "python", preArgs: [] },
        ];

  for (const candidate of candidates) {
    const result = spawnSync(candidate.command, ["--version"], { stdio: "ignore" });
    if (result.status === 0) {
      return candidate;
    }
  }
  return null;
}

function checkBackendHealth(timeoutMs = 1200) {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, { timeout: timeoutMs }, (res) => {
      resolve(res.statusCode === 200);
      res.resume();
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForBackendReady(maxAttempts = 30, intervalMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (await checkBackendHealth()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}

async function startBackend() {
  ensureRuntimeDirs();

  if (await checkBackendHealth()) {
    managedByDesktop = false;
    return { reusedExisting: true };
  }

  if (backendProcess) {
    return { reusedExisting: false };
  }

  const python = resolvePythonCommand();
  if (!python) {
    throw new Error("Python runtime not found. Please install python3.");
  }

  const backendEntry = getBackendEntryPath();
  const args = [...python.preArgs, backendEntry, "--host", BACKEND_HOST, "--port", String(BACKEND_PORT)];
  backendProcess = spawn(python.command, args, {
    cwd: getBackendRoot(),
    env: getBackendEnv(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  managedByDesktop = true;

  backendProcess.stdout?.on("data", (chunk) => {
    process.stdout.write(`[backend] ${chunk}`);
  });
  backendProcess.stderr?.on("data", (chunk) => {
    process.stderr.write(`[backend:error] ${chunk}`);
  });
  backendProcess.once("exit", () => {
    backendProcess = null;
  });

  const ready = await waitForBackendReady();
  if (!ready) {
    await stopBackend();
    throw new Error("Backend health check timeout.");
  }

  return { reusedExisting: false };
}

async function stopBackend() {
  if (!backendProcess) return;

  const proc = backendProcess;
  backendProcess = null;

  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (!proc.killed) {
        proc.kill("SIGKILL");
      }
      resolve();
    }, 5000);

    proc.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });

    try {
      proc.kill(process.platform === "win32" ? undefined : "SIGTERM");
    } catch {
      clearTimeout(timer);
      resolve();
    }
  });
}

async function restartBackend() {
  await stopBackend();
  return startBackend();
}

function isBackendManagedByDesktop() {
  return managedByDesktop;
}

module.exports = {
  BACKEND_HEALTH_PATH,
  BACKEND_HOST,
  BACKEND_PORT,
  HEALTH_URL,
  checkBackendHealth,
  getApiBaseUrl,
  isBackendManagedByDesktop,
  restartBackend,
  startBackend,
  stopBackend,
  waitForBackendReady,
};
