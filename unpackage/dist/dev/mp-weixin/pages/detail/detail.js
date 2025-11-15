"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_api = require("../../utils/api.js");
const fieldConfig = {
  heart_rate: { name: "心率", unit: "bpm", color: "#FF6384" },
  temperature: { name: "体温", unit: "℃", color: "#36A2EB" },
  blood_oxygen: { name: "血氧饱和度", unit: "%", color: "#4BC0C0" }
};
const _sfc_main = {
  data() {
    return {
      userId: "",
      field: "",
      fieldName: "",
      unit: "",
      dataList: [],
      loading: true,
      canvasId: "chart_" + Date.now(),
      chartData: {},
      chartOpts: {
        color: ["#36A2EB"],
        padding: [15, 15, 0, 15],
        enableScroll: false,
        legend: {
          show: false
        },
        xAxis: {
          disableGrid: true,
          labelCount: 5
        },
        yAxis: {
          gridType: "dash",
          dashLength: 2
        }
      }
    };
  },
  computed: {
    averageValue() {
      if (this.dataList.length === 0)
        return 0;
      const sum = this.dataList.reduce((acc, item) => acc + parseFloat(item.value), 0);
      return sum / this.dataList.length;
    },
    maxValue() {
      if (this.dataList.length === 0)
        return 0;
      return Math.max(...this.dataList.map((item) => parseFloat(item.value)));
    },
    minValue() {
      if (this.dataList.length === 0)
        return 0;
      return Math.min(...this.dataList.map((item) => parseFloat(item.value)));
    }
  },
  onLoad(options) {
    this.userId = options.userId || "";
    this.field = options.field || "";
    if (fieldConfig[this.field]) {
      this.fieldName = fieldConfig[this.field].name;
      this.unit = fieldConfig[this.field].unit;
      this.chartOpts.color = [fieldConfig[this.field].color];
    }
    const deviceId = options.deviceId || "";
    const deviceName = options.deviceName || "";
    const tags = {};
    if (deviceId)
      tags.device_id = deviceId;
    if (deviceName)
      tags.device_name = deviceName;
    this.loadData(tags);
  },
  methods: {
    async loadData(tags = {}) {
      if (!this.userId || !this.field) {
        this.loading = false;
        return;
      }
      this.loading = true;
      try {
        const data = await utils_api.getUserHealthDataHistory(this.userId, this.field, "-30d", tags);
        if (Array.isArray(data) && data.length > 0) {
          this.dataList = data;
          this.updateChart();
        } else {
          this.dataList = [];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/detail/detail.vue:136", "加载数据失败:", error);
        common_vendor.index.showToast({
          title: "加载数据失败",
          icon: "none"
        });
        this.dataList = [];
      } finally {
        this.loading = false;
      }
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
    updateChart() {
      if (this.dataList.length === 0)
        return;
      const labels = this.dataList.map((item) => {
        const time = item.time || item.timestamp || item.datetime;
        if (time) {
          const date = new Date(time);
          return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
        }
        return "";
      });
      const values = this.dataList.map((item) => parseFloat(item.value));
      this.chartData = {
        categories: labels,
        series: [{
          name: this.fieldName,
          data: values
        }]
      };
    }
  }
};
if (!Array) {
  const _easycom_qiun_data_charts2 = common_vendor.resolveComponent("qiun-data-charts");
  _easycom_qiun_data_charts2();
}
const _easycom_qiun_data_charts = () => "../../uni_modules/qiun-data-charts/components/qiun-data-charts/qiun-data-charts.js";
if (!Math) {
  _easycom_qiun_data_charts();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.fieldName),
    b: common_vendor.t($data.userId),
    c: common_vendor.p({
      type: "line",
      chartData: $data.chartData,
      opts: $data.chartOpts,
      canvasId: $data.canvasId
    }),
    d: $data.dataList.length > 0
  }, $data.dataList.length > 0 ? {
    e: common_vendor.t($data.dataList.length),
    f: common_vendor.t($options.formatNumber($options.averageValue)),
    g: common_vendor.t($data.unit),
    h: common_vendor.t($options.formatNumber($options.maxValue)),
    i: common_vendor.t($data.unit),
    j: common_vendor.t($options.formatNumber($options.minValue)),
    k: common_vendor.t($data.unit)
  } : {}, {
    l: $data.loading
  }, $data.loading ? {} : {}, {
    m: !$data.loading && $data.dataList.length === 0
  }, !$data.loading && $data.dataList.length === 0 ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/detail/detail.js.map
