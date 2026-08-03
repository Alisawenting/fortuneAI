const api = require('../../utils/api');
const storage = require('../../utils/storage');
const { parseMarkdown } = require('../../utils/markdown');

Page({
  data: {
    navBarHeight: 0,
    loading: true,
    yunshiLoading: false,
    aiLoading: false,
    yunshiData: null,
    aiAnalysis: null,
    aiNodes: [],
    dayunAnalysisNodes: [],
    liunianHintNodes: [],
    paipanData: null,

    roles: [],
    activeRole: null,
    roleDialogVisible: false,

    fortunes: [],
    fortuneDialogVisible: false,
    fortuneDetail: {},

    luckyColors: [],
    luckyNumbers: [],
    yiList: [],
    jiList: [],

    checkedToday: false,
    checkInDays: 7,

    dayunList: [],
    liunianList: [],
    currentDayun: null,
    dayunDialogVisible: false,
    dayunDialogData: {},
    dayunLoading: false,

    bookmarkedIds: [],
    defaultYearPrompts: [
      { id: '1', title: '丙午流年', desc: '火旺之年，宜顺势而为，主动求变', tone: 'primary' },
      { id: '2', title: '乙巳流年', desc: '木火相生，学习进修的好时机', tone: '' }
    ]
  },

  onLoad: function () {
    var app = getApp();
    this.setData({ navBarHeight: app.globalData.navBarHeight || 64 });
    this.loadRoles();
    this.loadCheckIn();
    this.loadBookmarks();
  },

  onShow: function () {
    this.loadRoles();
  },

  /* ===== 角色管理 ===== */
  loadRoles: function () {
    var roles = storage.getJSON('roles') || [];
    var activeId = storage.getItem('active-role-id') || (roles[0] && roles[0].id) || '';
    var activeRole = roles.find(function (r) { return r.id === activeId; }) || roles[0] || null;
    this.setData({ roles: roles, activeRole: activeRole });

    if (activeRole && !this.data.yunshiData) {
      this.fetchDailyFortune();
      this.loadPaipan();
    }
  },

  /* ===== 每日运势 ===== */
  fetchDailyFortune: function () {
    var that = this;
    var role = that.data.activeRole;
    if (!role) return;

    that.setData({ yunshiLoading: true, loading: true });
    api.getDailyFortune({
      data: {
        name: role.name || '用户',
        gender: role.gender,
        birthDate: role.birthDate,
        birthTime: role.birthTime,
        calendar: role.calendar || '公历'
      }
    }).then(function (res) {
      if (res.success) {
        var yi = res.data.yunshi_info;
        var fortunes = [
          { key: '事业', emoji: '💼', score: yi.career_score },
          { key: '财运', emoji: '💰', score: yi.wealth_score },
          { key: '情感', emoji: '💕', score: yi.love_score },
          { key: '人际', emoji: '👥', score: yi.fortune_score },
          { key: '情绪', emoji: '😊', score: yi.health_score }
        ];

        fortunes.forEach(function (f) {
          if (f.score >= 80) f.barColor = '#4a9e6e';
          else if (f.score >= 60) f.barColor = '#6a9ed9';
          else if (f.score >= 40) f.barColor = '#d4a84a';
          else f.barColor = '#d94e3c';
        });

        var luckyColors = (yi.lucky_color || '松烟青、鎏金').split('、').map(function (c, i) {
          return { name: c, hex: ['#3a5a6c', '#c9a14a', '#c9c9d1', '#6a9bd1'][i] || '#3a5a6c' };
        });

        var luckyNumbers = (yi.lucky_number || '3、8').split('、');

        that.setData({
          yunshiData: res.data,
          yunshiLoading: false,
          loading: false,
          fortunes: fortunes,
          luckyColors: luckyColors,
          luckyNumbers: luckyNumbers,
          yiList: (yi.lucky_yi || '').split('、').filter(Boolean),
          jiList: (yi.lucky_ji || '').split('、').filter(Boolean)
        });
      } else {
        that.setFallbackData();
      }
    }).catch(function () {
      that.setFallbackData();
    });
  },

  setFallbackData: function () {
    this.setData({
      yunshiLoading: false,
      loading: false,
      fortunes: [
        { key: '事业', emoji: '💼', score: 70, barColor: '#6a9ed9' },
        { key: '财运', emoji: '💰', score: 55, barColor: '#d4a84a' },
        { key: '情感', emoji: '💕', score: 85, barColor: '#4a9e6e' },
        { key: '人际', emoji: '👥', score: 72, barColor: '#6a9ed9' },
        { key: '情绪', emoji: '😊', score: 68, barColor: '#6a9ed9' }
      ],
      luckyColors: [
        { name: '松烟青', hex: '#3a5a6c' },
        { name: '鎏金', hex: '#c9a14a' }
      ],
      luckyNumbers: ['3', '8'],
      yiList: ['出行', '签约', '会友', '整理'],
      jiList: ['争辩', '动土', '大额消费']
    });
  },

  /* ===== 八字排盘 ===== */
  loadPaipan: function () {
    var that = this;
    var role = that.data.activeRole;
    if (!role) return;

    var cached = storage.getJSON('last-paipan');
    if (cached && cached.base_info) {
      that.setData({ paipanData: cached });
      that.extractDayunLiunian(cached);
      that.fetchAiAnalysis(cached);
      return;
    }

    api.calculateBazi({
      data: {
        name: role.name || '用户',
        gender: role.gender,
        birthDate: role.birthDate,
        birthTime: role.birthTime,
        calendar: role.calendar || '公历'
      }
    }).then(function (res) {
      if (res.success && res.data) {
        that.setData({ paipanData: res.data });
        storage.setJSON('last-paipan', res.data);
        that.extractDayunLiunian(res.data);
        that.fetchAiAnalysis(res.data);
      }
    }).catch(function (err) {
      console.error('八字排盘失败:', err);
    });
  },

  extractDayunLiunian: function (paipanData) {
    var dyi = paipanData.dayun_info;
    var birthYear = parseInt((paipanData.base_info && paipanData.base_info.gongli || '1990').slice(0, 4));
    var currentYear = new Date().getFullYear();

    var dayunList = [];
    dyi.big.forEach(function (gz, i) {
      var startY = (dyi.big_start_year || [])[i] || birthYear + ((dyi.xu_sui || [])[i] || i * 10);
      var endY = (dyi.big_end_year || [])[i] || startY + 9;
      var isCurrent = currentYear >= startY && currentYear <= endY;
      dayunList.push({
        age: ((dyi.xu_sui || [])[i] || i * 10) + '-' + (((dyi.xu_sui || [])[i] || i * 10) + 9),
        gz: gz,
        note: (dyi.big_god || [])[i] || '',
        current: isCurrent
      });
    });

    var currentDayun = dayunList.find(function (d) { return d.current; }) || null;

    var currentIdx = dayunList.findIndex(function (d) { return d.current; });
    var liunianKey = 'years_info' + (currentIdx >= 0 ? currentIdx : 0);
    var liunianData = dyi[liunianKey] || [];
    var liunianList = liunianData.slice(0, 6).map(function (y) {
      var m = (y.year_char || '').match(/^(\d+)年（(.+?)·(.+?)）$/);
      var yearNum = m ? parseInt(m[1]) : 0;
      var ganzhi = m ? m[2] : '';
      var shishen = m ? m[3] : '';
      var hints = {
        '比肩': '同辈助力，宜合作共赢', '劫财': '人际活跃，谨防破财',
        '食神': '创意迸发，宜学新技能', '伤官': '才思敏捷，注意口舌',
        '正财': '正财运佳，稳定增长', '偏财': '偏财运旺，机遇与风险并存',
        '正官': '事业上升，适合晋升', '七杀': '挑战与机遇并存',
        '正印': '贵人运强，宜进修', '偏印': '深耕专业，独立思考'
      };
      return {
        year: m ? m[1] : y.year_char,
        ganzhi: ganzhi,
        shishen: shishen,
        isCurrent: yearNum === currentYear,
        hint: shishen ? (hints[shishen] || '运势流转，顺势而为') : ''
      };
    });

    this.setData({
      dayunList: dayunList.slice(0, 8),
      currentDayun: currentDayun,
      liunianList: liunianList
    });
  },

  /* ===== AI 分析 ===== */
  fetchAiAnalysis: function (paipanData) {
    var that = this;
    if (that.data.aiAnalysis) return;

    var cached = storage.getJSON('ai-analysis-' + ((that.data.activeRole && that.data.activeRole.id) || 'self'));
    if (cached) {
      that.setData({
        aiAnalysis: cached,
        aiNodes: parseMarkdown(cached.dailyComment || ''),
        liunianHintNodes: parseMarkdown(cached.liunianHint || ''),
        dayunAnalysisNodes: parseMarkdown(cached.dayunAnalysis || '')
      });
      return;
    }

    that.setData({ aiLoading: true });
    var di = paipanData.detail_info;
    var yi = (that.data.yunshiData && that.data.yunshiData.yunshi_info) || {};

    api.analyzeFortune({
      data: {
        name: (that.data.activeRole && that.data.activeRole.name) || '用户',
        gender: (that.data.activeRole && that.data.activeRole.gender) || '男',
        sizhu: di.sizhu.year.tg + di.sizhu.year.dz + ' ' +
               di.sizhu.month.tg + di.sizhu.month.dz + ' ' +
               di.sizhu.day.tg + di.sizhu.day.dz + ' ' +
               di.sizhu.hour.tg + di.sizhu.hour.dz,
        careerScore: yi.career_score,
        wealthScore: yi.wealth_score,
        loveScore: yi.love_score
      }
    }).then(function (res) {
      if (res.success) {
        that.setData({
          aiAnalysis: res.analysis,
          aiNodes: parseMarkdown((res.analysis && res.analysis.dailyComment) || ''),
          liunianHintNodes: parseMarkdown((res.analysis && res.analysis.liunianHint) || ''),
          dayunAnalysisNodes: parseMarkdown((res.analysis && res.analysis.dayunAnalysis) || ''),
          aiLoading: false
        });
        storage.setJSON('ai-analysis-' + ((that.data.activeRole && that.data.activeRole.id) || 'self'), res.analysis);
      } else {
        that.setData({ aiLoading: false });
      }
    }).catch(function () {
      that.setData({ aiLoading: false });
    });
  },

  /* ===== 打卡 ===== */
  loadCheckIn: function () {
    var last = storage.getItem('checkin-date');
    var today = new Date().toDateString();
    var days = parseInt(storage.getItem('checkin-streak') || '7');
    this.setData({
      checkedToday: last === today,
      checkInDays: days
    });
  },

  onCheckIn: function () {
    var today = new Date().toDateString();
    if (storage.getItem('checkin-date') === today) return;
    storage.setItem('checkin-date', today);
    var next = this.data.checkInDays + 1;
    storage.setItem('checkin-streak', String(next));
    this.setData({ checkInDays: next, checkedToday: true });
    wx.showToast({ title: '连续打卡 ' + next + ' 天', icon: 'success' });
  },

  /* ===== 书签 ===== */
  loadBookmarks: function () {
    var bm = storage.getJSON('bookmarkedPrompts') || [];
    this.setData({ bookmarkedIds: bm });
  },

  /* ===== 运势详情弹窗 ===== */
  onFortuneDetail: function (e) {
    var key = e.currentTarget.dataset.key;
    var fortune = this.data.fortunes.find(function (f) { return f.key === key; });
    if (!fortune) return;
    var yi = this.data.yunshiData && this.data.yunshiData.yunshi_info;
    var descMap = {
      '事业': yi && yi.career_description,
      '财运': yi && yi.wealth_description,
      '情感': yi && yi.love_description,
      '人际': yi && yi.fortune_description,
      '情绪': yi && yi.health_description
    };
    var aiHintMap = {
      '事业': this.data.aiAnalysis && this.data.aiAnalysis.careerHint,
      '财运': this.data.aiAnalysis && this.data.aiAnalysis.wealthHint,
      '情感': this.data.aiAnalysis && this.data.aiAnalysis.loveHint,
      '情绪': this.data.aiAnalysis && this.data.aiAnalysis.healthHint,
      '人际': this.data.aiAnalysis && this.data.aiAnalysis.healthHint
    };
    this.setData({
      fortuneDialogVisible: true,
      fortuneDetail: {
        key: fortune.key,
        score: fortune.score,
        desc: descMap[key] || '',
        aiHint: aiHintMap[key] || ''
      }
    });
  },

  onCloseFortuneDetail: function () {
    this.setData({ fortuneDialogVisible: false });
  },

  /* ===== 角色弹窗 ===== */
  onRoleSwitch: function () {
    this.setData({ roleDialogVisible: true });
  },

  onCloseRoleDialog: function () {
    this.setData({ roleDialogVisible: false });
  },

  onSwitchRole: function (e) {
    var id = e.currentTarget.dataset.id;
    storage.setItem('active-role-id', id);
    this.setData({
      roleDialogVisible: false,
      yunshiData: null,
      aiAnalysis: null,
      paipanData: null,
      aiNodes: [],
      dayunAnalysisNodes: [],
      liunianHintNodes: []
    });
    this.loadRoles();
  },

  onDeleteRole: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    if (that.data.roles.length <= 1) {
      wx.showToast({ title: '至少保留一个角色', icon: 'none' });
      return;
    }
    var roles = that.data.roles.filter(function (r) { return r.id !== id; });
    storage.setJSON('roles', roles);
    wx.showToast({ title: '已删除「' + name + '」', icon: 'success' });
    if (that.data.activeRole && that.data.activeRole.id === id) {
      storage.setItem('active-role-id', roles[0] && roles[0].id || '');
    }
    that.loadRoles();
  },

  /* ===== 大运详情弹窗 ===== */
  onDayunDetail: function (e) {
    var gz = e.currentTarget.dataset.gz;
    var god = e.currentTarget.dataset.god;
    var age = e.currentTarget.dataset.age;
    this.setData({
      dayunDialogVisible: true,
      dayunDialogData: { gz: gz, god: god, age: age },
      dayunAnalysisNodes: [],
      dayunLoading: true
    });
    this.fetchDayunAnalysis(gz, god, age);
  },

  fetchDayunAnalysis: function (gz, god, age) {
    var that = this;
    api.analyzeDayunDetail({
      data: {
        name: (that.data.activeRole && that.data.activeRole.name) || '用户',
        gender: (that.data.activeRole && that.data.activeRole.gender) || '',
        dayunGz: gz,
        dayunGod: god,
        ageRange: age
      }
    }).then(function (res) {
      if (res.success) {
        that.setData({
          dayunAnalysisNodes: parseMarkdown(res.analysis),
          dayunLoading: false
        });
      }
    }).catch(function () {
      that.setData({
        dayunAnalysisNodes: parseMarkdown('暂无法获取分析'),
        dayunLoading: false
      });
    });
  },

  onCloseDayunDetail: function () {
    this.setData({ dayunDialogVisible: false });
  }
});
