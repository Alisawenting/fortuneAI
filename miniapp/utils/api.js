/**
 * 统一 API 请求封装
 */
function request(options) {
  return new Promise((resolve, reject) => {
    var app = getApp();
    var token = wx.getStorageSync('yunshu:auth-token');
    var baseUrl = (app && app.globalData && app.globalData.apiBase) || '';
    wx.request({
      url: baseUrl + options.url,
      method: options.method || 'POST',
      header: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      },
      data: options.data,
      timeout: options.timeout || 30000,
      success: function (res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject({ statusCode: res.statusCode, data: res.data });
        }
      },
      fail: function (err) {
        console.error('API 请求失败:', options.url, err);
        reject(err);
      }
    });
  });
}

// ===== 八字排盘 API =====
function calculateBazi(data) {
  return request({ url: '/api/yuanfenju/calculate', data: data });
}

function getDailyFortune(data) {
  return request({ url: '/api/yuanfenju/daily-fortune', data: data });
}

function cesuanBazi(data) {
  return request({ url: '/api/yuanfenju/cesuan', data: data });
}

// ===== AI 对话 API =====
function sendChatMessage(data) {
  return request({ url: '/api/chat/send', data: data, timeout: 60000 });
}

// ===== 八字报告 API =====
function generateBaziReport(data) {
  return request({ url: '/api/bazi-report/generate', data: data, timeout: 60000 });
}

function analyzeFortune(data) {
  return request({ url: '/api/fortune-analysis/analyze', data: data, timeout: 60000 });
}

function analyzeDayunDetail(data) {
  return request({ url: '/api/fortune-analysis/dayun-detail', data: data, timeout: 60000 });
}

// ===== 社区 API =====
function getPosts(data) {
  return request({ url: '/api/community/posts', data: data });
}

function createPost(data) {
  return request({ url: '/api/community/create-post', data: data });
}

function toggleLike(data) {
  return request({ url: '/api/community/toggle-like', data: data });
}

// ===== 认证 API =====
function login(data) {
  return request({ url: '/api/auth/login', data: data });
}

function register(data) {
  return request({ url: '/api/auth/register', data: data });
}

// ===== 会员 API =====
function getMembershipInfo(data) {
  return request({ url: '/api/membership/info', data: data });
}

// ===== 紫微 API =====
function calculateZiwei(data) {
  return request({ url: '/api/ziwei/calculate', data: data });
}

module.exports = {
  request: request,
  calculateBazi: calculateBazi,
  getDailyFortune: getDailyFortune,
  cesuanBazi: cesuanBazi,
  sendChatMessage: sendChatMessage,
  generateBaziReport: generateBaziReport,
  analyzeFortune: analyzeFortune,
  analyzeDayunDetail: analyzeDayunDetail,
  getPosts: getPosts,
  createPost: createPost,
  toggleLike: toggleLike,
  login: login,
  register: register,
  getMembershipInfo: getMembershipInfo,
  calculateZiwei: calculateZiwei
};
