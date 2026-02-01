"use strict";
const common_vendor = require("../common/vendor.js");
const API_BASE = "https://boshangtech.xyz";
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
function getUserHealthData(userId, field, timeRange = "", tags = {}, aiReport = false) {
  const requestBody = { user_id: userId };
  if (timeRange)
    requestBody.time_range = timeRange;
  requestBody.fields = field;
  if (aiReport) {
    requestBody.ai_report = true;
  }
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
      timeout: 2e4,
      // AI 报告可能需要更长时间
      success: (res) => {
        var _a;
        if (res.statusCode === 200 && res.data.status === "success") {
          if (aiReport) {
            resolve({
              data: res.data.user_data || [],
              aiReport: ((_a = res.data.user_data) == null ? void 0 : _a.ai_report) || res.data.ai_report || ""
            });
          } else {
            resolve(res.data.user_data || []);
          }
        } else {
          resolve(aiReport ? { data: [], aiReport: "" } : []);
        }
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/api.js:64", `获取${field}数据失败:`, err);
        resolve(aiReport ? { data: [], aiReport: "" } : []);
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
        common_vendor.index.__f__("error", "at utils/api.js:92", "获取设备列表失败:", err);
        resolve({
          deviceIds: [],
          deviceNames: []
        });
      }
    });
  });
}
async function getUserHealthDataMultiple(userId, fields = ["heart_rate", "temperature", "blood_oxygen"], timeRange = "", tags = {}, aiReport = false) {
  const results = {
    aiReport: ""
  };
  const promises = fields.map(
    (field, index) => getUserHealthData(userId, field, timeRange, tags, aiReport && index === 0).then((res) => {
      if (aiReport && index === 0) {
        results.aiReport = res.aiReport;
        return { field, data: res.data };
      }
      return { field, data: res };
    }).catch((error) => {
      common_vendor.index.__f__("error", "at utils/api.js:119", `获取${field}数据失败:`, error);
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
async function getUserHealthDataHistory(userId, field, timeRange = "-30d", tags = {}, limit = null) {
  try {
    const data = await getUserHealthData(userId, field, timeRange, tags);
    if (Array.isArray(data)) {
      const sortedData = [...data].sort((a, b) => {
        const timeA = a.time || a.timestamp || a.datetime || "";
        const timeB = b.time || b.timestamp || b.datetime || "";
        return new Date(timeA) - new Date(timeB);
      });
      if (typeof limit === "number" && limit > 0) {
        return sortedData.slice(-limit);
      }
      return sortedData;
    }
    return [];
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/api.js:166", `获取${field}历史数据失败:`, error);
    return [];
  }
}
exports.getDeviceOptions = getDeviceOptions;
exports.getUserHealthDataHistory = getUserHealthDataHistory;
exports.getUserHealthDataMultiple = getUserHealthDataMultiple;
exports.getUserList = getUserList;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/api.js.map
