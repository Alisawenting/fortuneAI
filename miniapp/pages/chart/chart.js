const api = require('../../utils/api');
const storage = require('../../utils/storage');
const { parseMarkdown } = require('../../utils/markdown');

var GAN_WUXING = {
  '甲': { element: '木', color: '#4a9e6e' }, '乙': { element: '木', color: '#5db87a' },
  '丙': { element: '火', color: '#d94e3c' }, '丁': { element: '火', color: '#e8685a' },
  '戊': { element: '土', color: '#c49a3c' }, '己': { element: '土', color: '#d4a84a' },
  '庚': { element: '金', color: '#b8b8c0' }, '辛': { element: '金', color: '#c8c8d0' },
  '壬': { element: '水', color: '#5a8ec9' }, '癸': { element: '水', color: '#6a9ed9' }
};

var ZHI_WUXING = {
  '寅': { element: '木', color: '#4a9e6e' }, '卯': { element: '木', color: '#5db87a' },
  '巳': { element: '火', color: '#d94e3c' }, '午': { element: '火', color: '#e8685a' },
  '辰': { element: '土', color: '#c49a3c' }, '戌': { element: '土', color: '#c49a3c' },
  '丑': { element: '土', color: '#c49a3c' }, '未': { element: '土', color: '#c49a3c' },
  '申': { element: '金', color: '#b8b8c0' }, '酉': { element: '金', color: '#c8c8d0' },
  '亥': { element: '水', color: '#5a8ec9' }, '子': { element: '水', color: '#6a9ed9' }
};

Page({
  data: {
    navBarHeight: 0,
    paipanData: null,
    tab: 'basic',
    pillars: [],
    rizhuLabel: '',
    rizhuDesc: '',
    sizhuSummary: '',
    shengxiao: '',
    xingzuo: '',
    calendarInfo: '',
    zhengge: '',
    overallNayin: '',
    elements: [],
    dayunList: [],
    liunian: [],
    shensha: [],
    minggeTags: [],
    lifeCards: [
      { emoji: '💼', title: '事业' },
      { emoji: '💰', title: '财运' },
      { emoji: '💕', title: '情感' },
      { emoji: '🏃', title: '健康' }
    ],
    wuxingList: [
      { name: '木', color: '#4a9e6e' }, { name: '火', color: '#d94e3c' },
      { name: '土', color: '#c49a3c' }, { name: '金', color: '#b8b8c0' },
      { name: '水', color: '#5a8ec9' }
    ],
    dayunDialogVisible: false,
    dayunDialogData: {},
    dayunAnalysisNodes: [],
    dayunLoading: false
  },

  onLoad: function () {
    var app = getApp();
    this.setData({ navBarHeight: app.globalData.navBarHeight || 64 });
    var cached = storage.getJSON('last-paipan');
    var formData = storage.getJSON('last-form-data');
    if (cached && cached.base_info) {
      this.renderChart(cached, formData);
    }
  },

  onShow: function () {
    if (!this.data.paipanData) {
      var cached = storage.getJSON('last-paipan');
      if (cached && cached.base_info) {
        this.renderChart(cached, storage.getJSON('last-form-data'));
      }
    }
  },

  renderChart: function (paipanData, formData) {
    var di = paipanData.detail_info;
    var bsi = paipanData.base_info;
    var dyi = paipanData.dayun_info;
    var si = paipanData.start_info;

    // 四柱
    var pillars = ['year', 'month', 'day', 'hour'].map(function (k) {
      var p = di.sizhu[k];
      var ganInfo = GAN_WUXING[p.tg] || {};
      var zhiInfo = ZHI_WUXING[p.dz] || {};
      return {
        label: { year: '年柱', month: '月柱', day: '日柱', hour: '时柱' }[k],
        gan: p.tg, zhi: p.dz,
        ganColor: ganInfo.color || '#666',
        zhiColor: zhiInfo.color || '#666',
        hidden: (di.canggan[k] || []).join(''),
        shishen: di.zhuxing[k] || '',
        nayin: di.nayin[k] || '',
        tag: k === 'day' ? '日元' : ''
      };
    });

    var sizhuSummary = pillars.map(function (p) { return p.gan + p.zhi; }).join(' / ');
    var rizhuGan = di.sizhu.day.tg;
    var rizhuZhi = di.sizhu.day.dz;
    var rizhuLabel = rizhuGan + rizhuZhi + '日元';

    // 大运
    var dayunList = dyi.big.map(function (gz, i) {
      return {
        age: ((dyi.xu_sui || [])[i] ? (dyi.xu_sui[i] + '-' + ((dyi.xu_sui[i] || 0) + 9)) : ((8 + i * 10) + '-' + (17 + i * 10))),
        gz: gz,
        note: (dyi.big_god || [])[i] || '',
        hot: i === 2 || i === 3
      };
    }).slice(0, 6);

    // 流年
    var currentYear = new Date().getFullYear();
    var currentIdx = (dyi.big_start_year || []).findIndex(function (y) {
      return y <= currentYear && ((dyi.big_end_year || [])[dyi.big_start_year.indexOf(y)] || 9999) >= currentYear;
    });
    var liunianKey = 'years_info' + (currentIdx >= 0 ? currentIdx : 3);
    var liunianData = dyi[liunianKey] || [];
    var liunian = liunianData.slice(0, 6).map(function (y) {
      var m = (y.year_char || '').match(/^(\d+)年（(.+?)·(.+?)）$/);
      return {
        year: m ? m[1] + '年' : y.year_char,
        ganzhi: m ? m[2] : '',
        luck: m && parseInt(m[1]) === currentYear ? '当前' : (m ? m[3] : '流年'),
        text: m ? (m[1] + '年流年「' + m[2] + '」· 十神「' + m[3] + '」') : ''
      };
    });

    // 神煞
    var shenshaLabels = {
      '天乙贵人': '一生贵人扶持', '文昌星': '利读书考试', '驿马': '动迁远行',
      '桃花': '人缘佳', '禄神': '食禄丰足', '将星': '领导才能', '华盖': '聪慧孤高'
    };
    var shensha = [];
    if (di.shensha) {
      var seen = {};
      var labels = { year: '年支', month: '月支', day: '日支', hour: '时支' };
      Object.keys(di.shensha).forEach(function (key) {
        var names = (di.shensha[key] || '').split(/\s+/).filter(Boolean);
        names.forEach(function (name) {
          if (!seen[name]) {
            seen[name] = true;
            shensha.push({ name: name, pos: labels[key] || key, desc: shenshaLabels[name] || '' });
          }
        });
      });
    }

    // 日历信息
    var calendarInfo = '';
    if (formData && formData.calendar === '农历' && bsi && bsi.gongli) {
      calendarInfo = '农历 ' + formData.birthDate + ' → 公历 ' + bsi.gongli;
    } else if (formData && formData.birthDate) {
      calendarInfo = '公历 ' + formData.birthDate + (bsi && bsi.nongli ? ' · 农历 ' + bsi.nongli : '');
    }

    this.setData({
      paipanData: paipanData,
      pillars: pillars,
      rizhuLabel: rizhuLabel,
      rizhuDesc: rizhuGan + '土载木',
      sizhuSummary: sizhuSummary,
      shengxiao: (si && si.sx) || '',
      xingzuo: (si && si.xz) || '',
      calendarInfo: calendarInfo,
      zhengge: (bsi && bsi.zhengge) || '',
      overallNayin: Object.values(di.nayin).join(' · '),
      elements: [
        { name: '木', value: 25, color: '#4a9e6e' },
        { name: '火', value: 20, color: '#d94e3c' },
        { name: '土', value: 25, color: '#c49a3c' },
        { name: '金', value: 20, color: '#b8b8c0' },
        { name: '水', value: 10, color: '#5a8ec9' }
      ],
      dayunList: dayunList,
      liunian: liunian,
      shensha: shensha.slice(0, 8),
      minggeTags: ((si && si.jishen) || []).concat(bsi && bsi.zhengge ? [bsi.zhengge] : []).slice(0, 5)
    });
  },

  switchTab: function (e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  onBookmark: function () {
    wx.showToast({ title: '已收藏', icon: 'success' });
  },

  onDayunDetail: function (e) {
    var that = this;
    var gz = e.currentTarget.dataset.gz;
    var god = e.currentTarget.dataset.god;
    var age = e.currentTarget.dataset.age;
    that.setData({
      dayunDialogVisible: true,
      dayunDialogData: { gz: gz, god: god, age: age },
      dayunAnalysisNodes: [],
      dayunLoading: true
    });

    api.analyzeDayunDetail({
      data: { name: '用户', dayunGz: gz, dayunGod: god, ageRange: age }
    }).then(function (res) {
      if (res.success) {
        that.setData({ dayunAnalysisNodes: parseMarkdown(res.analysis), dayunLoading: false });
      }
    }).catch(function () {
      that.setData({ dayunAnalysisNodes: parseMarkdown('暂无法获取分析'), dayunLoading: false });
    });
  },

  onCloseDayunDetail: function () {
    this.setData({ dayunDialogVisible: false });
  }
});
