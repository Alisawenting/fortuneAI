const storage = require('../../utils/storage');

Page({
  data: {
    navBarHeight: 0,
    chartData: null,
    gongList: [],
    sihuaList: []
  },

  onLoad: function () {
    var app = getApp();
    this.setData({ navBarHeight: app.globalData.navBarHeight || 64 });
    var cached = storage.getJSON('last-ziwei');
    if (cached) {
      this.renderChart(cached);
    }
  },

  onShow: function () {
    if (!this.data.chartData) {
      var cached = storage.getJSON('last-ziwei');
      if (cached) this.renderChart(cached);
    }
  },

  renderChart: function (data) {
    // 构建十二宫显示数据
    var gongNames = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'];
    var gongList = gongNames.map(function (name) {
      return { name: name, star: '', zhi: '' };
    });

    // 如果有十二宫数据则填充
    if (data.gong) {
      data.gong.forEach(function (g, i) {
        if (i < 12) {
          gongList[i].star = g.star || '';
          gongList[i].zhi = g.zhi || '';
        }
      });
    }

    // 四化
    var typeMap = { '化禄': 'lu', '化权': 'quan', '化科': 'ke', '化忌': 'ji' };
    var sihuaList = [];
    if (data.sihua) {
      data.sihua.forEach(function (s) {
        sihuaList.push({ type: s.type, typeEn: typeMap[s.type] || '', star: s.star, pos: s.pos || '' });
      });
    }

    this.setData({
      chartData: data,
      gongList: gongList,
      sihuaList: sihuaList
    });
  }
});
