# 服务器监控管理后台

这是一个基于 Node.js + Express + AdminLTE 的管理后台，用于监控阿里云服务器状态和管理用户ID。

## 功能特性

- ✅ 实时检查服务器运行状态（调用 `/alive` 接口）
- ✅ 查看和管理用户ID列表（调用 `/api/health/user_ids` 接口）
- ✅ 美观的 AdminLTE 管理界面
- ✅ 自动刷新服务器状态

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 启动服务器

```bash
# 开发模式（需要先安装 nodemon: npm install -g nodemon）
npm run dev

# 或生产模式
npm start
```

### 3. 访问管理后台

在浏览器中打开：`http://localhost:3000`

## API 接口

### GET /api/status
检查阿里云服务器状态

**响应示例：**
```json
{
  "status": "success",
  "message": "服务器运行正常",
  "data": {
    "status": "success",
    "message": "服务存活"
  }
}
```

### GET /api/users
获取用户ID列表

**响应示例：**
```json
{
  "status": "success",
  "message": "",
  "task_id": "20251103-105711-b9074c81-2317-438f-9a5c-e6245acfccf0",
  "user_ids": ["user_id_0", "user_id_1", ...],
  "count": 10
}
```

## 配置说明

服务器配置在 `server.js` 文件中：

```javascript
const ALIYUN_SERVER = 'http://8.148.208.39:6688';
const REQUEST_TIMEOUT = 10000; // 10秒超时
```

## 部署到生产环境

### 使用 PM2 部署（推荐）

1. 安装 PM2：
```bash
npm install -g pm2
```

2. 启动应用：
```bash
pm2 start server.js --name admin-backend
```

3. 查看状态：
```bash
pm2 status
```

### 使用 Nginx 反向代理

在 Nginx 配置文件中添加：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 项目结构

```
server/
├── server.js          # Express 服务器主文件
├── package.json       # 项目配置和依赖
├── public/            # 静态文件目录
│   └── index.html    # 前端页面
├── .gitignore        # Git 忽略文件
└── README.md         # 说明文档
```

## 技术栈

- **后端**: Node.js + Express
- **前端**: AdminLTE 3.2 (基于 Bootstrap 4)
- **HTTP 客户端**: Axios

## 许可证

MIT

