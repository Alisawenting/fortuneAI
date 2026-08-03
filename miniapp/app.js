App({
  globalData: {
    apiBase: 'https://yunshuyiguan.cn',
    userInfo: null,
    statusBarHeight: 0,
    navBarHeight: 0
  },

  onLaunch() {
    // 获取系统信息用于自定义导航栏适配
    var sysInfo = wx.getSystemInfoSync();
    this.globalData.statusBarHeight = sysInfo.statusBarHeight;
    // 导航栏高度 = 状态栏 + 标题栏(44px → 88rpx)
    this.globalData.navBarHeight = sysInfo.statusBarHeight + 44;

    const token = wx.getStorageSync('yunshu:auth-token');
    const user = wx.getStorageSync('yunshu:user');
    if (token && user) {
      try {
        this.globalData.userInfo = JSON.parse(user);
      } catch (e) {
        console.error('解析用户数据失败:', e);
      }
    }
    console.log('云枢易馆 小程序启动');
  }
});
