Page({
  data: {
    navBarHeight: 0,
    userName: '用户',
    posts: [],
    followCount: 0,
    followerCount: 0
  },

  onLoad: function (options) {
    var app = getApp();
    this.setData({ navBarHeight: app.globalData.navBarHeight || 64 });
    if (options && options.name) {
      this.setData({ userName: decodeURIComponent(options.name) });
    }
    // 模拟数据
    this.setData({
      posts: [],
      followCount: 0,
      followerCount: 0
    });
  }
});
