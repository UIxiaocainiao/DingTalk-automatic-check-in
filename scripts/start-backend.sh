#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: 未检测到 python3，请先安装 Python 3。" >&2
  echo "macOS: brew install python" >&2
  echo "Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y python3" >&2
  exit 1
fi

python3 "$ROOT_DIR/backend/api_server.py" --host 127.0.0.1 --port 8000
