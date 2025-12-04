# 🚨 Cloudflare Pages 部署失败修复指南

## 问题分析

从你的构建日志来看，问题出在这里：

```
2025-12-04T11:03:54.516Z	Executing user deploy command: npx wrangler deploy
2025-12-04T11:04:03.789Z	✘ [ERROR] Missing entry-point to Worker script or to assets directory
```

**问题原因**：
- Cloudflare Pages 在构建后执行了 `npx wrangler deploy`
- 这是 **Workers** 的部署命令，不是 **Pages** 的
- Next.js 项目应该部署到 Cloudflare Pages，而不是 Workers

## ✅ 解决方案

### 方案 1: 在 Cloudflare Dashboard 中修复（推荐 ⭐）

这是最简单的方法，不需要修改代码：

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com
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

4. **⚠️ 关键步骤：删除自定义部署命令**
   - 在 **Settings** > **Builds & deployments** 中
   - 找到 **Deploy command** 或 **Custom deployment command** 选项
   - **如果设置了 `npx wrangler deploy`，请删除它或留空**
   - Cloudflare Pages 会自动处理部署，**不需要手动执行部署命令**

5. **保存并重新部署**
   - 保存所有更改
   - 点击 **Retry deployment** 或推送一个新的提交来触发部署

### 方案 2: 使用 OpenNext 适配器（如果需要更好的兼容性）

如果你的项目需要更好的 Next.js 15 支持，可以使用 OpenNext 适配器：

```bash
npm install --save-dev opennext-cloudflare
```

然后更新 `next.config.ts`：

```typescript
import { withOpenNext } from "opennext-cloudflare/next.config";

const nextConfig = {
  // ... 你的现有配置
};

export default withOpenNext(nextConfig);
```

构建输出目录会变成 `.opennext`，需要在 Cloudflare Dashboard 中更新：
- **Build output directory**: `.opennext`

### 方案 3: 使用 CLI 手动部署（临时方案）

如果你想立即部署，可以使用正确的命令：

```bash
# 构建项目
npm run build

# 部署到 Cloudflare Pages（注意是 pages deploy，不是 deploy）
npx wrangler pages deploy .next --project-name=ainova-life
```

## 📋 当前配置检查清单

- ✅ `wrangler.toml` - 已配置为 Pages 项目
- ✅ `package.json` - 包含正确的构建和部署脚本
- ✅ Next.js 构建 - 成功完成
- ❌ **Cloudflare Dashboard 部署命令配置** - 需要修复

## 🎯 立即行动

**最重要的一步**：在 Cloudflare Dashboard 中删除或清空自定义部署命令，让 Cloudflare Pages 自动处理部署。

## 💡 为什么会出现这个问题？

Cloudflare Pages 检测到项目根目录有 `wrangler.toml` 文件时，可能会误认为这是一个 Workers 项目，从而使用错误的部署命令。但实际上：

- **有 `wrangler.toml` + Next.js 项目** = 应该使用 Pages 部署（自动处理）
- **有 `wrangler.toml` + Worker 脚本** = 使用 Workers 部署（需要 `wrangler deploy`）

我们的项目是 Next.js，所以应该让 Cloudflare Pages 自动处理部署，不需要自定义部署命令。

## 🔗 相关文档

- [Cloudflare Pages Next.js 文档](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Cloudflare Pages 构建设置](https://developers.cloudflare.com/pages/platform/build-configuration/)
- [OpenNext Cloudflare 适配器](https://opennext.js.org/cloudflare)

