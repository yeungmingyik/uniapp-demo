"use strict";
const common_vendor = require("../common/vendor.js");
const API_BASE = "http://192.168.80.227:3000";
function getUserList() {
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `${API_BASE}/api/users`,
      method: "GET",
      timeout: 1e4,
      success: (res) => {
        if (res.statusCode === 200 && res.data.status === "success") {
          resolve(res.data.user_ids || []);
        } else {
          resolve([]);
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/api.js:19", "获取用户列表失败:", err);
        resolve([]);
      }
    });
  });
}
function getUserHealthData(userId, field, timeRange = "", tags = {}) {
  const requestBody = { user_id: userId };
  if (timeRange)
    requestBody.time_range = timeRange;
  requestBody.fields = field;
  if (Object.keys(tags).length > 0) {
    requestBody.tags = tags;
  }
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `${API_BASE}/api/health/user`,
      method: "POST",
      header: {
        "Content-Type": "application/json"
      },
      data: requestBody,
      timeout: 1e4,
      success: (res) => {
        if (res.statusCode === 200 && res.data.status === "success") {
          resolve(res.data.user_data || []);
        } else {
          resolve([]);
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/api.js:52", `获取${field}数据失败:`, err);
        resolve([]);
      }
    });
  });
}
function getDeviceOptions() {
  return new Promise((resolve) => {
    common_vendor.index.request({
      url: `${API_BASE}/api/devices`,
      method: "GET",
      timeout: 1e4,
      success: (res) => {
        if (res.statusCode === 200 && res.data.status === "success") {
          resolve({
            deviceIds: res.data.device_ids || [],
            deviceNames: res.data.device_names || []
          });
        } else {
          resolve({
            deviceIds: [],
            deviceNames: []
          });
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/api.js:80", "获取设备列表失败:", err);
        resolve({
          deviceIds: [],
          deviceNames: []
        });
      }
    });
  });
}
async function getUserHealthDataMultiple(userId, fields = ["heart_rate", "temperature", "blood_oxygen"], timeRange = "", tags = {}) {
  const results = {};
  const promises = fields.map(
    (field) => getUserHealthData(userId, field, timeRange, tags).then((data) => ({ field, data })).catch((error) => {
      common_vendor.index.__f__("error", "at utils/api.js:97", `获取${field}数据失败:`, error);
      return { field, data: [] };
    })
  );
  const responses = await Promise.all(promises);
  responses.forEach(({ field, data }) => {
    if (Array.isArray(data) && data.length > 0) {
      const sortedData = [...data].sort((a, b) => {
        const timeA = a.time || a.timestamp || a.datetime || "";
        const timeB = b.time || b.timestamp || b.datetime || "";
        return new Date(timeB) - new Date(timeA);
      });
      results[field] = {
        value: sortedData[0].value,
        time: sortedData[0].time || sortedData[0].timestamp || sortedData[0].datetime,
        allData: data
      };
    } else {
      results[field] = null;
    }
  });
  return results;
}
async function getUserHealthDataHistory(userId, field, timeRange = "-30d", tags = {}) {
  try {
    const data = await getUserHealthData(userId, field, timeRange, tags);
    if (Array.isArray(data)) {
      const sortedData = data.sort((a, b) => {
        const timeA = a.time || a.timestamp || a.datetime || "";
        const timeB = b.time || b.timestamp || b.datetime || "";
        return new Date(timeB) - new Date(timeA);
      });
      return sortedData.slice(0, 20).reverse();
    }
    return [];
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/api.js:141", `获取${field}历史数据失败:`, error);
    return [];
  }
}
exports.getDeviceOptions = getDeviceOptions;
exports.getUserHealthDataHistory = getUserHealthDataHistory;
exports.getUserHealthDataMultiple = getUserHealthDataMultiple;
exports.getUserList = getUserList;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/api.js.map
