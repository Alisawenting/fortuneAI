/**
 * API 请求封装 — 走微信云函数代理，免备案、免域名
 */
function request(options) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'proxy',
      data: {
        url: options.url,
        method: options.method || 'POST',
        data: options.data
      }
    }).then(function (res) {
      if (res.result) {
        resolve(res.result);
      } else {
        reject({ message: '云函数返回为空' });
      }
    }).catch(function (err) {
      console.error('云函数请求失败:', options.url, err);
      reject(err);
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
  return request({ url: '/api/chat/send', data: data });
}

// ===== 八字报告 API =====
function generateBaziReport(data) {
  return request({ url: '/api/bazi-report/generate', data: data });
}

function analyzeFortune(data) {
  return request({ url: '/api/fortune-analysis/analyze', data: data });
}

function analyzeDayunDetail(data) {
  return request({ url: '/api/fortune-analysis/dayun-detail', data: data });
}

// ===== 社区 API =====
function getPosts(data) {
  return request({ url: '/api/community/posts', data: data || {}, method: data ? 'POST' : 'GET' });
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
  return request({ url: '/api/membership/info', data: data || {} });
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
