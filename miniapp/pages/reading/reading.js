const api = require('../../utils/api');
const storage = require('../../utils/storage');
const { parseMarkdown } = require('../../utils/markdown');

Page({
  data: {
    navBarHeight: 0,
    loading: true,
    analysisNodes: [],
    dimensions: []
  },

  onLoad: function () {
    var app = getApp();
    this.setData({ navBarHeight: app.globalData.navBarHeight || 64 });
    this.loadAnalysis();
  },

  loadAnalysis: function () {
    var that = this;
    var paipanData = storage.getJSON('last-paipan');
    var role = null;
    var roles = storage.getJSON('roles') || [];
    var activeId = storage.getItem('active-role-id');
    if (activeId) role = roles.find(function (r) { return r.id === activeId; });
    if (!role) role = roles[0];

    if (!paipanData || !paipanData.detail_info) {
      that.setData({
        loading: false,
        analysisNodes: parseMarkdown('请先完成八字排盘后再查看 AI 解读。'),
        dimensions: []
      });
      return;
    }

    var di = paipanData.detail_info;
    var bsi = paipanData.base_info;
    var dyi = paipanData.dayun_info;
    var sizhu = di.sizhu.year.tg + di.sizhu.year.dz + ' ' + di.sizhu.month.tg + di.sizhu.month.dz + ' ' + di.sizhu.day.tg + di.sizhu.day.dz + ' ' + di.sizhu.hour.tg + di.sizhu.hour.dz;
    api.analyzeFortune({
      name: (role && role.name) || '用户',
      gender: (role && role.gender) || '男',
      birthDate: (role && role.birthDate) || '',
      sizhu: sizhu,
      rizhu: di.sizhu.day.tg + di.sizhu.day.dz + '日元',
      zhengge: (bsi && bsi.zhengge) || '',
      currentDayun: '',
      currentLiunian: '',
      qiyun: (bsi && bsi.qiyun) || '',
      xiyongshen: (bsi && bsi.wuxing_xiji) || '',
      jishen: '',
      wuxing: '',
      shensha: '',
      careerScore: 60, wealthScore: 60, loveScore: 60, healthScore: 60, fortuneScore: 60,
      luckyYi: '', luckyJi: '', luckyColor: '', luckyNumber: '', luckyDirection: '', jixiong: ''
    }).then(function (res) {
      if (res.success && res.analysis) {
        var a = res.analysis;
        var dims = [];
        if (a.careerHint) dims.push({ emoji: '💼', label: '事业', text: a.careerHint });
        if (a.wealthHint) dims.push({ emoji: '💰', label: '财运', text: a.wealthHint });
        if (a.loveHint) dims.push({ emoji: '💕', label: '情感', text: a.loveHint });
        if (a.healthHint) dims.push({ emoji: '🏃', label: '健康', text: a.healthHint });

        that.setData({
          loading: false,
          analysisNodes: parseMarkdown(a.dailyComment || 'AI 分析结果'),
          dimensions: dims
        });
      } else {
        that.setData({
          loading: false,
          analysisNodes: parseMarkdown('AI 分析暂不可用，请稍后重试。'),
          dimensions: []
        });
      }
    }).catch(function () {
      that.setData({
        loading: false,
        analysisNodes: parseMarkdown('网络错误，请稍后重试。'),
        dimensions: []
      });
    });
  },
  goBack: function () { wx.navigateBack(); }
});
