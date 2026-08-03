const storage = require('../../utils/storage');

Page({
  data: {
    navBarHeight: 0,
    bookmarks: []
  },

  onLoad: function () {
    var app = getApp();
    this.setData({ navBarHeight: app.globalData.navBarHeight || 64 });
  },

  onShow: function () {
    var bookmarks = storage.getJSON('bookmarkedPrompts') || [];
    // 兼容旧格式（字符串数组 → 对象数组）
    bookmarks = bookmarks.map(function (item) {
      if (typeof item === 'string') return { id: item, title: item };
      return item;
    });
    this.setData({ bookmarks: bookmarks });
  },

  onRemove: function (e) {
    var id = e.currentTarget.dataset.id;
    var bookmarks = this.data.bookmarks.filter(function (b) { return b.id !== id; });
    storage.setJSON('bookmarkedPrompts', bookmarks);
    this.setData({ bookmarks: bookmarks });
    wx.showToast({ title: '已取消收藏', icon: 'success' });
  }
});
