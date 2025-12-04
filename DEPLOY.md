# Cloudflare 部署指南

## 问题分析

你遇到的错误是：
```
✘ [ERROR] Missing entry-point to Worker script or to assets directory
```

这是因为 `npx wrangler deploy` 不知道要部署什么。对于 Next.js 项目，应该使用 **Cloudflare Pages** 而不是 Workers。

## 解决方案

### 方案 1: 使用 Cloudflare Pages（推荐）

Next.js 更适合部署到 Cloudflare Pages，因为它支持 SSR 和 API 路由。

#### 在 Cloudflare Dashboard 中配置：

1. 登录 Cloudflare Dashboard
2. 进入 **Pages** 部分
3. 连接你的 GitHub 仓库
4. 配置构建设置：
   - **构建命令**: `npm run build`
   - **构建输出目录**: `.next`
   - **根目录**: `/` (项目根目录)

#### 或者使用 Wrangler CLI：

```bash
# 构建项目
npm run build

# 部署到 Cloudflare Pages
npx wrangler pages deploy .next --project-name=ainova-life
```

### 方案 2: 使用适配器（如果需要 Workers）

如果你的项目必须使用 Workers，需要安装适配器：

```bash
npm install --save-dev @cloudflare/next-on-pages
```

然后在 `next.config.ts` 中配置：

```typescript
import { withCloudflarePagesAdapter } from '@cloudflare/next-on-pages/next-config';

const nextConfig = {
  // ... 你的配置
};

export default withCloudflarePagesAdapter(nextConfig);
```

然后构建和部署：

```bash
npm run build
npx wrangler pages deploy .vercel/output/static
```

## 已修复的问题

1. ✅ **修复了 `generateStaticParams` 的构建时 fetch 问题**
   - 现在直接读取文件而不是 fetch API
   - 避免了构建时的 `ECONNREFUSED` 错误

2. ✅ **创建了 `wrangler.toml` 配置文件**
   - 配置了基本的 Cloudflare 设置

3. ✅ **更新了构建脚本**
   - 添加了 `deploy` 和 `deploy:cf` 脚本

## 当前配置

- **wrangler.toml**: 已创建，配置了基本设置
- **package.json**: 已添加部署脚本
- **generateStaticParams**: 已修复，直接读取文件

## 下一步

1. 在 Cloudflare Dashboard 中配置 Pages 项目
2. 或者使用 `npm run deploy:cf` 命令部署
3. 如果遇到适配器问题，考虑安装 `@cloudflare/next-on-pages`

## 注意事项

- Next.js 15 的 API 路由需要服务器端支持
- 文件系统操作（如数据存储）在 Cloudflare Pages 中可能有限制
- 考虑使用 Cloudflare KV 或 D1 数据库替代文件系统存储

