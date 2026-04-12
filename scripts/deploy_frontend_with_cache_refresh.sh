#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
用法:
  bash scripts/deploy_frontend_with_cache_refresh.sh <frontend_domain> <railway_domain> [--skip-deploy]

示例:
  bash scripts/deploy_frontend_with_cache_refresh.sh www.dingtalk.pengshz.cn dingtalk-web-production.up.railway.app
  bash scripts/deploy_frontend_with_cache_refresh.sh www.dingtalk.pengshz.cn dingtalk-web-production.up.railway.app --skip-deploy

说明:
  1) 默认会先发布前端到 Railway（frontend 目录为发布根）
  2) 然后刷新 frontend_domain 的 CDN 缓存（首页 + index.html + 最新 js/css）
  3) 最后比对 frontend_domain 与 railway_domain 的静态资源指纹是否一致
EOF
}

if [[ $# -lt 2 || $# -gt 3 ]]; then
  usage
  exit 1
fi

FRONTEND_DOMAIN="$1"
RAILWAY_DOMAIN="$2"
SKIP_DEPLOY="${3:-}"

if [[ -n "${SKIP_DEPLOY}" && "${SKIP_DEPLOY}" != "--skip-deploy" ]]; then
  echo "第三个参数仅支持 --skip-deploy"
  usage
  exit 1
fi

for cmd in railway qshell curl rg; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "缺少命令: ${cmd}"
    exit 1
  fi
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT_DIR}"
VERSION_SOURCE_FILE="${ROOT_DIR}/frontend/src/app-version.js"

extract_assets() {
  rg -o 'index-[A-Za-z0-9_-]+\.(js|css)' | sort -u
}

normalize_lines() {
  sed '/^$/d' | sort -u
}

write_app_version_file() {
  local version="$1"
  cat > "${VERSION_SOURCE_FILE}" <<EOF
export const APP_VERSION = "${version}";
EOF
}

read_current_app_version() {
  if [[ ! -f "${VERSION_SOURCE_FILE}" ]]; then
    echo ""
    return 0
  fi
  rg -o '"[0-9]+\.[0-9]+"' "${VERSION_SOURCE_FILE}" | head -n 1 | tr -d '"' || true
}

bump_minor_version() {
  local current_version="$1"
  if [[ ! "${current_version}" =~ ^[0-9]+\.[0-9]+$ ]]; then
    echo ""
    return 0
  fi

  local major minor
  major="${current_version%%.*}"
  minor="${current_version##*.}"
  echo "${major}.$((minor + 1))"
}

if [[ "${SKIP_DEPLOY}" != "--skip-deploy" ]]; then
  echo "[1/6] 自动递增前端版本号"
  CURRENT_APP_VERSION="$(read_current_app_version)"
  if [[ -z "${CURRENT_APP_VERSION}" ]]; then
    CURRENT_APP_VERSION="1.0"
    write_app_version_file "${CURRENT_APP_VERSION}"
  fi

  NEXT_APP_VERSION="$(bump_minor_version "${CURRENT_APP_VERSION}")"
  if [[ -z "${NEXT_APP_VERSION}" ]]; then
    echo "版本号格式异常（期望类似 1.0）：${CURRENT_APP_VERSION}"
    exit 1
  fi
  write_app_version_file "${NEXT_APP_VERSION}"
  echo "版本号: ${CURRENT_APP_VERSION} -> ${NEXT_APP_VERSION}"

  echo "[2/6] 发布前端到 Railway"
  DEPLOY_OUTPUT="$(railway up frontend --path-as-root --detach)"
  echo "${DEPLOY_OUTPUT}"

  TARGET_DEPLOY_ID="$(echo "${DEPLOY_OUTPUT}" | rg -o 'id=[a-f0-9-]+' | head -n 1 | cut -d'=' -f2 || true)"
  if [[ -z "${TARGET_DEPLOY_ID}" ]]; then
    echo "未能从 railway up 输出中解析 deployment id"
    exit 1
  fi

  echo "[3/6] 轮询部署状态: ${TARGET_DEPLOY_ID}"
  for _ in {1..45}; do
    STATUS_OUTPUT="$(railway service status)"
    echo "${STATUS_OUTPUT}"

    DEPLOY_ID="$(echo "${STATUS_OUTPUT}" | rg '^Deployment:' | awk '{print $2}')"
    STATUS="$(echo "${STATUS_OUTPUT}" | rg '^Status:' | awk '{print $2}')"

    if [[ "${DEPLOY_ID}" == "${TARGET_DEPLOY_ID}" ]]; then
      if [[ "${STATUS}" == "SUCCESS" ]]; then
        break
      fi
      if [[ "${STATUS}" == "FAILED" ]]; then
        echo "Railway 部署失败，输出最近构建日志："
        railway logs --build "${TARGET_DEPLOY_ID}" --lines 200 || true
        exit 1
      fi
    fi

    sleep 6
  done
fi

echo "[4/6] 获取 Railway 最新 index 资源指纹"
RAILWAY_INDEX_HTML="$(curl -fsS -m 30 "https://${RAILWAY_DOMAIN}")"
RAILWAY_ASSETS="$(echo "${RAILWAY_INDEX_HTML}" | extract_assets | normalize_lines)"
if [[ -z "${RAILWAY_ASSETS}" ]]; then
  echo "无法从 Railway 首页提取静态资源指纹，请检查域名: ${RAILWAY_DOMAIN}"
  exit 1
fi
echo "${RAILWAY_ASSETS}"

echo "[5/6] 刷新 ${FRONTEND_DOMAIN} CDN 缓存"
REFRESH_LIST_FILE="$(mktemp)"
{
  echo "https://${FRONTEND_DOMAIN}/"
  echo "https://${FRONTEND_DOMAIN}/index.html"
  while IFS= read -r asset; do
    [[ -z "${asset}" ]] && continue
    echo "https://${FRONTEND_DOMAIN}/assets/${asset}"
  done <<< "${RAILWAY_ASSETS}"
} > "${REFRESH_LIST_FILE}"

qshell cdnrefresh -i "${REFRESH_LIST_FILE}"

echo "[6/6] 验证前端域名与 Railway 指纹一致"
SYNC_OK=0
for _ in {1..20}; do
  FRONTEND_INDEX_HTML="$(curl -fsS -m 30 "https://${FRONTEND_DOMAIN}")"
  FRONTEND_ASSETS="$(echo "${FRONTEND_INDEX_HTML}" | extract_assets | normalize_lines)"

  if [[ "${FRONTEND_ASSETS}" == "${RAILWAY_ASSETS}" ]]; then
    SYNC_OK=1
    break
  fi
  sleep 3
done

if [[ "${SYNC_OK}" -ne 1 ]]; then
  echo "缓存刷新后仍不一致："
  echo "frontend_domain assets:"
  echo "${FRONTEND_ASSETS:-<empty>}"
  echo "railway_domain assets:"
  echo "${RAILWAY_ASSETS}"
  exit 1
fi

echo "发布与缓存刷新完成："
echo "- Frontend: https://${FRONTEND_DOMAIN}"
echo "- Railway:  https://${RAILWAY_DOMAIN}"
if [[ "${SKIP_DEPLOY}" != "--skip-deploy" ]]; then
  echo "- Version:  ${NEXT_APP_VERSION}"
fi
echo "- Assets:"
echo "${RAILWAY_ASSETS}"
