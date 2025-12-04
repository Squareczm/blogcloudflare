# Cloudflare R2 存储配置指南

## 问题解决

✅ **已完成的迁移**：
- 所有 API 路由已迁移到使用 R2 存储
- 文件上传已迁移到 R2
- 支持完整的 CRUD 操作（增删改查）

## 部署前必须完成的步骤

### 1. 创建 R2 Bucket

在 Cloudflare Dashboard 中：

1. 登录 Cloudflare Dashboard
2. 进入 **R2** 部分
3. 点击 **Create bucket**
4. 创建两个 bucket：
   - **主 bucket**: `blog-uploads` (生产环境)
   - **预览 bucket**: `blog-uploads-preview` (预览环境，可选)

### 2. 配置 R2 公共访问（用于文件访问）

如果需要通过 URL 直接访问上传的文件：

1. 进入 R2 bucket 设置
2. 配置 **Public Access** 或使用 **Custom Domain**
3. 或者使用 API 路由 `/uploads/[...path]` 来访问文件（已实现）

### 3. 更新 Cloudflare Pages 部署配置

在 Cloudflare Dashboard 的 Pages 设置中：

1. 进入你的 Pages 项目
2. 进入 **Settings** > **Functions**
3. 在 **R2 Bucket Bindings** 中添加：
   - **Variable name**: `BLOG_STORAGE`
   - **R2 bucket**: `blog-uploads`

### 4. 部署命令

**重要**：Cloudflare Pages 的部署命令应该使用 `pages deploy` 而不是 `deploy`：

```bash
# 方式 1: 使用 npm 脚本
npm run pages:deploy

# 方式 2: 直接使用 wrangler
npm run build
npx wrangler pages deploy .next --project-name=ainova-life
```

### 5. 在 Cloudflare Dashboard 中配置自动部署

如果使用 GitHub 集成：

1. 连接 GitHub 仓库
2. 构建设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: `/`
3. 在 **Functions** 设置中绑定 R2 bucket

## 环境变量和绑定

### wrangler.toml 配置

已配置 R2 bucket 绑定：
```toml
[[r2_buckets]]
binding = "BLOG_STORAGE"
bucket_name = "blog-uploads"
```

### 代码中的使用

代码会自动检测环境：
- **生产环境**：使用 R2 存储
- **本地开发**：自动回退到文件系统（`data/` 目录）

## 数据迁移

如果需要将现有数据迁移到 R2：

1. 导出本地 `data/` 目录下的 JSON 文件
2. 使用 Cloudflare Dashboard 或 API 上传到 R2 bucket
3. 文件键名应该与 `DATA_KEYS` 中定义的一致：
   - `about.json`
   - `posts.json`
   - `messages.json`
   - `settings.json`
   - 等等

## 支持的功能

✅ **完整的 CRUD 操作**：
- ✅ 文章管理：创建、读取、更新、删除
- ✅ 留言管理：创建、读取、删除
- ✅ 设置管理：读取、更新
- ✅ 关于页面：读取、更新、时间线和项目管理
- ✅ 文件上传：上传到 R2，通过 API 访问

## 故障排除

### 问题：部署时找不到 R2 bucket

**解决**：
1. 确保在 Cloudflare Dashboard 中创建了 `blog-uploads` bucket
2. 确保在 Pages 设置中绑定了 R2 bucket
3. 检查 `wrangler.toml` 中的 bucket 名称是否正确

### 问题：文件上传失败

**解决**：
1. 检查 R2 bucket 的权限设置
2. 确保 bucket 名称与配置一致
3. 检查文件大小限制（当前限制 5MB）

### 问题：数据读取失败

**解决**：
1. 检查 R2 bucket 中是否存在对应的 JSON 文件
2. 检查文件键名是否正确
3. 查看 Cloudflare 日志了解详细错误

## 下一步

1. ✅ 创建 R2 bucket
2. ✅ 配置 Pages Functions 绑定
3. ✅ 部署项目
4. ✅ 测试 CRUD 功能

部署成功后，你的博客将完全支持在 Cloudflare 上的增删改查操作！

