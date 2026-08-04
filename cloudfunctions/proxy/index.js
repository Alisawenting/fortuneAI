// 云函数代理 — 转发小程序请求到自有服务器
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 用 got 发 HTTP 请求（云函数内置支持 HTTP）
const got = require("got");

exports.main = async (event, context) => {
  const { url, method, data } = event;
  const SERVER = "http://120.26.213.89:3000";

  try {
    const options = {
      method: method || "POST",
      headers: { "Content-Type": "application/json" },
      timeout: { request: 60000 },
      retry: { limit: 0 },
    };

    if (method === "GET") {
      options.searchParams = data;
    } else {
      options.json = data || {};
    }

    const response = await got(SERVER + url, options);
    return JSON.parse(response.body);
  } catch (err) {
    console.error("代理请求失败:", url, err.message);
    return { success: false, error: err.message };
  }
};
