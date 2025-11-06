const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 阿里云服务器配置
const ALIYUN_SERVER = 'http://8.138.250.160:6688';
const REQUEST_TIMEOUT = 10000; // 10秒超时

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API路由：检查服务器状态
app.get('/api/status', async (req, res) => {
  try {
    const response = await axios.get(`${ALIYUN_SERVER}/alive`, {
      timeout: REQUEST_TIMEOUT,
      validateStatus: () => true // 接受所有状态码
    });

    // 检查响应状态和内容
    if (response.status === 200 && response.data && response.data.status === 'success') {
      res.json({
        status: 'success',
        message: '服务器运行正常',
        data: response.data
      });
    } else {
      res.json({
        status: 'error',
        message: '服务器响应异常',
        data: response.data || null
      });
    }
  } catch (error) {
    // 处理各种错误：网络错误、超时等
    let message = '服务器不可用';
    if (error.code === 'ECONNABORTED') {
      message = '请求超时';
    } else if (error.code === 'ECONNREFUSED') {
      message = '连接被拒绝';
    } else if (error.code === 'ENOTFOUND') {
      message = '无法解析服务器地址';
    }

    res.json({
      status: 'error',
      message: message,
      error: error.message
    });
  }
});

// API路由：获取用户ID列表
app.get('/api/users', async (req, res) => {
  try {
    const response = await axios.get(`${ALIYUN_SERVER}/api/health/user_ids`, {
      timeout: REQUEST_TIMEOUT,
      validateStatus: () => true
    });

    if (response.status === 200 && response.data && response.data.status === 'success') {
      res.json({
        status: 'success',
        message: response.data.message || '获取成功',
        task_id: response.data.task_id || null,
        user_ids: response.data.user_ids || [],
        count: response.data.user_ids ? response.data.user_ids.length : 0
      });
    } else {
      res.json({
        status: 'error',
        message: '获取用户ID列表失败',
        user_ids: [],
        count: 0
      });
    }
  } catch (error) {
    let message = '服务器不可用';
    if (error.code === 'ECONNABORTED') {
      message = '请求超时';
    } else if (error.code === 'ECONNREFUSED') {
      message = '连接被拒绝';
    } else if (error.code === 'ENOTFOUND') {
      message = '无法解析服务器地址';
    }

    res.json({
      status: 'error',
      message: message,
      user_ids: [],
      count: 0,
      error: error.message
    });
  }
});

// API路由：查询用户健康数据
app.post('/api/health/user', async (req, res) => {
  try {
    const { user_id, time_range, fields, tags } = req.body;

    // 验证必填参数
    if (!user_id) {
      return res.json({
        status: 'error',
        message: 'user_id 参数必填',
        user_data: []
      });
    }

    // 构建请求体
    const requestBody = { user_id };
    if (time_range) requestBody.time_range = time_range;
    if (fields) requestBody.fields = fields;
    if (tags) requestBody.tags = tags;

    const response = await axios.post(`${ALIYUN_SERVER}/api/health/user`, requestBody, {
      timeout: REQUEST_TIMEOUT,
      validateStatus: () => true
    });

    if (response.status === 200 && response.data) {
      if (response.data.status === 'success') {
        res.json({
          status: 'success',
          task_id: response.data.task_id || null,
          user_data: response.data.user_data || {},
          message: response.data.message || '查询成功'
        });
      } else {
        res.json({
          status: 'error',
          task_id: response.data.task_id || null,
          user_data: response.data.user_data || [],
          message: response.data.message || '查询失败'
        });
      }
    } else {
      res.json({
        status: 'error',
        message: '服务器响应异常',
        user_data: []
      });
    }
  } catch (error) {
    let message = '服务器不可用';
    if (error.code === 'ECONNABORTED') {
      message = '请求超时';
    } else if (error.code === 'ECONNREFUSED') {
      message = '连接被拒绝';
    } else if (error.code === 'ENOTFOUND') {
      message = '无法解析服务器地址';
    }

    res.json({
      status: 'error',
      message: message,
      user_data: [],
      error: error.message
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  const now = new Date();
  const ts = now.toISOString().replace('T', ' ').substring(0, 19);
  const env = process.env.NODE_ENV || 'development';
  console.log(`[${ts}] (${env}) Admin Backend started on http://localhost:${PORT}`);
  console.log(`[${ts}] (${env}) Routes: GET /api/status, GET /api/users, POST /api/health/user`);
});

