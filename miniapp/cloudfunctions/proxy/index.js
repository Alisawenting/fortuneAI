// 云函数 HTTP 代理 — 零依赖，纯 Node.js 内置模块
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const http = require("http");

exports.main = async (event) => {
  const { url, data } = event;
  const body = JSON.stringify(data || {});
  const SERVER = "120.26.213.89";

  return new Promise((resolve) => {
    const req = http.request({
      hostname: SERVER,
      port: 3000,
      path: url,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 30000,
    }, (res) => {
      let raw = "";
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); } catch { resolve({ success: false, error: "解析失败" }); }
      });
    });

    req.on("error", (err) => resolve({ success: false, error: err.message }));
    req.on("timeout", () => { req.destroy(); resolve({ success: false, error: "超时" }); });
    req.write(body);
    req.end();
  });
};
