const storage = require('../../utils/storage');

// 地支→12宫网格位置 (4×4)
var GRID = { "巳":[0,0], "午":[0,1], "未":[0,2], "申":[0,3], "辰":[1,0], "酉":[1,3], "卯":[2,0], "戌":[2,3], "寅":[3,0], "丑":[3,1], "子":[3,2], "亥":[3,3] };

var STAR_COLORS = {
  "紫微":"#c084fc","天机":"#7bc47f","太阳":"#f59e0b","武曲":"#94a3b8","天同":"#6a9ed9",
  "廉贞":"#d94e3c","天府":"#c49a3c","太阴":"#5a8ec9","贪狼":"#4a9e6e","巨门":"#78716c",
  "天相":"#a78bfa","天梁":"#22c55e","七杀":"#ef4444","破军":"#f97316"
};

Page({
  data: {
    navBarHeight: 0, chartData: null, grid: [], headerInfo: {}
  },

  onLoad: function () {
    var app = getApp();
    this.setData({ navBarHeight: app.globalData.navBarHeight || 64 });
    var cached = storage.getJSON('last-ziwei');
    if (cached) this.renderChart(cached);
  },

  renderChart: function (data) {
    var palaces = data.palaces || [];
    var grid = [];
    // Build 4x4 grid
    for (var r = 0; r < 4; r++) { grid[r] = [null, null, null, null]; }

    palaces.forEach(function (p) {
      var pos = GRID[p.earthlyBranch];
      if (pos) {
        grid[pos[0]][pos[1]] = {
          name: p.name,
          branch: p.earthlyBranch,
          stem: p.heavenlyStem,
          majorStars: (p.majorStars || []).slice(0, 3),
          minorStars: (p.minorStars || []).slice(0, 4),
          isBody: p.isBodyPalace,
          isOriginal: p.isOriginalPalace,
          isMing: p.name === '命宫'
        };
      }
    });

    this.setData({
      chartData: data,
      grid: grid,
      headerInfo: {
        gender: data.gender || '',
        solarDate: data.solarDate || '',
        lunarDate: data.lunarDate || '',
        time: data.time || '',
        sign: data.sign || '',
        zodiac: data.zodiac || '',
        soul: data.soul || '',
        body: data.body || '',
        fiveElements: data.fiveElementsClass || '',
        soulPalace: data.soulPalace || '',
        bodyPalace: data.bodyPalace || ''
      }
    });
  },

  getStarColor: function (name) { return STAR_COLORS[name] || '#94a3b8'; }
});
