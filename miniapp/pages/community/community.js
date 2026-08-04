const api = require('../../utils/api');
const storage = require('../../utils/storage');

var tabs = ['推荐', '运势心得', '命理科普', '国学知识', '生活感悟'];
var categories = ['运势心得', '命理科普', '生活感悟', '国学知识'];

Page({
  data: {
    navBarHeight: 0,
    tabs: tabs,
    activeTab: 0,
    posts: [],
    loading: true,
    likedPosts: {},
    showEditor: false,
    publishing: false,
    newTitle: '',
    newContent: '',
    newCategory: '运势心得',
    newImages: [],
    previewImage: '',
    categories: categories
  },

  onLoad: function () {
    var app = getApp();
    this.setData({ navBarHeight: app.globalData.navBarHeight || 64 });
    this.loadPosts();
  },
  onShow: function () { this.loadPosts(); },

  loadPosts: function () {
    var that = this;
    that.setData({ loading: true });
    var category = that.data.activeTab === 0 ? undefined : tabs[that.data.activeTab];

    api.getPosts({ category: category, page: 1, pageSize: 30 }).then(function (res) {
      if (res.success) {
        var posts = (res.posts || []).map(function (p) {
          p.timeAgo = that.formatTime(p.createdAt);
          p.displayName = p.displayName || p.username || '匿名';
          return p;
        });
        that.setData({ posts: posts, loading: false });
      } else {
        that.setData({ loading: false });
      }
    }).catch(function () {
      that.setData({ loading: false });
    });
  },

  onSwitchTab: function (e) {
    this.setData({ activeTab: parseInt(e.currentTarget.dataset.idx) });
    this.loadPosts();
  },

  onLike: function (e) {
    var id = e.currentTarget.dataset.id;
    var likedPosts = this.data.likedPosts;
    var posts = this.data.posts;

    var isLiked = likedPosts[id];
    if (isLiked) {
      delete likedPosts[id];
    } else {
      likedPosts[id] = true;
    }

    posts = posts.map(function (p) {
      if (p.id === id) {
        p.likesCount = (p.likesCount || 0) + (isLiked ? -1 : 1);
      }
      return p;
    });

    this.setData({ likedPosts: likedPosts, posts: posts });

    api.toggleLike({ postId: id }).catch(function () {
      // 回滚
      wx.showToast({ title: '操作失败', icon: 'none' });
    });
  },

  onOpenEditor: function () { this.setData({ showEditor: true }); },
  onCloseEditor: function () { this.setData({ showEditor: false }); },

  onSetCategory: function (e) { this.setData({ newCategory: e.currentTarget.dataset.c }); },
  onNewTitleInput: function (e) { this.setData({ newTitle: e.detail.value }); },
  onNewContentInput: function (e) { this.setData({ newContent: e.detail.value }); },

  onChooseImage: function () {
    var that = this;
    var remaining = 4 - that.data.newImages.length;
    if (remaining <= 0) {
      wx.showToast({ title: '最多4张图片', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: function (res) {
        var images = that.data.newImages.slice();
        res.tempFiles.forEach(function (file) {
          if (file.size > 5 * 1024 * 1024) {
            wx.showToast({ title: '图片超过5MB限制', icon: 'none' });
            return;
          }
          images.push(file.tempFilePath);
        });
        that.setData({ newImages: images.slice(0, 4) });
      }
    });
  },

  onRemoveImage: function (e) {
    var idx = parseInt(e.currentTarget.dataset.idx);
    var images = this.data.newImages.filter(function (_, i) { return i !== idx; });
    this.setData({ newImages: images });
  },

  onPreviewImage: function (e) {
    var src = e.currentTarget.dataset.src;
    if (src) {
      wx.previewImage({ urls: [src], current: src });
    }
  },

  onPublish: function () {
    var that = this;
    if (!that.data.newTitle.trim()) { wx.showToast({ title: '请输入标题', icon: 'none' }); return; }
    if (!that.data.newContent.trim()) { wx.showToast({ title: '请输入内容', icon: 'none' }); return; }

    that.setData({ publishing: true });

    api.createPost({
      data: {
        category: that.data.newCategory,
        title: that.data.newTitle.trim(),
        content: that.data.newContent.trim(),
        images: that.data.newImages.length > 0 ? that.data.newImages : undefined
      }
    }).then(function (res) {
      if (res.success) {
        wx.showToast({ title: '发布成功！', icon: 'success' });
        that.setData({ showEditor: false, publishing: false, newTitle: '', newContent: '', newImages: [] });
        that.loadPosts();
      } else {
        wx.showToast({ title: res.error || '发布失败', icon: 'none' });
        that.setData({ publishing: false });
      }
    }).catch(function () {
      wx.showToast({ title: '网络错误', icon: 'none' });
      that.setData({ publishing: false });
    });
  },

  formatTime: function (ts) {
    if (!ts) return '';
    var diff = Date.now() - ts;
    if (diff < 3600000) return Math.max(1, Math.floor(diff / 60000)) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return Math.floor(diff / 86400000) + '天前';
  },

  noop: function () {}
});
