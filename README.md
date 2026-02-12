# Tesla Notes

本项目支持两种数据模式：
- `local`：Tauri + 本地 SQLite（当前桌面稳定模式）
- `cloud`：Supabase（用于网页/手机同步）
- `auto`：自动选择（Tauri 本地，浏览器云端）

## 环境变量
复制模板后填写：

```bash
cp .env.example .env
```

关键变量：
- `VITE_DATA_MODE=auto|local|cloud`
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`

## 启动

### 桌面开发（保持原功能）
```bash
pnpm tauri dev
```

### 网页开发
```bash
pnpm dev
```

### 手机访问本机网页
```bash
pnpm dev --host
```
然后手机和电脑连同一网络，访问 `http://电脑IP:1420`。

## 公网部署（不依赖同一网络）

项目已包含部署配置：
- `vercel.json`（Vercel SPA 路由）
- `netlify.toml`（Netlify 构建和重写）

部署时环境变量建议：
- `VITE_DATA_MODE=cloud`
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`

## 构建
```bash
pnpm build
```
