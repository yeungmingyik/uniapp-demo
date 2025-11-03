"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      formattedDate: "",
      temperature: 36.5,
      heartRate: 72,
      spo2: 98
    };
  },
  onLoad() {
    this.formattedDate = this.formatDate(/* @__PURE__ */ new Date());
  },
  methods: {
    formatDate(date) {
      const weekMap = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const w = weekMap[date.getDay()];
      const m = date.getMonth() + 1;
      const d = date.getDate();
      return `${w}，${m}月${d}日`;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_assets._imports_0,
    b: common_vendor.t($data.formattedDate),
    c: common_assets._imports_1,
    d: common_vendor.t($data.temperature.toFixed(1)),
    e: common_assets._imports_2,
    f: common_vendor.t($data.heartRate),
    g: common_assets._imports_3,
    h: common_vendor.t($data.spo2)
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
