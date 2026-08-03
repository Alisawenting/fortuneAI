const storage = require('../../utils/storage');

Page({
  data: {
    navBarHeight: 0,
    loggedIn: false,
    displayName: '云客',
    username: '未登录',
    userAvatar: '云',
    isMember: false,
    myPostCount: 0,
    myBookmarkCount: 0,
    followCount: 0,
    followerCount: 0,
    friendCount: 0,
    menuGroups: [
      {
        title: '我的命理',
        items: [
          { icon: '📜', label: '我的命盘', to: '/pages/chart/chart', right: '戊辰日元' },
          { icon: '📅', label: '测算记录', to: '/pages/divine/divine', right: '' },
          { icon: '💬', label: 'AI 问答记录', to: '/pages/chat/chat', right: '' }
        ]
      },
      {
        title: '设置',
        items: [
          { icon: '⚙️', label: '通用设置', to: '/pages/profile/profile' },
          { icon: '🛡️', label: '隐私与数据管理', to: '/pages/profile/profile' },
          { icon: '❓', label: '帮助中心', to: '/pages/profile/profile' }
        ]
      }
    ]
  },

  onLoad: function () {
    var app = getApp();
    this.setData({ navBarHeight: app.globalData.navBarHeight || 64 });
  },
  onShow: function () {
    var token = storage.getItem('auth-token');
    var user = storage.getJSON('user');
    var loggedIn = !!(token && user);

    this.setData({
      loggedIn: loggedIn,
      displayName: loggedIn && user ? (user.displayName || user.username) : '云客',
      username: loggedIn && user ? ('@' + user.username) : '未登录',
      userAvatar: loggedIn && user && user.displayName ? user.displayName.slice(0, 1) : '云',
      isMember: loggedIn && user && user.isMember
    });

    // 统计数据
    var bm = storage.getJSON('bookmarkedPrompts') || [];
    this.setData({ myBookmarkCount: bm.length });

    var roles = storage.getJSON('roles') || [];
    this.setData({ myPostCount: 0 });
  },

  onLogin: function () {
    wx.showToast({ title: '登录功能开发中', icon: 'none' });
  },

  onLogout: function () {
    storage.removeItem('auth-token');
    storage.removeItem('user');
    this.setData({ loggedIn: false, displayName: '云客', username: '未登录', isMember: false });
    wx.showToast({ title: '已退出登录', icon: 'success' });
  }
});
