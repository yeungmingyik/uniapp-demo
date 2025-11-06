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
- [配置](#配置)
- [运行与调试](#运行与调试)
- [部署建议](#部署建议)
- [常见问题](#常见问题)
- [贡献](#贡献)
- [许可证](#许可证)

## 功能特性
- 小程序首页：
  - 用户下拉选择（默认 user_0）
  - 设备筛选（设备ID：device_0~device_9；设备名：esp32/esp8266）
  - 实时显示三项最新数据与“几分钟前/小时前”等时间间隔
  - 点击卡片进入历史趋势图（仅最近 20 条）
- 后端管理台（AdminLTE）：
  - 服务存活状态检查（/alive）
  - 用户ID列表展示（/api/health/user_ids）
  - 健康数据查询（支持 user_id、time_range、fields、tags）

## 项目结构
```text
.
├─ pages/                 # 小程序页面
│  ├─ index/              # 首页（用户选择、设备筛选、卡片）
│  └─ detail/             # 详情页（历史趋势图）
├─ utils/
│  └─ api.js             # 小程序端 API 工具（可配置 API_BASE）
├─ server/                # 后端（Express + AdminLTE）
│  ├─ public/             # AdminLTE 静态页
│  ├─ server.js           # API 代理与静态资源服务
│  └─ README.md
├─ 小程序配置说明.md         # 运行小程序的额外说明
├─ pages.json             # 小程序路由
├─ manifest.json          # 小程序与跨端配置
└─ README.md              # 本文件
```

## 快速开始

### 后端
```bash
cd server
npm install
# 开发
npm run dev
# 生产
npm start
```
启动后访问：`http://localhost:3000`
- 管理台界面：`/`（AdminLTE）
- API：`/api/status`、`/api/users`、`/api/health/user`

默认后端上游目标：`http://8.138.250.160:6688`（见 server.js 中 ALIYUN_SERVER）。

### 小程序（uni-app）
1. 使用 HBuilderX 打开项目根目录
2. 修改 `utils/api.js` 中 `API_BASE`
   ```js
   // 开发机后端：
   const API_BASE = 'http://<你的开发机IP>:3000'
   // 服务器后端：
   // const API_BASE = 'http://8.138.250.160:3000'
   ```
3. 运行到相应平台（建议：微信小程序/浏览器）

更多说明见《小程序配置说明.md》。

## 配置
- 后端上游目标与超时：`server/server.js`
- 小程序 API 地址：`utils/api.js` → `API_BASE`
- 设备筛选项：`pages/index/index.vue`（设备ID/名称的下拉数据源）

## 运行与调试
- 后端开发模式：`npm run dev`（nodemon 自动重启）
- 管理台：侧边栏“服务器状态 / 用户ID管理 / 健康数据查询”
- 小程序：
  - 首页选择用户与设备后，三张卡片分别调用 API，确保各项数据都能单独成功
  - 详情页仅展示最近 20 条历史数据，避免数据量过大导致渲染异常

## 部署建议
- 后端：
  - 使用 PM2 守护进程（见 `server/README.md`）
  - 推荐 Nginx 反向代理到 `http://localhost:3000`
- 小程序：
  - 使用 HTTPS 与域名白名单
  - 真机调试请确保 `API_BASE` 可被设备访问
