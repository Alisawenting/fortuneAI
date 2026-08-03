Page({
  data: {
    navBarHeight: 0,
    element: '金水',
    items: [
      { id: '1', name: '和田青玉 · 静水手串', element: '水', desc: '润而不烈，助身旺者泄秀，宜思虑过重之人', match: 96, price: 488, tag: '本命首推', color: '#5a8ec9' },
      { id: '2', name: '天然砗磲 · 月华链', element: '金水', desc: '金水相生，清心安神，利文书与人际', match: 93, price: 326, tag: '贵人扶持', color: '#e8e8ec' },
      { id: '3', name: '925 银嵌海蓝宝', element: '金水', desc: '金气清纯，助决断；海蓝宝润喉舌，化口舌', match: 90, price: 568, tag: '化口舌', color: '#6a9ed9' },
      { id: '4', name: '白水晶 · 净心串', element: '金', desc: '平价入门款，纯净通透，平衡过旺土气', match: 85, price: 168, tag: '入门首选', color: '#f2f2f4' },
      { id: '5', name: '黑曜石 · 镇煞链', element: '水', desc: '夜间或出差佩戴，挡煞辟邪', match: 82, price: 258, tag: '夜行护身', color: '#3d3d42' }
    ],
    avoidList: [
      { name: '南红玛瑙', reason: '火气过旺，与日主不合，易加重燥意' },
      { name: '红玉髓', reason: '助火耗金，今年慎佩' }
    ]
  },

  onLoad: function (options) {
    var app = getApp();
    this.setData({ navBarHeight: app.globalData.navBarHeight || 64 });
    if (options.element) {
      this.setData({ element: options.element });
    }
  },

  onBuy: function () {
    wx.showToast({ title: '功能开发中，敬请期待！', icon: 'none' });
  }
});
