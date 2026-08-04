App({
  globalData: {
    apiBase: '', // 不再需要——云函数走了微信内网
    userInfo: null,
    statusBarHeight: 0,
    navBarHeight: 0
  },

  onLaunch() {
    // 初始化云开发（做完云环境创建后取消注释）
    if (wx.cloud) {
      wx.cloud.init({ env: 'cloudbase-d4gf2f1q6082a06b6' });
    }

    var sysInfo = wx.getSystemInfoSync();
    this.globalData.statusBarHeight = sysInfo.statusBarHeight;
    this.globalData.navBarHeight = sysInfo.statusBarHeight + 44;

    const token = wx.getStorageSync('yunshu:auth-token');
    const user = wx.getStorageSync('yunshu:user');
    if (token && user) {
      try { this.globalData.userInfo = JSON.parse(user); } catch (e) {}
    }
    console.log('云枢易馆 小程序启动');
  }
});
