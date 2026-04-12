---
name: aliyun-qiniu-railway-public-deploy
description: >-
  标准化完成阿里云域名 + 七牛云静态托管 + Railway 后端 API 的公网部署流程。
  Use when deploying this project to public internet with Alibaba Cloud DNS,
  Qiniu static hosting, Railway backend, custom domains, HTTPS, and acceptance checks.
---
# 阿里云 + 七牛云 + Railway 公网部署 Skill

## 适用范围

用于当前仓库的标准公网部署：
- 前端：`frontend/` -> 七牛云静态托管（`www.<domain>`）
- 后端：`backend/` -> Railway（`api.<domain>`）
- DNS：阿里云云解析（将 `www` 和 `api` 指向各自 CNAME）

## 目标架构

- `https://www.<domain>` -> 七牛云空间/CDN（前端静态资源）
- `https://api.<domain>/api/health` -> Railway 服务（后端 API）

## 执行前检查

1. 确认输入参数：
- 主域名，例如 `example.com`
- 前端域名：`www.example.com`
- 后端域名：`api.example.com`
- 七牛空间名：`<bucket-name>`

2. 先填写部署模板，记录真实参数：
```bash
cp DEPLOY_PUBLIC_TEMPLATE.md DEPLOY_PUBLIC_REAL.md
```

3. 确认仓库脚本可执行：
```bash
ls -l scripts/build_frontend_for_public.sh scripts/verify_public_deploy.sh
```

## 步骤 1：部署 Railway 后端（backend）

优先使用 Railway 控制台，流程最稳定。

1. 新建 Railway 项目并连接当前仓库。
2. 服务配置：
- Root Directory：`backend`
- Start Command：`python3 api_server.py --host 0.0.0.0 --port ${PORT:-8000}`
- Healthcheck Path：`/api/health`
3. 首次部署后，先验证 Railway 临时域名健康检查是否正常：
- `https://<railway-domain>/api/health` 返回含 `"ok"` 的 JSON。
4. 在 Railway 绑定自定义域名：`api.<domain>`。
5. 记录 Railway 提供的 CNAME 目标值（填入部署模板）。

## 步骤 2：构建前端并写入生产 API 地址

推荐直接用仓库脚本自动写入 `.env.production` 并构建：

```bash
bash scripts/build_frontend_for_public.sh api.<domain>
```

脚本会执行：
- 写入 `frontend/.env.production`，内容为 `VITE_API_BASE_URL=https://api.<domain>`
- 执行 `npm --prefix frontend install`
- 执行 `npm --prefix frontend run build`
- 产物目录：`frontend/dist`

## 步骤 3：上传前端到七牛云并绑定前端域名

在七牛云控制台完成以下动作：

1. 创建空间（Bucket），权限设为公开读。
2. 上传 `frontend/dist` 目录全部文件。
3. 设置默认首页：`index.html`。
4. 绑定域名：`www.<domain>`。
5. 开启 HTTPS（上传证书或按七牛流程签发证书）。
6. 记录七牛提供的 CNAME 目标值（填入部署模板）。

注意：
- 若是 SPA 路由，按七牛规则配置回源/错误页策略，避免刷新子路由 404。
- 若 HTTPS 长时间不可用，可先排查证书状态，再提交工单跟进。

## 步骤 4：阿里云 DNS 配置

在阿里云云解析添加两条 CNAME：

1. `api` -> `<railway-cname-target>`
2. `www` -> `<qiniu-cname-target>`

建议：
- TTL 先用默认值，变更期可适当调低。
- 不要把 `api` 和 `www` 指向同一个目标。
- 修改后等待解析生效，再做验收。

## 步骤 5：公网联调验收

1. 后端健康检查：
```bash
curl -fsS https://api.<domain>/api/health
```

2. 前端首页：
```bash
curl -I https://www.<domain>
```

3. 使用仓库一键验收脚本：
```bash
bash scripts/verify_public_deploy.sh www.<domain> api.<domain>
```

验收通过标准：
- `https://api.<domain>/api/health` 返回正常且包含 `"ok"`
- `https://www.<domain>` 可访问且返回 HTML
- 前端实际调用的 API 为 `https://api.<domain>`

## 常见问题排查

1. 前端能打开但接口请求失败：
- 检查 `frontend/.env.production` 的 `VITE_API_BASE_URL`
- 重新构建并重新上传 `frontend/dist`
- 检查后端 CORS 响应头

2. `api.<domain>` 无法访问：
- Railway 服务是否部署成功
- Railway 自定义域名是否已绑定并签发证书
- 阿里云 `api` CNAME 是否指向正确目标

3. `www.<domain>` HTTPS 异常：
- 七牛证书状态是否可用
- 七牛域名配置是否完成审核/生效
- 阿里云 `www` CNAME 是否正确

4. DNS 已改但本地仍旧地址：
- 等待全球 DNS 缓存刷新
- 使用不同 DNS（如 `1.1.1.1`/`8.8.8.8`）复查解析结果

## 交付物清单（必须完成）

1. 已填写部署参数文档（`DEPLOY_PUBLIC_REAL.md`）
2. Railway 后端已绑定 `api.<domain>` 且健康检查通过
3. 七牛前端已绑定 `www.<domain>` 且 HTTPS 可用
4. 阿里云 DNS 两条 CNAME 已生效
5. `scripts/verify_public_deploy.sh` 验收通过

## 执行约束

- 不跳步骤：必须先通后端健康检查，再构建前端。
- 任何域名变更后都要重新做一次完整验收。
- 优先复用仓库脚本，不手写重复命令链。
