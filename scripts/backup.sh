#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backup"
STAMP="$(date +%F-%H%M%S)"
OUT="${BACKUP_DIR}/dingtalk-backup-${STAMP}.tar.gz"

mkdir -p "$BACKUP_DIR"

INCLUDES=(backend/runtime backend/logs README.md)
if [[ -f "${ROOT_DIR}/frontend/.env.production" ]]; then
  INCLUDES+=(frontend/.env.production)
fi

tar -czf "$OUT" -C "$ROOT_DIR" "${INCLUDES[@]}"

echo "Backup created: $OUT"
