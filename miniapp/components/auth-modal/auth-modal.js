const api = require('../../utils/api');
const storage = require('../../utils/storage');

Component({
  properties: {
    visible: { type: Boolean, value: false }
  },

  data: {
    mode: 'login',
    username: '',
    password: '',
    displayName: '',
    submitting: false
  },

  methods: {
    onClose: function () {
      this.triggerEvent('close');
    },

    switchMode: function (e) {
      this.setData({ mode: e.currentTarget.dataset.mode });
    },

    onUsernameInput: function (e) { this.setData({ username: e.detail.value }); },
    onPasswordInput: function (e) { this.setData({ password: e.detail.value }); },
    onDisplayNameInput: function (e) { this.setData({ displayName: e.detail.value }); },

    onSubmit: function () {
      var that = this;
      var data = {
        username: that.data.username.trim(),
        password: that.data.password.trim()
      };
      if (!data.username || !data.password) {
        wx.showToast({ title: '请填写用户名和密码', icon: 'none' });
        return;
      }

      that.setData({ submitting: true });

      var apiCall = that.data.mode === 'login' ? api.login : api.register;
      if (that.data.mode === 'register') {
        data.displayName = that.data.displayName.trim() || data.username;
      }

      apiCall({ data: data }).then(function (res) {
        if (res.success) {
          storage.setItem('auth-token', res.token || '');
          storage.setJSON('user', res.user || { username: data.username });
          wx.showToast({ title: that.data.mode === 'login' ? '登录成功' : '注册成功', icon: 'success' });
          that.triggerEvent('success', { user: res.user });
          that.triggerEvent('close');
        } else {
          wx.showToast({ title: res.error || '操作失败', icon: 'none' });
        }
      }).catch(function () {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }).finally(function () {
        that.setData({ submitting: false });
      });
    }
  }
});
