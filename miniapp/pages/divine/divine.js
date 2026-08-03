const api = require('../../utils/api');
const storage = require('../../utils/storage');

var NOW_YEAR = new Date().getFullYear();
var AVATAR_OPTIONS = ['🌿', '🌸', '🔥', '💧', '⚡', '🌟', '🌙', '☀️'];

function pad(n) { return String(n).toString().length < 2 ? '0' + n : String(n); }

function daysInSolarMonth(y, m) {
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
}

var CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

function lunarDayName(n) {
  if (n <= 10) return '初' + CN_NUM[n];
  if (n < 20) return '十' + CN_NUM[n - 10];
  if (n === 20) return '二十';
  if (n < 30) return '廿' + CN_NUM[n - 20];
  return '三十';
}

var LUNAR_MONTHS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];

Page({
  data: {
    navBarHeight: 0,
    gender: '男',
    name: '',
    year: NOW_YEAR,
    month: 1,
    day: 1,
    time: '07:20',
    place: '浙江省 杭州市',
    calendar: '公历',
    saveAsRole: false,
    avatar: '🌿',
    avatarOptions: AVATAR_OPTIONS,
    roleCount: 0,
    loading: false,
    yearOptions: [],
    yearIndex: 0,
    monthLabels: [],
    monthIndex: 0,
    dayOptions: [],
    dayLabels: [],
    dayIndex: 0
  },

  onLoad: function () {
    var app = getApp();
    this.setData({ navBarHeight: app.globalData.navBarHeight || 64 });
    var that = this;
    // 年份选项：从 NOW_YEAR 到 1900
    var yearOptions = [];
    for (var y = NOW_YEAR; y >= 1900; y--) { yearOptions.push(y); }
    var yearIndex = yearOptions.indexOf(NOW_YEAR - 30 >= 1900 ? NOW_YEAR - 30 : NOW_YEAR);

    that.setData({
      yearOptions: yearOptions,
      yearIndex: Math.max(0, yearIndex),
      year: yearOptions[Math.max(0, yearIndex)]
    });

    that.updateMonthLabels();
    that.updateDayOptions();
    that.loadRoles();
  },

  onShow: function () {
    this.loadRoles();
  },

  loadRoles: function () {
    var roles = storage.getJSON('roles') || [];
    var activeRole = null;
    var activeId = storage.getItem('active-role-id');
    if (activeId) {
      activeRole = roles.find(function (r) { return r.id === activeId; });
    }
    if (!activeRole) activeRole = roles[0];

    if (activeRole) {
      var dateParts = (activeRole.birthDate || '1995-08-12').split('-');
      var year = parseInt(dateParts[0]) || NOW_YEAR;
      var month = parseInt(dateParts[1]) || 1;
      var day = parseInt(dateParts[2]) || 1;
      var yearIndex = this.data.yearOptions.indexOf(year);

      this.setData({
        gender: activeRole.gender || '男',
        name: activeRole.name || '',
        year: year,
        month: month,
        day: day,
        time: activeRole.birthTime || '07:20',
        place: activeRole.birthPlace || '浙江省 杭州市',
        calendar: activeRole.calendar || '公历',
        roleCount: roles.length,
        yearIndex: Math.max(0, yearIndex),
        monthIndex: month - 1
      });
      this.updateDayOptions();
      this.setData({ dayIndex: Math.max(0, day - 1) });
    } else {
      this.setData({ roleCount: roles.length });
    }
  },

  updateMonthLabels: function () {
    if (this.data.calendar === '农历') {
      this.setData({ monthLabels: LUNAR_MONTHS });
    } else {
      var labels = [];
      for (var i = 1; i <= 12; i++) { labels.push(i + '月'); }
      this.setData({ monthLabels: labels });
    }
  },

  updateDayOptions: function () {
    var dayCount = this.data.calendar === '公历' ? daysInSolarMonth(this.data.year, this.data.month) : 30;
    var dayOptions = [];
    var dayLabels = [];
    for (var i = 1; i <= dayCount; i++) {
      dayOptions.push(i);
      dayLabels.push(this.data.calendar === '农历' ? lunarDayName(i) : i + '日');
    }
    this.setData({ dayOptions: dayOptions, dayLabels: dayLabels });
    if (this.data.dayIndex >= dayCount) {
      this.setData({ dayIndex: dayCount - 1, day: dayCount });
    }
  },

  setGender: function (e) { this.setData({ gender: e.currentTarget.dataset.g }); },
  onNameInput: function (e) { this.setData({ name: e.detail.value }); },
  onTimeInput: function (e) { this.setData({ time: e.detail.value }); },
  onPlaceInput: function (e) { this.setData({ place: e.detail.value }); },
  onSaveRoleChange: function (e) { this.setData({ saveAsRole: e.detail.value.length > 0 }); },

  setCalendar: function (e) {
    var c = e.currentTarget.dataset.c;
    this.setData({ calendar: c });
    this.updateMonthLabels();
    this.updateDayOptions();
    // 收敛日期（公历2月可能只有28天）
    var maxD = c === '公历' ? daysInSolarMonth(this.data.year, this.data.month) : 30;
    if (this.data.day > maxD) {
      this.setData({ day: maxD, dayIndex: maxD - 1 });
    }
  },

  setAvatar: function (e) { this.setData({ avatar: e.currentTarget.dataset.a }); },

  onYearChange: function (e) {
    var idx = parseInt(e.detail.value);
    var year = this.data.yearOptions[idx];
    this.setData({ yearIndex: idx, year: year });
    this.updateDayOptions();
  },

  onMonthChange: function (e) {
    var idx = parseInt(e.detail.value);
    this.setData({ monthIndex: idx, month: idx + 1 });
    this.updateDayOptions();
  },

  onDayChange: function (e) {
    var idx = parseInt(e.detail.value);
    this.setData({ dayIndex: idx, day: idx + 1 });
  },

  onEstimateTime: function () {
    wx.showToast({ title: '已使用默认时辰 07:20', icon: 'none' });
    this.setData({ time: '07:20' });
  },

  getFormData: function () {
    return {
      name: this.data.name.trim() || '用户',
      gender: this.data.gender,
      birthDate: this.data.year + '-' + pad(this.data.month) + '-' + pad(this.data.day),
      birthTime: this.data.time,
      birthPlace: this.data.place,
      calendar: this.data.calendar
    };
  },

  onGenerateBazi: function () {
    var that = this;
    var formData = that.getFormData();

    if (that.data.saveAsRole && that.data.roleCount < 5) {
      var roles = storage.getJSON('roles') || [];
      var newRole = {
        id: 'r_' + Date.now(),
        name: formData.name,
        gender: formData.gender,
        birthDate: formData.birthDate,
        birthTime: formData.birthTime,
        birthPlace: formData.birthPlace,
        calendar: formData.calendar,
        avatar: that.data.avatar
      };
      roles.push(newRole);
      storage.setJSON('roles', roles);
      storage.setItem('active-role-id', newRole.id);
    }

    that.setData({ loading: true });

    api.calculateBazi({ data: formData }).then(function (res) {
      if (res.success && res.data) {
        storage.setJSON('last-paipan', res.data);
        storage.setJSON('last-form-data', formData);
        wx.navigateTo({ url: '/pages/chart/chart' });
      } else {
        wx.showToast({ title: (res && res.error) || '排盘失败', icon: 'none' });
      }
    }).catch(function () {
      wx.showToast({ title: '网络错误', icon: 'none' });
    }).finally(function () {
      that.setData({ loading: false });
    });
  },

  onGenerateZiwei: function () {
    var that = this;
    var formData = that.getFormData();

    api.calculateZiwei({ data: formData }).then(function (res) {
      if (res.success && res.data) {
        storage.setJSON('last-ziwei', res.data);
        wx.navigateTo({ url: '/pages/ziwei-chart/ziwei-chart' });
      } else {
        wx.showToast({ title: '紫微排盘失败', icon: 'none' });
      }
    }).catch(function () {
      wx.showToast({ title: '网络错误', icon: 'none' });
    });
  }
});
