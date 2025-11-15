"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      formattedDate: "",
      activeTab: "health",
      userList: [],
      userIndex: 0,
      currentUser: "",
      remoteDevices: [],
      customDevices: [],
      blockedDeviceKeys: [],
      devices: [],
      selectedDevice: null,
      selectedDeviceIndex: -1,
      selectedDeviceId: "",
      selectedDeviceName: "",
      temperatureValue: null,
      heartRateValue: null,
      spo2Value: null,
      temperatureTime: null,
      heartRateTime: null,
      spo2Time: null,
      temperatureTimeText: "加载中...",
      heartRateTimeText: "加载中...",
      spo2TimeText: "加载中...",
      timeUpdateTimer: null,
      showAddDeviceModal: false,
      newDeviceId: "",
      newDeviceName: ""
    };
  },
  computed: {
    currentDeviceLabel() {
      if (!this.selectedDevice)
        return "未选择设备";
      const { name, id } = this.selectedDevice;
      if (name && id)
        return `${name}（${id}）`;
      return name || id || "未命名设备";
    },
    showHealthCards() {
      return !!(this.selectedDevice && this.currentUser);
    },
    healthPrimaryHint() {
      if (!this.selectedDevice)
        return "请绑定设备";
      if (!this.currentUser)
        return "请设置用户";
      return "暂无数据";
    },
    healthSecondaryHint() {
      if (!this.selectedDevice && !this.currentUser)
        return "请设置用户";
      return "";
    }
  },
  async onLoad() {
    this.formattedDate = this.formatDate(/* @__PURE__ */ new Date());
    this.loadCustomDevices();
    this.loadBlockedDevices();
    await Promise.all([
      this.loadUserList(false),
      this.loadDeviceOptions()
    ]);
    this.restoreSelectedDevice();
    this.loadHealthData();
    common_vendor.index.setNavigationBarTitle({ title: "辟谷养生" });
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
    switchTab(tab) {
      this.activeTab = tab;
      common_vendor.index.setNavigationBarTitle({ title: "辟谷养生" });
    },
    deviceKey(device) {
      return `${device.id || "noid"}__${device.name || "noname"}`;
    },
    deviceDisplayName(device) {
      if (device.name && device.id)
        return device.name;
      if (device.name)
        return device.name;
      if (device.id)
        return `设备 ${device.id}`;
      return "未命名设备";
    },
    formatDate(date) {
      const weekMap = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const w = weekMap[date.getDay()];
      const m = date.getMonth() + 1;
      const d = date.getDate();
      return `${w}，${m}月${d}日`;
    },
    async loadUserList(autoLoad = true) {
      try {
        const users = await utils_api.getUserList();
        if (users && users.length > 0) {
          this.userList = users.map((userId) => ({
            label: userId,
            value: userId
          }));
          this.userIndex = 0;
          this.currentUser = this.userList[this.userIndex].value;
          if (autoLoad) {
            this.loadHealthData();
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:260", "加载用户列表失败:", error);
        common_vendor.index.showToast({
          title: "加载用户列表失败",
          icon: "none"
        });
      }
    },
    loadCustomDevices() {
      const saved = common_vendor.index.getStorageSync("customDevices");
      if (Array.isArray(saved)) {
        this.customDevices = saved.map((dev) => ({
          id: (dev.id || "").trim(),
          name: (dev.name || "").trim()
        }));
      } else {
        this.customDevices = [];
      }
    },
    loadBlockedDevices() {
      const saved = common_vendor.index.getStorageSync("blockedDevices");
      this.blockedDeviceKeys = Array.isArray(saved) ? saved : [];
    },
    saveBlockedDevices() {
      common_vendor.index.setStorageSync("blockedDevices", this.blockedDeviceKeys);
    },
    saveCustomDevices() {
      common_vendor.index.setStorageSync("customDevices", this.customDevices);
    },
    async loadDeviceOptions() {
      try {
        const { deviceIds, deviceNames } = await utils_api.getDeviceOptions();
        const remote = [];
        if (Array.isArray(deviceIds) && Array.isArray(deviceNames) && deviceIds.length === deviceNames.length) {
          deviceIds.forEach((id, idx) => {
            remote.push({
              id: (id || "").trim(),
              name: (deviceNames[idx] || "").trim()
            });
          });
        } else {
          if (Array.isArray(deviceIds)) {
            deviceIds.forEach((id) => {
              remote.push({
                id: (id || "").trim(),
                name: ""
              });
            });
          }
          if (Array.isArray(deviceNames)) {
            deviceNames.forEach((name) => {
              remote.push({
                id: "",
                name: (name || "").trim()
              });
            });
          }
        }
        this.remoteDevices = remote;
        this.devices = this.mergeDeviceLists();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:320", "加载设备列表失败:", error);
        common_vendor.index.showToast({
          title: "加载设备列表失败",
          icon: "none"
        });
        this.remoteDevices = [];
        this.devices = this.mergeDeviceLists();
      }
    },
    mergeDeviceLists() {
      const map = /* @__PURE__ */ new Map();
      const add = (device) => {
        if (!device)
          return;
        const id = (device.id || "").trim();
        const name = (device.name || "").trim();
        const key = `${id}__${name}`;
        if (!this.blockedDeviceKeys.includes(key) && !map.has(key)) {
          map.set(key, { id, name });
        }
      };
      this.remoteDevices.forEach(add);
      this.customDevices.forEach(add);
      return Array.from(map.values());
    },
    restoreSelectedDevice() {
      const saved = common_vendor.index.getStorageSync("selectedDevice");
      if (saved && typeof saved === "object") {
        const index = this.devices.findIndex((dev) => dev.id === saved.id && dev.name === saved.name);
        if (index >= 0) {
          this.selectDevice(index, false);
          return;
        }
      }
      if (this.devices.length > 0) {
        this.selectDevice(0, false);
      } else {
        this.selectedDevice = null;
        this.selectedDeviceIndex = -1;
        this.selectedDeviceId = "";
        this.selectedDeviceName = "";
        this.setEmptyHealthData();
      }
    },
    onUserChange(e) {
      this.userIndex = e.detail.value;
      this.currentUser = this.userList[this.userIndex].value;
      this.loadHealthData();
    },
    selectDevice(index, refresh = true) {
      if (index < 0 || index >= this.devices.length)
        return;
      if (this.selectedDeviceIndex === index)
        return;
      this.selectedDeviceIndex = index;
      const device = this.devices[index];
      this.selectedDevice = device;
      this.selectedDeviceId = device.id || "";
      this.selectedDeviceName = device.name || "";
      common_vendor.index.setStorageSync("selectedDevice", device);
      if (refresh) {
        this.loadHealthData();
      } else {
        this.updateTimeTexts();
      }
    },
    openAddDevice() {
      this.newDeviceId = "";
      this.newDeviceName = "";
      this.showAddDeviceModal = true;
    },
    closeAddDevice() {
      this.showAddDeviceModal = false;
    },
    confirmAddDevice() {
      const id = this.newDeviceId.trim();
      const name = this.newDeviceName.trim();
      if (!id) {
        common_vendor.index.showToast({ title: "请输入设备ID", icon: "none" });
        return;
      }
      if (!name) {
        common_vendor.index.showToast({ title: "请输入设备名称", icon: "none" });
        return;
      }
      const exists = this.devices.some((dev) => dev.id === id && dev.name === name);
      if (exists) {
        common_vendor.index.showToast({ title: "设备已存在", icon: "none" });
        return;
      }
      const newDevice = { id, name };
      this.customDevices.push(newDevice);
      this.saveCustomDevices();
      this.devices = this.mergeDeviceLists();
      this.closeAddDevice();
      const index = this.devices.findIndex((dev) => dev.id === id && dev.name === name);
      if (index >= 0) {
        this.selectDevice(index);
      }
      common_vendor.index.showToast({ title: "添加成功", icon: "success" });
    },
    unbindDevice(index) {
      if (index < 0 || index >= this.devices.length)
        return;
      const device = this.devices[index];
      const key = this.deviceKey(device);
      const customIdx = this.customDevices.findIndex((dev) => this.deviceKey(dev) === key);
      if (customIdx !== -1) {
        this.customDevices.splice(customIdx, 1);
        this.saveCustomDevices();
      } else {
        if (!this.blockedDeviceKeys.includes(key)) {
          this.blockedDeviceKeys.push(key);
          this.saveBlockedDevices();
        }
      }
      this.devices = this.mergeDeviceLists();
      if (this.selectedDevice && this.deviceKey(this.selectedDevice) === key) {
        this.selectedDevice = null;
        this.selectedDeviceIndex = -1;
        this.selectedDeviceId = "";
        this.selectedDeviceName = "";
        if (this.devices.length > 0) {
          this.selectDevice(0);
        } else {
          this.setEmptyHealthData();
        }
      }
      common_vendor.index.showToast({ title: "设备已解绑", icon: "success" });
    },
    async loadHealthData() {
      if (!this.currentUser || !this.selectedDevice) {
        this.setEmptyHealthData();
        return;
      }
      common_vendor.index.showLoading({ title: "加载中..." });
      try {
        const tags = {};
        if (this.selectedDeviceId)
          tags.device_id = this.selectedDeviceId;
        if (this.selectedDeviceName)
          tags.device_name = this.selectedDeviceName;
        const results = await utils_api.getUserHealthDataMultiple(
          this.currentUser,
          ["heart_rate", "temperature", "blood_oxygen"],
          "-365d",
          tags
        );
        this.applyHealthResults(results);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:464", "加载健康数据失败:", error);
        common_vendor.index.showToast({ title: "加载数据失败", icon: "none" });
        this.setEmptyHealthData();
        this.temperatureTimeText = "数据加载失败";
        this.heartRateTimeText = "数据加载失败";
        this.spo2TimeText = "数据加载失败";
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    applyHealthResults(results) {
      const parseValue = (val) => {
        const num = parseFloat(val);
        return Number.isNaN(num) ? null : num;
      };
      if (results.temperature) {
        const value = parseValue(results.temperature.value);
        this.temperatureValue = value;
        this.temperatureTime = results.temperature.time || null;
        this.temperatureTimeText = value !== null && this.temperatureTime ? this.getTimeAgo(this.temperatureTime) : this.healthPrimaryHint;
      } else {
        this.temperatureValue = null;
        this.temperatureTime = null;
        this.temperatureTimeText = this.healthPrimaryHint;
      }
      if (results.heart_rate) {
        const value = parseValue(results.heart_rate.value);
        this.heartRateValue = value;
        this.heartRateTime = results.heart_rate.time || null;
        this.heartRateTimeText = value !== null && this.heartRateTime ? this.getTimeAgo(this.heartRateTime) : this.healthPrimaryHint;
      } else {
        this.heartRateValue = null;
        this.heartRateTime = null;
        this.heartRateTimeText = this.healthPrimaryHint;
      }
      if (results.blood_oxygen) {
        const value = parseValue(results.blood_oxygen.value);
        this.spo2Value = value;
        this.spo2Time = results.blood_oxygen.time || null;
        this.spo2TimeText = value !== null && this.spo2Time ? this.getTimeAgo(this.spo2Time) : this.healthPrimaryHint;
      } else {
        this.spo2Value = null;
        this.spo2Time = null;
        this.spo2TimeText = this.healthPrimaryHint;
      }
    },
    setEmptyHealthData() {
      this.temperatureValue = null;
      this.heartRateValue = null;
      this.spo2Value = null;
      this.temperatureTime = null;
      this.heartRateTime = null;
      this.spo2Time = null;
      const message = this.healthPrimaryHint;
      this.temperatureTimeText = message;
      this.heartRateTimeText = message;
      this.spo2TimeText = message;
    },
    formatNumber(num) {
      if (num === null || num === void 0) {
        return "--";
      }
      const numValue = parseFloat(num);
      if (Number.isNaN(numValue)) {
        return "--";
      }
      const fixed = numValue.toFixed(2);
      const parsed = parseFloat(fixed);
      if (parsed % 1 === 0) {
        return parsed.toString();
      }
      return parsed.toString();
    },
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
        if (diffSeconds < 60)
          return "刚刚";
        if (diffMinutes < 60)
          return `${diffMinutes}分钟前`;
        if (diffHours < 24)
          return `${diffHours}小时前`;
        if (diffDays < 365)
          return `${diffDays}天前`;
        return dataTime.toLocaleDateString("zh-CN");
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:562", "时间计算错误:", error);
        return "时间错误";
      }
    },
    updateTimeTexts() {
      if (!this.showHealthCards) {
        this.setEmptyHealthData();
        return;
      }
      if (this.temperatureTime) {
        this.temperatureTimeText = this.getTimeAgo(this.temperatureTime);
      } else {
        this.temperatureTimeText = this.healthPrimaryHint;
      }
      if (this.heartRateTime) {
        this.heartRateTimeText = this.getTimeAgo(this.heartRateTime);
      } else {
        this.heartRateTimeText = this.healthPrimaryHint;
      }
      if (this.spo2Time) {
        this.spo2TimeText = this.getTimeAgo(this.spo2Time);
      } else {
        this.spo2TimeText = this.healthPrimaryHint;
      }
    },
    goToDetail(field) {
      if (!this.showHealthCards) {
        common_vendor.index.showToast({ title: this.healthPrimaryHint, icon: "none" });
        return;
      }
      let url = `/pages/detail/detail?userId=${this.currentUser}&field=${field}`;
      if (this.selectedDeviceId) {
        url += `&deviceId=${this.selectedDeviceId}`;
      }
      if (this.selectedDeviceName) {
        url += `&deviceName=${this.selectedDeviceName}`;
      }
      common_vendor.index.navigateTo({ url });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.activeTab === "health"
  }, $data.activeTab === "health" ? common_vendor.e({
    b: common_assets._imports_0,
    c: common_vendor.t($data.currentUser || "未设置用户"),
    d: $data.userList.length > 0
  }, $data.userList.length > 0 ? {
    e: common_vendor.t($data.userList[$data.userIndex] ? $data.userList[$data.userIndex].label : "选择用户"),
    f: common_vendor.o((...args) => $options.onUserChange && $options.onUserChange(...args)),
    g: $data.userIndex,
    h: $data.userList
  } : {}, {
    i: common_vendor.t($options.currentDeviceLabel),
    j: common_vendor.t($data.formattedDate)
  }) : {}, {
    k: $data.activeTab === "health"
  }, $data.activeTab === "health" ? common_vendor.e({
    l: common_assets._imports_1,
    m: common_vendor.t($options.formatNumber($data.temperatureValue)),
    n: $data.temperatureValue !== null
  }, $data.temperatureValue !== null ? {} : {}, {
    o: common_vendor.t($data.temperatureTimeText),
    p: common_vendor.o(($event) => $options.goToDetail("temperature")),
    q: common_assets._imports_2,
    r: common_vendor.t($options.formatNumber($data.heartRateValue)),
    s: $data.heartRateValue !== null
  }, $data.heartRateValue !== null ? {} : {}, {
    t: common_vendor.t($data.heartRateTimeText),
    v: common_vendor.o(($event) => $options.goToDetail("heart_rate")),
    w: common_assets._imports_3,
    x: common_vendor.t($options.formatNumber($data.spo2Value)),
    y: $data.spo2Value !== null
  }, $data.spo2Value !== null ? {} : {}, {
    z: common_vendor.t($data.spo2TimeText),
    A: common_vendor.o(($event) => $options.goToDetail("blood_oxygen"))
  }) : common_vendor.e({
    B: $data.devices.length === 0
  }, $data.devices.length === 0 ? {
    C: common_assets._imports_4,
    D: common_vendor.o((...args) => $options.openAddDevice && $options.openAddDevice(...args))
  } : {
    E: common_vendor.f($data.devices, (device, index, i0) => {
      return {
        a: common_vendor.t($options.deviceDisplayName(device)),
        b: common_vendor.t(device.id ? `ID：${device.id}` : "未提供ID"),
        c: common_vendor.t($data.selectedDeviceIndex === index ? "当前设备" : "切换设备"),
        d: $data.selectedDeviceIndex === index ? 1 : "",
        e: common_vendor.o(($event) => $options.selectDevice(index), $options.deviceKey(device)),
        f: $data.selectedDeviceIndex === index,
        g: common_vendor.o(($event) => $options.unbindDevice(index), $options.deviceKey(device)),
        h: $data.selectedDeviceIndex === index ? 1 : "",
        i: $options.deviceKey(device),
        j: common_vendor.o(($event) => $options.selectDevice(index), $options.deviceKey(device))
      };
    }),
    F: common_vendor.o((...args) => $options.openAddDevice && $options.openAddDevice(...args))
  }), {
    G: $data.activeTab === "health" ? "/static/health-select.png" : "/static/health.png",
    H: $data.activeTab === "health" ? 1 : "",
    I: common_vendor.o(($event) => $options.switchTab("health")),
    J: $data.activeTab === "device" ? "/static/device-select.png" : "/static/device.png",
    K: $data.activeTab === "device" ? 1 : "",
    L: common_vendor.o(($event) => $options.switchTab("device")),
    M: $data.showAddDeviceModal
  }, $data.showAddDeviceModal ? {
    N: $data.newDeviceId,
    O: common_vendor.o(($event) => $data.newDeviceId = $event.detail.value),
    P: $data.newDeviceName,
    Q: common_vendor.o(($event) => $data.newDeviceName = $event.detail.value),
    R: common_vendor.o((...args) => $options.closeAddDevice && $options.closeAddDevice(...args)),
    S: common_vendor.o((...args) => $options.confirmAddDevice && $options.confirmAddDevice(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
