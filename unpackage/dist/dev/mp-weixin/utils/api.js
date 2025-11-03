"use strict";
const common_vendor = require("../common/vendor.js");
const BASE_URL = "http://localhost:3000";
async function fetchLatestMetrics() {
  const res = await common_vendor.index.request({
    url: `${BASE_URL}/metrics/latest`,
    method: "GET"
  });
  return res[1] ? res[1].data : res.data;
}
exports.fetchLatestMetrics = fetchLatestMetrics;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/api.js.map
