# API 文档（当前 Python 后端）

- 健康检查: `GET /api/health`
- 控制台聚合: `GET /api/dashboard`
- 配置保存: `POST /api/config`
- 打卡记录: `GET /api/checkin-records`, `POST /api/checkin-records`, `POST /api/checkin-records/delete`
- 动作接口:
  - `POST /api/actions/reroll`
  - `POST /api/actions/doctor`
  - `POST /api/actions/adb-restart`
  - `POST /api/actions/run-once`
  - `POST /api/actions/start`
  - `POST /api/actions/stop`
