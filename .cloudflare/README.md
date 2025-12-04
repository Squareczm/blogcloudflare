# Cloudflare Pages 部署说明

## 部署方式

这个 Next.js 项目使用 Cloudflare Pages 进行部署（不是 Workers）。

## 配置说明

1. **wrangler.toml** - Cloudflare 配置文件
2. **构建输出** - Next.js 构建输出在 `.next` 目录

## 部署命令

### 方式 1: 使用 Cloudflare Dashboard
- 在 Cloudflare Dashboard 中连接 GitHub 仓库
- 构建命令: `npm run build`
- 构建输出目录: `.next`

### 方式 2: 使用 Wrangler CLI
```bash
npm run build
npx wrangler pages deploy .next --project-name=ainova-life
```

## 注意事项

- Next.js 15 需要适配器才能在 Cloudflare Pages 上运行
- 如果遇到问题，可能需要安装 `@cloudflare/next-on-pages` 或使用 OpenNext 适配器
- API 路由需要服务器端支持，不能使用静态导出

