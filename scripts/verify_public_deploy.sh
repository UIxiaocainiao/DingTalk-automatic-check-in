#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "用法: $0 <frontend_domain> <api_domain>"
  echo "示例: $0 www.example.com api.example.com"
  exit 1
fi

FRONTEND_DOMAIN="$1"
API_DOMAIN="$2"
FRONTEND_URL="https://${FRONTEND_DOMAIN}"
API_HEALTH_URL="https://${API_DOMAIN}/api/health"

echo "[1/5] 检查后端健康接口: ${API_HEALTH_URL}"
HEALTH_BODY="$(curl -fsS "${API_HEALTH_URL}")"
if [[ "${HEALTH_BODY}" != *"\"ok\""* ]]; then
  echo "后端健康接口返回异常: ${HEALTH_BODY}"
  exit 1
fi
echo "后端健康检查通过"

echo "[2/5] 检查前端首页可访问: ${FRONTEND_URL}"
curl -fsSI "${FRONTEND_URL}" >/dev/null
echo "前端首页可访问"

echo "[3/5] 检查前端首页包含 HTML 结构"
INDEX_BODY="$(curl -fsS "${FRONTEND_URL}")"
if [[ "${INDEX_BODY}" != *"<html"* ]] || [[ "${INDEX_BODY}" != *"</html>"* ]]; then
  echo "前端首页内容异常，不像标准 HTML。"
  exit 1
fi
echo "前端 HTML 内容正常"

echo "[4/5] 检查前端首页引用的静态资源"
ASSET_PATHS="$(printf '%s' "${INDEX_BODY}" | rg -o '/assets/index-[A-Za-z0-9_-]+\.(js|css)' | sort -u || true)"
if [[ -z "${ASSET_PATHS}" ]]; then
  echo "未从前端首页提取到 index-*.js/css 静态资源。"
  exit 1
fi

while IFS= read -r asset_path; do
  [[ -z "${asset_path}" ]] && continue
  ASSET_URL="${FRONTEND_URL}${asset_path}"
  if ! curl --http1.1 --compressed -fsS -o /dev/null "${ASSET_URL}"; then
    echo "静态资源不可访问: ${ASSET_URL}"
    exit 1
  fi
  echo "静态资源可访问: ${ASSET_URL}"
done <<< "${ASSET_PATHS}"

echo "[5/5] 简单检查 API CORS 响应头"
CORS_HEADER="$(curl -fsSI "${API_HEALTH_URL}" | tr -d '\r' | rg -i '^Access-Control-Allow-Origin:' || true)"
if [[ -z "${CORS_HEADER}" ]]; then
  echo "未检测到 Access-Control-Allow-Origin 响应头（可继续用，但建议确认跨域策略）"
else
  echo "检测到 CORS 头: ${CORS_HEADER}"
fi

echo "公网验收通过: ${FRONTEND_URL} <-> ${API_HEALTH_URL}"
