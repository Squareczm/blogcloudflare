# Cloudflare Pages 部署修复指南

## 🔴 问题原因

从你的构建日志来看，Cloudflare Pages 在构建后执行了错误的命令：
```
npx wrangler deploy
```

这个命令是用于 **Cloudflare Workers** 的，不是 **Cloudflare Pages**。对于 Next.js 项目，应该使用 Pages 部署。

## ✅ 解决方案

### 方法 1: 在 Cloudflare Dashboard 中修复（推荐）

1. **登录 Cloudflare Dashboard**
   - 进入 https://dash.cloudflare.com
   - 选择你的账户

2. **进入 Pages 项目设置**
   - 点击左侧菜单的 **Pages**
   - 找到你的项目 `ainova-life`
   - 点击项目进入详情页

3. **检查构建设置**
   - 点击 **Settings** > **Builds & deployments**
   - 确认以下设置：
     - **Build command**: `npm run build`
     - **Build output directory**: `.next`
     - **Root directory**: `/` (留空或设置为 `/`)

4. **⚠️ 重要：检查部署命令**
   - 在 **Settings** > **Builds & deployments** 中
   - 找到 **Deploy command** 或类似选项
   - **如果设置了自定义部署命令，请删除它或留空**
   - Cloudflare Pages 会自动处理部署，不需要手动执行 `wrangler deploy`

5. **保存设置并重新部署**
   - 保存所有更改
   - 触发一次新的部署（可以推送一个空提交或点击 "Retry deployment"）

### 方法 2: 使用 CLI 手动部署（临时方案）

如果你想立即部署，可以使用正确的命令：

```bash
# 构建项目
npm run build

# 部署到 Cloudflare Pages（注意是 pages deploy，不是 deploy）
npx wrangler pages deploy .next --project-name=ainova-life
```

### 方法 3: 如果必须使用 Workers（不推荐）

如果你真的需要使用 Workers，需要：

1. 安装适配器（但已弃用，不推荐）：
   ```bash
   npm install --save-dev @cloudflare/next-on-pages
   ```

2. 或者使用 OpenNext 适配器（推荐）：
   ```bash
   npm install --save-dev opennext-cloudflare
   ```

3. 更新 `next.config.ts` 配置适配器

4. 更新 `wrangler.toml` 添加入口点

**但强烈建议使用 Pages，因为：**
- ✅ 原生支持 Next.js，无需适配器
- ✅ 支持 SSR 和 API 路由
- ✅ 配置更简单
- ✅ 性能更好

## 📝 当前配置状态

- ✅ `wrangler.toml` - 已更新，明确标注为 Pages 项目
- ✅ `package.json` - 已包含正确的部署脚本
- ✅ 构建命令 - `npm run build` 正常工作
- ❌ Cloudflare Dashboard 中的部署命令配置需要修复

## 🎯 下一步操作

1. **立即操作**：在 Cloudflare Dashboard 中删除或清空自定义部署命令
2. **验证**：触发一次新的部署，确认不再出现 `wrangler deploy` 错误
3. **如果还有问题**：检查 Cloudflare Pages 的构建日志，确认使用的是正确的部署流程

## 💡 为什么会出现这个问题？

Cloudflare Pages 检测到项目根目录有 `wrangler.toml` 文件时，可能会误认为这是一个 Workers 项目，从而使用错误的部署命令。但实际上：

- **有 `wrangler.toml` + Next.js 项目** = 应该使用 Pages 部署
- **有 `wrangler.toml` + Worker 脚本** = 使用 Workers 部署

我们的项目是 Next.js，所以应该使用 Pages。

## 🔗 相关文档

- [Cloudflare Pages Next.js 文档](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Cloudflare Pages 构建设置](https://developers.cloudflare.com/pages/platform/build-configuration/)

