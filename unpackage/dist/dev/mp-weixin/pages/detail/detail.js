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
      },
      timeRanges: [
        { label: "最近3天", value: "-3d" },
        { label: "最近7天", value: "-7d" },
        { label: "最近15天", value: "-15d" },
        { label: "最近30天", value: "-30d" }
      ],
      currentTimeRange: "-30d",
      isDateMode: false,
      selectedDate: "",
      tags: {}
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
    },
    dateButtonLabel() {
      if (this.isDateMode && this.selectedDate) {
        return this.selectedDate;
      }
      return "选择日期";
    },
    pickerValue() {
      if (this.selectedDate)
        return this.selectedDate;
      return this.formatDateString(/* @__PURE__ */ new Date());
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
    this.tags = { ...tags };
    this.loadData();
    common_vendor.index.setNavigationBarTitle({ title: "健康监测系统" });
  },
  methods: {
    async loadData() {
      if (!this.userId || !this.field) {
        this.loading = false;
        return;
      }
      this.loading = true;
      try {
        const rangeForQuery = this.getQueryRangeByMode();
        if (rangeForQuery === null) {
          this.dataList = [];
          this.chartData = {};
          this.loading = false;
          return;
        }
        const data = await utils_api.getUserHealthDataHistory(this.userId, this.field, rangeForQuery, this.tags);
        const normalized = this.normalizeData(data);
        const filtered = this.isDateMode && this.selectedDate ? this.filterBySelectedDate(normalized) : normalized;
        if (Array.isArray(filtered) && filtered.length > 0) {
          this.dataList = filtered;
          const hasChart = this.updateChart(filtered);
          if (!hasChart) {
            this.dataList = [];
          }
        } else {
          this.dataList = [];
          this.chartData = {};
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/detail/detail.vue:198", "加载数据失败:", error);
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
    selectTimeRange(range) {
      if (this.currentTimeRange === range && !this.isDateMode)
        return;
      this.currentTimeRange = range;
      this.isDateMode = false;
      this.selectedDate = "";
      this.loadData();
    },
    onDatePicked(event) {
      var _a;
      const value = (_a = event == null ? void 0 : event.detail) == null ? void 0 : _a.value;
      if (!value)
        return;
      if (this.selectedDate === value && this.isDateMode)
        return;
      this.selectedDate = value;
      this.isDateMode = true;
      this.loadData();
    },
    clearDateSelection() {
      if (!this.isDateMode)
        return;
      this.selectedDate = "";
      this.isDateMode = false;
      this.loadData();
    },
    getQueryRangeByMode() {
      if (!this.isDateMode || !this.selectedDate) {
        return this.currentTimeRange;
      }
      const today = this.getDayStart(/* @__PURE__ */ new Date());
      const selected = this.getDayStart(this.selectedDate);
      if (selected > today) {
        return null;
      }
      if (selected.getTime() === today.getTime()) {
        return "-1d";
      }
      const diff = Math.ceil((today - selected) / (24 * 60 * 60 * 1e3));
      return `-${diff}d`;
    },
    normalizeData(data = []) {
      if (!Array.isArray(data))
        return [];
      return data.filter((item) => item && item.value !== null && item.value !== void 0).map((item) => ({
        ...item,
        time: item.time || item.timestamp || item.datetime || ""
      })).sort((a, b) => new Date(a.time || 0) - new Date(b.time || 0));
    },
    filterBySelectedDate(data = []) {
      if (!this.selectedDate)
        return data;
      const start = this.getDayStart(this.selectedDate);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return data.filter((item) => {
        const itemTime = new Date(item.time || 0);
        return itemTime >= start && itemTime <= end;
      });
    },
    updateChart(data = []) {
      const numericPoints = data.map((item) => ({
        value: parseFloat(item.value),
        time: item.time || item.timestamp || item.datetime || ""
      })).filter((item) => !Number.isNaN(item.value));
      if (numericPoints.length === 0) {
        this.chartData = {};
        return false;
      }
      if (this.isDateMode && this.selectedDate) {
        const categories2 = numericPoints.map((_, index) => `${index + 1}`);
        const values2 = numericPoints.map((point) => point.value);
        this.chartData = {
          categories: categories2,
          series: [{
            name: this.fieldName,
            data: values2
          }]
        };
        return true;
      }
      const rangeDays = parseInt(this.currentTimeRange.replace(/[^0-9]/g, ""), 10) || 30;
      const today = this.getDayStart(/* @__PURE__ */ new Date());
      const msPerDay = 24 * 60 * 60 * 1e3;
      const buckets = Array.from({ length: rangeDays }, () => []);
      numericPoints.forEach((point) => {
        const itemDay = this.getDayStart(point.time);
        const diff = Math.floor((today - itemDay) / msPerDay);
        if (diff >= 0 && diff < rangeDays) {
          const dayNumber = rangeDays - diff;
          buckets[dayNumber - 1].push(point.value);
        }
      });
      const categories = [];
      const values = [];
      let hasData = false;
      for (let dayNumber = 1; dayNumber <= rangeDays; dayNumber++) {
        const bucket = buckets[dayNumber - 1];
        let avg = null;
        if (bucket.length > 0) {
          const sum = bucket.reduce((acc, val) => acc + val, 0);
          avg = sum / bucket.length;
          hasData = true;
        }
        categories.push(dayNumber.toString());
        values.push(avg);
      }
      if (!hasData) {
        this.chartData = {};
        return false;
      }
      this.chartData = {
        categories,
        series: [{
          name: this.fieldName,
          data: values
        }]
      };
      return true;
    },
    getDayStart(target) {
      const date = target instanceof Date ? new Date(target) : new Date(target);
      date.setHours(0, 0, 0, 0);
      return date;
    },
    formatDateString(date) {
      const target = date instanceof Date ? date : new Date(date);
      const year = target.getFullYear();
      const month = String(target.getMonth() + 1).padStart(2, "0");
      const day = String(target.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
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
    c: common_vendor.t($options.dateButtonLabel),
    d: $options.pickerValue,
    e: common_vendor.o((...args) => $options.onDatePicked && $options.onDatePicked(...args)),
    f: $data.isDateMode
  }, $data.isDateMode ? {
    g: common_vendor.o((...args) => $options.clearDateSelection && $options.clearDateSelection(...args))
  } : {}, {
    h: common_vendor.f($data.timeRanges, (range, k0, i0) => {
      return {
        a: common_vendor.t(range.label),
        b: range.value,
        c: common_vendor.n(!$data.isDateMode && $data.currentTimeRange === range.value ? "active" : ""),
        d: common_vendor.o(($event) => $options.selectTimeRange(range.value), range.value)
      };
    }),
    i: $data.dataList.length > 0
  }, $data.dataList.length > 0 ? {
    j: common_vendor.p({
      type: "line",
      chartData: $data.chartData,
      opts: $data.chartOpts,
      canvasId: $data.canvasId
    })
  } : {}, {
    k: $data.dataList.length > 0
  }, $data.dataList.length > 0 ? {
    l: common_vendor.t($data.dataList.length),
    m: common_vendor.t($options.formatNumber($options.averageValue)),
    n: common_vendor.t($data.unit),
    o: common_vendor.t($options.formatNumber($options.maxValue)),
    p: common_vendor.t($data.unit),
    q: common_vendor.t($options.formatNumber($options.minValue)),
    r: common_vendor.t($data.unit)
  } : {}, {
    s: $data.loading
  }, $data.loading ? {} : {}, {
    t: !$data.loading && $data.dataList.length === 0
  }, !$data.loading && $data.dataList.length === 0 ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/detail/detail.js.map
