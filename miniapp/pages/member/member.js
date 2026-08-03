Page({
  data: {
    navBarHeight: 0,
    plans: [
      { id: 'free', name: '免费版', price: 0, period: '终身', features: ['基础运势查询', '每日打卡', '1 次 AI 问答/天'], recommended: false },
      { id: 'monthly', name: '月度会员', price: 29, period: '月', features: ['无限 AI 问答', '全场景深度解读', '专属命理报告', '优先客服支持'], recommended: true },
      { id: 'quarterly', name: '季度会员', price: 69, period: '季', features: ['月度全部权益', '每月 2 份深度报告', 'AI 手串推荐'], recommended: false },
      { id: 'yearly', name: '年度会员', price: 199, period: '年', features: ['季度全部权益', '年度运势总览', 'VIP 专属社群'], recommended: false }
    ]
  },

  onLoad: function () {
    var app = getApp();
    this.setData({ navBarHeight: app.globalData.navBarHeight || 64 });
  },

  onSubscribe: function (e) {
    var id = e.currentTarget.dataset.id;
    if (id === 'free') {
      wx.showToast({ title: '您当前已是免费用户', icon: 'none' });
      return;
    }
    wx.showToast({ title: '支付功能开发中', icon: 'none' });
  }
});
