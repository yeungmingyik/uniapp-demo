"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      formattedDate: "",
      currentUser: "user_0",
      userList: [],
      userIndex: 0,
      // 设备筛选
      deviceIdList: [
        { label: "全部", value: "" },
        ...Array.from({ length: 10 }, (_, i) => ({ label: `device_${i}`, value: `device_${i}` }))
      ],
      deviceIdIndex: 0,
      selectedDeviceId: "",
      deviceNameList: [
        { label: "全部", value: "" },
        { label: "esp32", value: "esp32" },
        { label: "esp8266", value: "esp8266" }
      ],
      deviceNameIndex: 0,
      selectedDeviceName: "",
      // 健康数据值
      temperatureValue: 0,
      heartRateValue: 0,
      spo2Value: 0,
      // 健康数据时间
      temperatureTime: null,
      heartRateTime: null,
      spo2Time: null,
      // 时间文本
      temperatureTimeText: "加载中...",
      heartRateTimeText: "加载中...",
      spo2TimeText: "加载中...",
      // 定时器
      timeUpdateTimer: null
    };
  },
  onLoad() {
    this.formattedDate = this.formatDate(/* @__PURE__ */ new Date());
    this.loadUserList();
  },
  onShow() {
    this.updateTimeTexts();
    this.timeUpdateTimer = setInterval(() => {
      this.updateTimeTexts();
    }, 1e3);
  },
  onHide() {
    if (this.timeUpdateTimer) {
      clearInterval(this.timeUpdateTimer);
      this.timeUpdateTimer = null;
    }
  },
  onUnload() {
    if (this.timeUpdateTimer) {
      clearInterval(this.timeUpdateTimer);
      this.timeUpdateTimer = null;
    }
  },
  methods: {
    formatDate(date) {
      const weekMap = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const w = weekMap[date.getDay()];
      const m = date.getMonth() + 1;
      const d = date.getDate();
      return `${w}，${m}月${d}日`;
    },
    // 加载用户列表
    async loadUserList() {
      try {
        const users = await utils_api.getUserList();
        if (users && users.length > 0) {
          this.userList = users.map((userId) => ({
            label: userId,
            value: userId
          }));
          const defaultIndex = this.userList.findIndex((u) => u.value === "user_0" || u.value === "user_id_0");
          if (defaultIndex >= 0) {
            this.userIndex = defaultIndex;
          } else {
            this.userIndex = 0;
          }
          this.currentUser = this.userList[this.userIndex].value;
          this.loadHealthData();
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:179", "加载用户列表失败:", error);
        common_vendor.index.showToast({
          title: "加载用户列表失败",
          icon: "none"
        });
      }
    },
    // 用户选择改变
    onUserChange(e) {
      this.userIndex = e.detail.value;
      this.currentUser = this.userList[this.userIndex].value;
      this.loadHealthData();
    },
    // 设备ID选择改变
    onDeviceIdChange(e) {
      this.deviceIdIndex = e.detail.value;
      this.selectedDeviceId = this.deviceIdList[this.deviceIdIndex].value;
      this.loadHealthData();
    },
    // 设备名称选择改变
    onDeviceNameChange(e) {
      this.deviceNameIndex = e.detail.value;
      this.selectedDeviceName = this.deviceNameList[this.deviceNameIndex].value;
      this.loadHealthData();
    },
    // 加载健康数据
    async loadHealthData() {
      if (!this.currentUser)
        return;
      common_vendor.index.showLoading({
        title: "加载中..."
      });
      try {
        const tags = {};
        if (this.selectedDeviceId) {
          tags.device_id = this.selectedDeviceId;
        }
        if (this.selectedDeviceName) {
          tags.device_name = this.selectedDeviceName;
        }
        const results = await utils_api.getUserHealthDataMultiple(this.currentUser, ["heart_rate", "temperature", "blood_oxygen"], "", tags);
        if (results.temperature) {
          this.temperatureValue = results.temperature.value;
          this.temperatureTime = results.temperature.time;
          this.temperatureTimeText = this.getTimeAgo(results.temperature.time);
        } else {
          this.temperatureValue = 0;
          this.temperatureTime = null;
          this.temperatureTimeText = "暂无数据";
        }
        if (results.heart_rate) {
          this.heartRateValue = results.heart_rate.value;
          this.heartRateTime = results.heart_rate.time;
          this.heartRateTimeText = this.getTimeAgo(results.heart_rate.time);
        } else {
          this.heartRateValue = 0;
          this.heartRateTime = null;
          this.heartRateTimeText = "暂无数据";
        }
        if (results.blood_oxygen) {
          this.spo2Value = results.blood_oxygen.value;
          this.spo2Time = results.blood_oxygen.time;
          this.spo2TimeText = this.getTimeAgo(results.blood_oxygen.time);
        } else {
          this.spo2Value = 0;
          this.spo2Time = null;
          this.spo2TimeText = "暂无数据";
        }
        this.updateTimeTexts();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:262", "加载健康数据失败:", error);
        common_vendor.index.showToast({
          title: "加载数据失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    // 计算时间间隔
    getTimeAgo(timeStr) {
      if (!timeStr)
        return "暂无数据";
      try {
        const dataTime = new Date(timeStr);
        const now = /* @__PURE__ */ new Date();
        const diffMs = now - dataTime;
        const diffSeconds = Math.floor(diffMs / 1e3);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffSeconds < 60) {
          return "刚刚";
        } else if (diffMinutes < 60) {
          return `${diffMinutes}分钟前`;
        } else if (diffHours < 24) {
          return `${diffHours}小时前`;
        } else if (diffDays < 7) {
          return `${diffDays}天前`;
        } else {
          return dataTime.toLocaleDateString("zh-CN");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:296", "时间计算错误:", error);
        return "时间错误";
      }
    },
    // 更新所有时间文本
    updateTimeTexts() {
      if (this.temperatureTime) {
        this.temperatureTimeText = this.getTimeAgo(this.temperatureTime);
      }
      if (this.heartRateTime) {
        this.heartRateTimeText = this.getTimeAgo(this.heartRateTime);
      }
      if (this.spo2Time) {
        this.spo2TimeText = this.getTimeAgo(this.spo2Time);
      }
    },
    // 跳转到详情页
    goToDetail(field) {
      let url = `/pages/detail/detail?userId=${this.currentUser}&field=${field}`;
      if (this.selectedDeviceId) {
        url += `&deviceId=${this.selectedDeviceId}`;
      }
      if (this.selectedDeviceName) {
        url += `&deviceName=${this.selectedDeviceName}`;
      }
      common_vendor.index.navigateTo({
        url
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0,
    b: common_vendor.t($data.currentUser),
    c: $data.userList.length > 0
  }, $data.userList.length > 0 ? {
    d: common_vendor.t($data.userList[$data.userIndex] ? $data.userList[$data.userIndex].label : "选择用户"),
    e: common_vendor.o((...args) => $options.onUserChange && $options.onUserChange(...args)),
    f: $data.userIndex,
    g: $data.userList
  } : {}, {
    h: common_vendor.t($data.formattedDate),
    i: $data.deviceIdList.length > 0
  }, $data.deviceIdList.length > 0 ? {
    j: common_vendor.t($data.deviceIdList[$data.deviceIdIndex] ? $data.deviceIdList[$data.deviceIdIndex].label : "全部"),
    k: common_vendor.o((...args) => $options.onDeviceIdChange && $options.onDeviceIdChange(...args)),
    l: $data.deviceIdIndex,
    m: $data.deviceIdList
  } : {}, {
    n: $data.deviceNameList.length > 0
  }, $data.deviceNameList.length > 0 ? {
    o: common_vendor.t($data.deviceNameList[$data.deviceNameIndex] ? $data.deviceNameList[$data.deviceNameIndex].label : "全部"),
    p: common_vendor.o((...args) => $options.onDeviceNameChange && $options.onDeviceNameChange(...args)),
    q: $data.deviceNameIndex,
    r: $data.deviceNameList
  } : {}, {
    s: common_assets._imports_1,
    t: common_vendor.t($data.temperatureValue > 0 ? $data.temperatureValue.toFixed(1) : "--"),
    v: $data.temperatureValue > 0
  }, $data.temperatureValue > 0 ? {} : {}, {
    w: common_vendor.t($data.temperatureTimeText),
    x: common_vendor.o(($event) => $options.goToDetail("temperature")),
    y: common_assets._imports_2,
    z: common_vendor.t($data.heartRateValue > 0 ? $data.heartRateValue : "--"),
    A: $data.heartRateValue > 0
  }, $data.heartRateValue > 0 ? {} : {}, {
    B: common_vendor.t($data.heartRateTimeText),
    C: common_vendor.o(($event) => $options.goToDetail("heart_rate")),
    D: common_assets._imports_3,
    E: common_vendor.t($data.spo2Value > 0 ? $data.spo2Value : "--"),
    F: $data.spo2Value > 0
  }, $data.spo2Value > 0 ? {} : {}, {
    G: common_vendor.t($data.spo2TimeText),
    H: common_vendor.o(($event) => $options.goToDetail("blood_oxygen"))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
