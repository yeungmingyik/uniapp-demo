# 减肥健康数据中心

一个基于 uni-app 小程序 + Node.js/Express 后端（AdminLTE 前端界面）的示例项目，用于：
- 监控后端服务存活状态
- 获取并展示用户列表（user_xx）
- 按设备筛选并展示用户健康数据（心率/体温/血氧）
- 小程序端展示最新数据与时间间隔，点击进入历史趋势图

## 目录
- [功能特性](#功能特性)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [配置与环境变量](#配置与环境变量)
- [运行与调试](#运行与调试)
- [部署建议](#部署建议)
- [常见问题](#常见问题)
- [贡献](#贡献)
- [许可证](#许可证)

## 功能特性
- 小程序首页：
  - 用户下拉选择（默认 user_0）
  - 设备筛选（支持云端设备 + 本地自定义设备）
  - 实时显示最新健康数据与“几分钟前/小时前”等时间间隔
  - 未绑定用户/设备时，卡片仍展示并提示“请绑定设备/请设置用户”
- 设备管理页：
  - 查看云端及自定义设备列表
  - 添加自定义设备（本地保存）
  - 切换设备 / 解绑设备（支持屏蔽远程设备）
- 后端管理台（AdminLTE）：
  - 服务存活状态检查（/alive）
  - 用户ID列表展示（/api/health/user_ids）
  - 健康数据查询（支持 user_id、time_range、fields、tags）

## 项目结构
```text
.
├─ pages/                 # 小程序页面（uni-app）
│  ├─ index/              # 健康/设备双tab主页
│  └─ detail/             # 历史数据趋势图
├─ utils/
│  └─ api.js             # 小程序端 API 包装
├─ server/                # 后端（Express + AdminLTE）
│  ├─ public/             # 管理台静态页
│  ├─ server.js           # API 代理、设备缓存等
├─ static/                # 图片资源（nav图标、空态图等）
├─ pages.json             # 小程序路由
├─ manifest.json          # 平台配置
└─ README.md              # 本文件（唯一说明文档）
```

## 快速开始

### 后端（Express + AdminLTE）
```bash
cd server
npm install
# 开发模式（自动重启）
npm run dev
# 生产模式
npm start
```
- 访问管理台：http://localhost:3000
- 主要接口：
  - `GET /api/status`：上游存活检测
  - `GET /api/users`：用户列表
  - `POST /api/health/user`：健康数据查询
  - `GET /api/devices`：设备列表（带缓存）

### 小程序（uni-app）
1. 使用 HBuilderX 打开项目根目录
2. 修改 `utils/api.js` 中 `API_BASE` 为可访问的后端地址
   ```js
   const API_BASE = 'http://<你的后端地址>:3000';
   ```
3. 运行到对应平台（推荐微信小程序 / Web 浏览器）

## 配置与环境变量

### server/server.js
```js
const ALIYUN_SERVER = 'http://8.138.250.160:6688'; // 上游云端接口
const REQUEST_TIMEOUT = 10000;                     // 10 秒超时
const DEVICE_CACHE_TTL = 5 * 60 * 1000;           // 设备列表缓存 5 分钟
```
如需对接其他上游服务，请调整 `ALIYUN_SERVER`。设备接口默认请求 `/api/health/devices`，请确保云端已提供该接口，响应中包含 `device_ids` 与 `device_names`。

### 小程序 API 地址（utils/api.js）
```js
// 开发环境
const API_BASE = 'http://192.168.x.x:3000';
// 生产环境示例
// const API_BASE = 'https://your-domain.com';
```
确保真机调试时使用可访问的 IP/域名。小程序默认允许 http 访问（manifest 中已设置 `urlCheck: false`），上线时建议切换到 https。

### 本地存储
- `customDevices`：用户自定义设备列表
- `blockedDevices`：用户解绑过的远程设备
- `selectedDevice`：上一次选中的设备（用于恢复状态）

## 运行与调试
- 后端：`npm run dev`（使用 nodemon 监听变更）
- 管理台：侧边栏可查看存活状态、用户ID、健康数据查询
- 小程序：
  - 健康页三张卡片分别调用 `/api/health/user`（按字段分别请求并合并）
  - 时间标签每秒刷新，若无设备/用户时显示提示文本
  - 设备页支持添加、切换、解绑（云端解绑将该设备记入 `blockedDevices`）
- 详情页（历史趋势）：
  - 调用 `/api/health/user` 获取历史数据，仅保留最近 20 条，以折线图展示

## 部署建议

### 后端
- 使用 PM2 守护进程
  ```bash
  npm install -g pm2
  pm2 start server.js --name health-backend
  pm2 save
  ```
- 配置 Nginx 反向代理
  ```nginx
  server {
      listen 80;
      server_name your-domain.com;

      location / {
          proxy_pass http://127.0.0.1:3000;
          proxy_http_version 1.1;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
      }
  }
  ```
- 若部署在不同服务器，请开放 3000 端口或修改 `PORT` 环境变量

### 小程序
- 发布前将 `API_BASE` 改为 https 域名
- 在小程序管理后台配置请求域名白名单
- 真机调试时确保移动设备与后端在同一网络

## 常见问题
- **只看到一项健康数据？**
  后端接口可能一次只返回单个字段，小程序端已改为按字段并行请求并合并，确保三张卡片都可显示。
- **设备列表未更新？**
  `/api/devices` 有 5 分钟缓存，可调整 `DEVICE_CACHE_TTL` 或手动重启后端。
- **解绑设备后仍出现在云端列表？**
  项目默认在本地记录解绑设备（`blockedDevices`），不会影响云端数据。如需真正解绑云端设备，请在 `unbindDevice` 中对接实际删除接口。
- **小程序时间提示固定为“请绑定设备”**
  当未选中设备或未设置用户时，卡片内的时间文本会提示“请绑定设备/请设置用户”；绑定后自动恢复实时更新时间差。

## 贡献
欢迎提交 PR 或 Issue 改进项目。建议遵循以下规范：
- Commit：`feat: ...` / `fix: ...` / `docs: ...` 等
- 分支：`feat/<feature-name>`、`fix/<issue-id>`

## 许可证
本项目示例代码以 MIT 许可发布。第三方组件（AdminLTE、uCharts/qiun-data-charts）遵循各自的开源协议。
