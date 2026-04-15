---
name: release-desktop-installers
description: >-
  标准化执行 Electron 桌面安装包发布（macOS .dmg + Windows .exe），并验证 GitHub Release 资产是否可下载。
  Use when the user asks to build/release desktop installers, publish new tag releases, or troubleshoot missing release assets.
---
# Desktop 安装包发布 Skill

## 适用场景

- 需要发布 Electron 桌面端安装包到 GitHub Releases。
- 用户反馈“Release 里没有 `.dmg/.exe`”。
- Actions 已触发但构建失败，需快速定位与修复。

## 发布目标

- 触发标签发布后，自动产出并上传：
  - macOS: `.dmg`
  - Windows: `.exe`
- Release 页面可直接下载安装包。

## 固定前置条件（本仓库）

1. 工作流文件：`.github/workflows/release-desktop.yml`
2. 打包配置：`desktop/electron-builder.json`
3. 前端 Electron 构建命令：`npm run build:renderer --prefix desktop`

## 必须保证的配置

### A. Workflow 中 electron-builder 在 `desktop/` 执行

错误写法（会导致配置路径和工作目录错位）：
- `npm exec --prefix desktop electron-builder -- --config desktop/electron-builder.json ...`

正确写法：

```yaml
- name: Build macOS dmg
  working-directory: desktop
  run: npm exec electron-builder -- --config electron-builder.json --mac dmg --publish never

- name: Build Windows nsis
  working-directory: desktop
  run: npm exec electron-builder -- --config electron-builder.json --win nsis --publish never
```

### B. `desktop/electron-builder.json` 不要保留 `publish` 配置

在本仓库中，资产上传由 `softprops/action-gh-release` 完成。
若保留 `publish`，可能触发 `Cannot read properties of null (reading 'channel')` 并在 step 7 失败。

## 标准发布流程

### 1) 本地前置检查

```bash
git status --short
npm install --prefix frontend
npm install --prefix desktop
npm run build:renderer --prefix desktop
```

### 2) 本地复现关键打包命令（建议）

```bash
cd desktop
npm exec electron-builder -- --config electron-builder.json --mac dmg --publish never
```

说明：
- 这一步用于提前发现 `electron-builder` 配置错误。
- Windows 包可交由 GitHub Actions 在 `windows-latest` 构建。

### 3) 提交并推送

```bash
git add .
git commit -m "ci: 修复/更新桌面安装包发布流程"
git push origin main
```

### 4) 打标签触发发布

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

## 发布后验证（必须做）

### A. 确认 workflow run 成功

- 打开：`https://github.com/<owner>/<repo>/actions/workflows/release-desktop.yml`
- 目标 run 必须是 `completed successfully`。

### B. 确认 Release 资产存在

- 打开：`https://github.com/<owner>/<repo>/releases/tag/vX.Y.Z`
- 必须看到：
  - `*.dmg`
  - `*.exe`

也可用 expanded assets 快速验证：

```bash
curl -sS https://github.com/<owner>/<repo>/releases/expanded_assets/vX.Y.Z | \
  rg -n "\\.dmg|\\.exe"
```

## 常见失败与修复

### 1) 两个平台都在 step 7 秒失败

现象：
- `Build macOS dmg` 失败
- `Build Windows nsis` 失败

优先排查：
- `electron-builder` 执行目录是否是 `desktop/`
- `electron-builder.json` 是否错误引用 `publish`

### 2) 报错：`Cannot read properties of null (reading 'channel')`

原因：
- `publish` 相关元数据推断失败（仓库信息/发布通道）

修复：
- 删除 `desktop/electron-builder.json` 的 `publish` 配置
- 继续使用 workflow 里的 `softprops/action-gh-release` 上传资产

### 3) Run 成功但 Release 没资产

排查顺序：
1. `Publish Installers To Release` job 是否执行（不是 skipped）
2. `download-artifact` 是否拿到 `macos-installers` 与 `windows-installers`
3. `files` 路径是否匹配：
   - `release-assets/macos/*.dmg`
   - `release-assets/windows/*.exe`

## 输出回报模板（执行后）

- 发布标签：`vX.Y.Z`
- Workflow 运行结果：成功 / 失败
- macOS 安装包：文件名 + 下载链接
- Windows 安装包：文件名 + 下载链接
- 若失败：失败步骤 + 根因 + 已实施修复

## 执行约束

1. 不跳过“本地复现打包命令”这一步（可大幅降低 CI 失败率）。
2. 每次修 workflow 后，使用新 tag 重新触发，不复用旧失败 run。
3. 只有在 Release 页面看见 `.dmg` + `.exe` 才算发布完成。
