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
    var liunianHints = { '比肩': '同辈助力，宜合作共赢。注意竞争关系，保持谦虚。',
      '劫财': '人际活跃，开销增多。谨防冲动消费和破财，注意身边人。',
      '食神': '创意迸发，适合学习新技能或开启副业。心情愉悦，享受生活。',
      '伤官': '才思敏捷，表达欲强。宜展示才华，但注意口舌是非，避免过于尖锐。',
      '正财': '正财运佳，工作收入稳定增长。适合稳扎稳打的投资理财。',
      '偏财': '偏财运旺，可能有意外之财或投资机会。但风险与机遇并存，不可贪心。',
      '正官': '事业运上升，容易被上级认可。适合争取晋升或承担更多责任。',
      '七杀': '挑战与机遇并存的一年。压力即动力，突破自我的好时机，宜迎难而上。',
      '正印': '贵人运强，长辈或上级会提供帮助。也是学习进修的好时机，身心滋养。',
      '偏印': '独立思考能力强，适合深耕专业领域。但需注意人际关系，避免过于自我。'
    };
    var liunian = liunianData.slice(0, 6).map(function (y) {
      var m = (y.year_char || '').match(/^(\d+)年（(.+?)·(.+?)）$/);
      var yy = m ? parseInt(m[1]) : 0;
      var shishen = m ? m[3] : '';
      var hint = liunianHints[shishen] || '运势流转，把握当下，顺势而为。';
      return {
        year: m ? m[1] + '年' : y.year_char,
        ganzhi: m ? m[2] : '',
        luck: yy === currentYear ? '当前' : (m ? m[3] : '流年'),
        text: m ? (m[1] + '年流年「' + m[2] + '」· 十神「' + shishen + '」。' + hint) : ''
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

    // 五行实分
    var cesuanData = storage.getJSON('last-cesuan');
    var elements = [
      { name: '木', value: 25, color: '#4a9e6e' },
      { name: '火', value: 20, color: '#d94e3c' },
      { name: '土', value: 25, color: '#c49a3c' },
      { name: '金', value: 20, color: '#b8b8c0' },
      { name: '水', value: 10, color: '#5a8ec9' }
    ];
    if (cesuanData && cesuanData.xiyongshen) {
      var x = cesuanData.xiyongshen;
      elements[0].value = x.mu_score || 25;
      elements[1].value = x.huo_score || 20;
      elements[2].value = x.tu_score || 25;
      elements[3].value = x.jin_score || 20;
      elements[4].value = x.shui_score || 10;
    }

    // 称骨
    var chengguInfo = '';
    if (cesuanData && cesuanData.chenggu) {
      chengguInfo = cesuanData.chenggu.total_weight + ' — ' + cesuanData.chenggu.description;
    }

    // 藏干/空亡
    var cangganStr = di.canggan ? Object.keys(di.canggan).map(function(k){ return k+'：'+(di.canggan[k]||[]).join(''); }).join('　') : '';
    var xunkongStr = di.kongwang ? Object.keys(di.kongwang).map(function(k){ return di.kongwang[k]; }).join('　') : '';
    var xiyongshen = (cesuanData && cesuanData.xiyongshen && cesuanData.xiyongshen.xiyongshen) || '';

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
      cangganStr: cangganStr,
      xunkongStr: xunkongStr,
      xiyongshen: xiyongshen,
      chengguInfo: chengguInfo,
      elements: elements,
      dayunList: dayunList,
      liunian: liunian,
      shensha: shensha.slice(0, 8),
      minggeTags: ((si && si.jishen) || []).concat(bsi && bsi.zhengge ? [bsi.zhengge] : []).slice(0, 5),
      formName: (formData && formData.name) || '用户',
      formGender: (formData && formData.gender) || '男',
      formDate: (formData && formData.birthDate) || '',
      formTime: (formData && formData.birthTime) || ''
    });

    // AI 报告
    this.loadAIReport(paipanData);
  },

  loadAIReport: function (paipanData) {
    var that = this;
    var di = paipanData.detail_info, bsi = paipanData.base_info;
    var sizhuFull = di.sizhu.year.tg+di.sizhu.year.dz+' '+di.sizhu.month.tg+di.sizhu.month.dz+' '+di.sizhu.day.tg+di.sizhu.day.dz+' '+di.sizhu.hour.tg+di.sizhu.hour.dz;
    var cesuan = storage.getJSON('last-cesuan') || {};

    that.setData({ reportLoading: true, reportError: false });

    api.generateBaziReport({
      name: (bsi && bsi.name) || '用户',
      gender: (bsi && bsi.sex) || '',
      sizhuFull: sizhuFull,
      rizhu: (di.sizhu.day.tg||'')+(di.sizhu.day.dz||'')+'日元',
      zhengge: (bsi && bsi.zhengge) || '',
      nayin: di.nayin ? Object.values(di.nayin).join(' · ') : '',
      qiyun: (bsi && bsi.qiyun) || '',
      shenshaSummary: '',
      dayunSummary: '',
      wuxingSummary: '',
      xiyongshen: (cesuan.xiyongshen && cesuan.xiyongshen.xiyongshen) || '',
      jishen: (cesuan.xiyongshen && cesuan.xiyongshen.jishen) || '',
      chenggu: cesuan.chenggu ? (cesuan.chenggu.total_weight + ' — ' + cesuan.chenggu.description) : ''
    }).then(function (res) {
      if (res.success && res.report) {
        var r = res.report;
        var sections = [
          { key:'overview', icon:'📜', title:'命盘总览', text:r.overview },
          { key:'rizhuPersonality', icon:'🌟', title:'日主解读', text:r.rizhuPersonality },
          { key:'wuxingLife', icon:'🌿', title:'五行与生活', text:r.wuxingLife },
          { key:'dayunStory', icon:'📅', title:'大运人生', text:r.dayunStory },
          { key:'shenshaFun', icon:'⭐', title:'神煞趣解', text:r.shenshaFun },
          { key:'lifeAdvice', icon:'💡', title:'人生锦囊', text:r.lifeAdvice }
        ].filter(function(s){return s.text;}).map(function(s){
          return { key:s.key, icon:s.icon, title:s.title, nodes: parseMarkdown(s.text) };
        });
        that.setData({ report: true, reportSections: sections, reportLoading: false });
      } else {
        that.setData({ reportError: true, reportLoading: false });
      }
    }).catch(function (e) {
      console.error('AI报告加载失败', e);
      that.setData({ reportError: true, reportLoading: false });
    });
  },

  onGenerateLandscape: function () {
    var that = this;
    that.setData({ landscapeLoading: true });
    // 暂用占位图——后续接入智谱API
    setTimeout(function () {
      that.setData({ landscapeLoading: false, landscapeUrl: '' });
      wx.showToast({ title: '风景图生成功能需接入智谱API', icon: 'none' });
    }, 500);
  },
  onSaveLandscape: function () { wx.showToast({ title: '请先生成风景图', icon: 'none' }); },
  onShareLandscape: function () { wx.showToast({ title: '请先生成风景图', icon: 'none' }); },
  onSaveFateChart: function () {
    // 使用canvas绘制并保存
    wx.showToast({ title: '长按命理图卡片即可保存', icon: 'none', duration: 2000 });
  },
  onShareFateChart: function () {
    wx.showToast({ title: '分享链接已复制', icon: 'none' });
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

    api.analyzeDayunDetail({ name: '用户', dayunGz: gz, dayunGod: god, ageRange: age }).then(function (res) {
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
