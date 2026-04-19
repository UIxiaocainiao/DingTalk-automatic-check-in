# DingTalkHybridDesktop

面向个人与小团队的钉钉自动打卡 Web 控制台，基于 `React + Python + ADB`，支持本地 USB 与远程 ADB/TCP 接入、双窗口随机调度、工作日校验、日志与记录管理，以及公网场景下的自动重连与保活。

## 项目价值

- 降低人工维护成本：把“设备连接、排期、执行、回看”统一到一个控制台。
- 适配真实生产场景：支持云端部署、远程 ADB 自动连接、断线重试与 systemd 保活。
- 减少误操作风险：通过自检、运行状态可视化、打卡记录持久化，提升可观测性。

## 当前运行形态（重要）

- 现网后端入口是 `backend/api_server.py`（Python）。
- 调度核心在 `backend/dingtalk_random_scheduler.py`（Python）。
- `backend/src/**` 是 Node 分层迁移骨架，当前不参与生产运行。

## 核心能力

- 双时间窗口随机执行：上午/下午独立时间段随机。
- 工作日判断：支持在线工作日 API 校验与开关控制。
- 状态持久化：重启后保留排期与完成状态，避免重复打卡。
- 设备接入：支持 USB ADB、远程 ADB/TCP。
- 公网稳定性增强：
  - 仪表盘自动尝试远程 ADB 连接（可配置冷却时间）。
  - `remote_adb_keepalive.sh` 持续保活。
  - systemd 一键安装模板。
- 可视化运维：配置保存、立即执行、自检、日志和记录查看。

## 架构概览

```text
Frontend (frontend, React + Vite)
  └── 调用 /api/*

Backend API (backend/api_server.py)
  ├── 配置读写
  ├── 调度进程控制（start/stop/run-once/reroll/doctor）
  ├── 远程 ADB 动作与诊断（connect/disconnect/diagnose）
  └── 仪表盘聚合与记录管理

Scheduler (backend/dingtalk_random_scheduler.py)
  ├── ADB 设备状态探测与执行
  ├── 随机排期与状态持久化
  ├── 工作日判断
  └── 打卡记录写入
```

## 快速开始（本地）

### 1) 环境要求

- Python `3.11+`
- Node.js `20+`
- Android 设备已开启 USB 调试并完成授权

### 2) 拉取并启动

```bash
git clone git@github.com:UIxiaocainiao/DingTalkHybridDesktop.git
cd DingTalkHybridDesktop
npm install
npm run dev
```

默认地址：

- 前端：`http://127.0.0.1:5173`
- 后端：`http://127.0.0.1:8000`

### 3) 快速健康检查

```bash
curl -sS http://127.0.0.1:8000/api/health
```

预期返回包含 `"ok": true`。

## 常用命令

### Workspace 命令

```bash
# 同时启动前后端
npm run dev

# 单独启动
npm run dev:frontend
npm run dev:backend

# 构建前端
npm run build
```

### Docker Compose（可选）

```bash
docker compose up --build
```

默认暴露：

- `5173`（frontend）
- `8000`（backend）

### Scheduler CLI

```bash
# 运行调度
python3 backend/dingtalk_random_scheduler.py run

# 调试模式
python3 backend/dingtalk_random_scheduler.py debug

# 状态/排期
python3 backend/dingtalk_random_scheduler.py status
python3 backend/dingtalk_random_scheduler.py schedule

# 自检
python3 backend/dingtalk_random_scheduler.py doctor

# 手动设置下次执行时间
python3 backend/dingtalk_random_scheduler.py set-next --window morning --time 09:06:30
python3 backend/dingtalk_random_scheduler.py set-next --window evening --time 18:08:15
```

### PlaybackE2E 联动（可选）

```bash
# 默认关联目录: ../PlaybackE2E
npm run playback:bootstrap
npm run playback:start
npm run playback:status
npm run playback:stop
```

如目录不在默认位置，可设置：`PLAYBACK_DIR=/absolute/path/to/PlaybackE2E`。

## API 概览

| Method | Path | 用途 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| GET | `/api/dashboard` | 获取控制台聚合数据 |
| GET | `/api/checkin-records` | 获取打卡记录 |
| POST | `/api/config` | 保存配置与窗口信息 |
| POST | `/api/actions/reroll` | 重新抽取随机执行时间 |
| POST | `/api/actions/doctor` | 后端自检 |
| POST | `/api/actions/adb-install` | 在线安装 Android platform-tools |
| POST | `/api/actions/adb-connect` | 连接远程 ADB |
| POST | `/api/actions/adb-disconnect` | 断开远程 ADB |
| POST | `/api/actions/adb-diagnose` | 远程链路诊断（DNS/TCP/adb） |
| POST | `/api/actions/remote-adb-targets/delete` | 删除历史远程目标 |
| POST | `/api/actions/adb-restart` | 重启 ADB server |
| POST | `/api/actions/run-once` | 立即执行一次 |
| POST | `/api/actions/start` | 启动调度 |
| POST | `/api/actions/stop` | 停止调度 |
| POST | `/api/checkin-records` | 添加手动记录 |
| POST | `/api/checkin-records/delete` | 删除指定记录 |

完整字段说明见 [docs/api.md](./docs/api.md)。

## 配置与环境变量

### 1) 前端环境变量

文件：`frontend/.env`（开发）或 `frontend/.env.production`（生产）

- `VITE_API_BASE_URL`：后端 API 地址。
- `VITE_PLAYBACK_API_BASE_URL`：PlaybackE2E API 地址，默认 `http://127.0.0.1:4000`。

### 2) 后端环境变量

- `HOST` / `PORT`：API 监听地址与端口。
- `DINGTALK_CONSOLE_CONFIG_FILE`：控制台配置文件路径。
- `DINGTALK_CONSOLE_PROCESS_FILE`：调度进程状态文件路径。
- `DINGTALK_CONSOLE_LOG_FILE` / `DINGTALK_CONSOLE_ERR_LOG_FILE`：运行日志路径。
- `DINGTALK_CONSOLE_CHECKIN_RECORDS_FILE`：打卡记录文件路径。
- `DINGTALK_REMOTE_ADB_STATUS_FILE`：远程 ADB 状态文件路径。
- `DINGTALK_AUTO_REMOTE_ADB_CONNECT`：是否启用“无在线设备时自动连接远程 ADB”（默认开启）。
- `DINGTALK_AUTO_REMOTE_ADB_CONNECT_COOLDOWN_SECONDS`：自动连接冷却秒数（默认 30，最小 5）。
- `DINGTALK_PLATFORM_TOOLS_DIR`：platform-tools 安装目录（容器部署建议挂载持久卷）。

### 3) 运行时配置文件

默认路径：`backend/runtime/console-config.json`  
包含窗口时间、设备 serial、远程目标、工作日接口、adb/scrcpy 路径等字段。

## 生产部署与运维建议

### 1) 持久化运行时目录

容器平台（如 Railway）建议挂载持久卷到 `/app/backend/runtime`，避免重建后丢失 `adb` 与运行态文件。

### 2) 启用远程 ADB 保活（推荐）

```bash
REMOTE_ADB_TARGET=192.168.1.8:5555 \
ADB_BIN=/opt/dingtalk-automatic-check-in/backend/runtime/platform-tools/adb \
bash scripts/remote_adb_keepalive.sh
```

systemd 一键安装：

```bash
bash scripts/install_remote_adb_keepalive_service.sh \
  --target 192.168.1.8:5555 \
  --workdir /opt/dingtalk-automatic-check-in \
  --user www-data
```

### 3) 部署脚本入口

- 一键部署到莱卡云：`bash scripts/deploy_laika_full.sh --help`
- 公网验收检查：`bash scripts/verify_public_deploy.sh <frontend_domain> <api_domain>`
- 代码拉取更新：`bash scripts/pull_repo.sh --repo-url <url> --branch main --target-dir <dir>`

### 4) 运维脚本速查

- `scripts/backup.sh`：打包备份 `backend/runtime`、`backend/logs` 与关键配置。
- `scripts/build_frontend_for_public.sh <api_domain>`：写入生产 API 地址并构建前端。
- `scripts/deploy_frontend_with_cache_refresh.sh <frontend_domain> <railway_domain>`：发布前端并刷新 CDN 缓存。

## 故障排查（高频）

| 现象 | 可能原因 | 建议处理 |
|---|---|---|
| `adb not found` | 未安装 platform-tools 或路径不可见 | 前端点“在线安装 ADB”，或执行 `python3 scripts/install_platform_tools.py`，或配置 `adb_bin` |
| 设备 `unauthorized` | 手机未确认调试授权 | 手机端重新确认 USB/无线调试授权 |
| `deviceCount: 0` | 云端无法触达手机 | 检查是否走通远程 ADB/TCP，确认 `remote_adb_target` 与网络可达 |
| 刷新页面频繁断连 | 公网链路不稳定 | 开启自动重连 + 保活脚本 + 调整冷却时间 |
| 前端请求失败 | API 地址或后端进程异常 | 核对 `VITE_API_BASE_URL`、`HOST/PORT`、`/api/health` 返回 |

## 测试与验收

```bash
# API 端到端冒烟测试（临时文件隔离）
python3 backend/test_api_integrity.py
```

生产发布后可再执行公网验收脚本：`scripts/verify_public_deploy.sh`。

## 文档索引

- API 细节：[docs/api.md](./docs/api.md)
- 部署说明：[docs/deploy.md](./docs/deploy.md)
- 设备准备：[docs/adb-device-setup.md](./docs/adb-device-setup.md)
- 公网远程 ADB 稳定接入：[docs/public-remote-adb-tunnel.md](./docs/public-remote-adb-tunnel.md)
- 项目结构说明：[docs/project-structure.md](./docs/project-structure.md)

## 合规声明

本项目仅用于个人设备自动化与学习研究。请在使用前确认符合组织制度、平台规则及当地法律法规。

## License

MIT，详见 [LICENSE](./LICENSE)。
