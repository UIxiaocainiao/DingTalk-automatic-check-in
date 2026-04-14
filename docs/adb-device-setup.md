# ADB 设备准备

## 标准顺序（先电脑，再手机，再回电脑）

1. 电脑端先确认已安装 `python3`。
2. 手机端开启开发者模式和 USB 调试，并完成授权弹窗。
3. 回到电脑端安装 ADB 并做连通性自检。

## 1) 电脑端：先检查 Python3

```bash
python3 --version
```

如果提示 `command not found`：

- macOS：`brew install python`
- Ubuntu/Debian：`sudo apt-get update && sudo apt-get install -y python3`

## 2) 手机端：先做这几步

1. 打开「开发者选项」。
2. 打开「USB 调试」。
3. 连接电脑后，在手机弹窗里点「允许 USB 调试」（建议勾选“总是允许”）。

## 3) 电脑端：执行安装与自检

```bash
python3 scripts/install_platform_tools.py
python3 backend/dingtalk_random_scheduler.py doctor
```

如果 `doctor` 输出里设备状态为 `device`，说明连接成功。

## 4) 启动服务

```bash
python3 backend/api_server.py --host 127.0.0.1 --port 8000
cd frontend && npm install && npm run dev
```

## 常见问题

1. `python3` 不存在：先安装 Python3，再继续后续步骤。
2. `adb devices` 显示 `unauthorized`：看手机端是否点击了授权。
3. 连接后没有设备：换数据线/USB 口，确认不是仅充电线。
