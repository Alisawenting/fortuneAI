const api = require('../../utils/api');
const storage = require('../../utils/storage');
const { parseMarkdown } = require('../../utils/markdown');

function genId() { return 'm' + Date.now() + '_' + Math.random().toString(36).slice(2, 6); }

Page({
  data: {
    navBarHeight: 0,
    role: null,
    roles: [],
    messages: [],
    input: '',
    sending: false,
    baziLoading: false,
    baziCtx: {},
    listening: false,
    scrollToId: '',
    todayDate: '',
    quickQuestions: ['近期事业运势', '感情方面建议', '财运如何提升', '健康注意事项', '适合的行业方向']
  },

  onLoad: function () {
    var app = getApp();
    this.setData({ navBarHeight: app.globalData.navBarHeight || 64 });
    var that = this;
    that.setData({ todayDate: new Date().toLocaleDateString('zh-CN') });
    that.loadRoles();
  },

  onShow: function () {
    this.loadRoles();
  },

  loadRoles: function () {
    var that = this;
    var roles = storage.getJSON('roles') || [];
    var activeId = storage.getItem('active-role-id');
    var role = roles.find(function (r) { return r.id === activeId; }) || roles[0] || null;

    if (role && role.id !== (that.data.role && that.data.role.id)) {
      that.setData({ roles: roles, role: role, messages: [] });
      that.loadBaziCtx(role);
    } else {
      that.setData({ roles: roles, role: role });
      if (!that.data.messages.length) {
        that.initMessages(role);
      }
    }
  },

  loadBaziCtx: function (role) {
    var that = this;
    that.setData({ baziLoading: true });
    var ctx = { name: role.name, sex: role.gender === '男' ? '乾造' : '坤造', birthDate: role.birthDate, birthTime: role.birthTime };

    var cached = storage.getJSON('last-paipan');
    if (cached && cached.detail_info && cached.detail_info.sizhu) {
      var s = cached.detail_info.sizhu;
      ctx.sizhu = s.year.tg + s.year.dz + ' ' + s.month.tg + s.month.dz + ' ' + s.day.tg + s.day.dz + ' ' + s.hour.tg + s.hour.dz;
      if (cached.base_info && cached.base_info.zhengge) ctx.zhengge = cached.base_info.zhengge;
    }

    var cesuanCached = storage.getJSON('last-cesuan');
    if (cesuanCached && cesuanCached.xiyongshen && cesuanCached.xiyongshen.xiyongshen) {
      ctx.xiyongshen = cesuanCached.xiyongshen.xiyongshen;
    }

    that.setData({ baziCtx: ctx, baziLoading: false });
    that.initMessages(role, ctx);
  },

  initMessages: function (role, ctx) {
    var content = role
      ? '你好！我已加载「' + role.name + '」的命盘（' + role.gender + '·' + role.birthDate + '）。\n八字：' + ((ctx && ctx.sizhu) || '已加载') + '\n格局：' + ((ctx && ctx.zhengge) || '待分析') + '\n\n有什么想了解的？'
      : '你好！我是云枢易馆的 AI 命理师「枢机」。请先在测算页面录入生辰，我就能结合命盘为你解读。';

    this.setData({
      messages: [{ id: genId(), role: 'ai', content: content, nodes: parseMarkdown(content) }]
    });
  },

  onInput: function (e) { this.setData({ input: e.detail.value }); },

  onSend: function () {
    var that = this;
    var msg = that.data.input.trim();
    if (!msg || that.data.sending) return;

    var userMsg = { id: genId(), role: 'user', content: msg, nodes: [] };
    var msgs = that.data.messages.concat([userMsg]);
    that.setData({ messages: msgs, input: '', sending: true, scrollToId: 'msg-bottom' });

    var history = msgs.filter(function (m) { return m.id !== 'w'; }).map(function (m) {
      return { role: m.role === 'ai' ? 'assistant' : 'user', content: m.content };
    });

    api.sendChatMessage({
      data: { message: msg, history: history, baziContext: that.data.baziCtx }
    }).then(function (res) {
      var reply = res.success ? res.reply : (res.error || 'AI 服务暂不可用');
      var aiMsg = { id: genId(), role: 'ai', content: reply, nodes: parseMarkdown(reply) };
      that.setData({ messages: that.data.messages.concat([aiMsg]), sending: false, scrollToId: 'msg-bottom' });
    }).catch(function () {
      var errMsg = { id: genId(), role: 'ai', content: '抱歉，网络出了点问题，请稍后重试。', nodes: parseMarkdown('抱歉，网络出了点问题，请稍后重试。') };
      that.setData({ messages: that.data.messages.concat([errMsg]), sending: false, scrollToId: 'msg-bottom' });
    });
  },

  onQuickSend: function (e) {
    this.setData({ input: e.currentTarget.dataset.q });
    this.onSend();
  },

  onSwitchRole: function (e) {
    var id = e.currentTarget.dataset.id;
    storage.setItem('active-role-id', id);
    var role = this.data.roles.find(function (r) { return r.id === id; });
    if (role) {
      this.setData({ role: role, messages: [] });
      this.loadBaziCtx(role);
    }
  },

  onVoice: function () {
    wx.showToast({ title: '语音功能开发中', icon: 'none' });
  }
});
