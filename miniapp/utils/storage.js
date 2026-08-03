var STORAGE_PREFIX = 'yunshu:';

function getItem(key) {
  try {
    var value = wx.getStorageSync(STORAGE_PREFIX + key);
    return value || null;
  } catch (e) {
    return null;
  }
}

function setItem(key, value) {
  try {
    wx.setStorageSync(STORAGE_PREFIX + key, value);
  } catch (e) {
    console.error('Storage set failed:', e);
  }
}

function removeItem(key) {
  try {
    wx.removeStorageSync(STORAGE_PREFIX + key);
  } catch (e) {
    console.error('Storage remove failed:', e);
  }
}

function getJSON(key) {
  try {
    var raw = getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setJSON(key, value) {
  try {
    setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage setJSON failed:', e);
  }
}

module.exports = {
  getItem: getItem,
  setItem: setItem,
  removeItem: removeItem,
  getJSON: getJSON,
  setJSON: setJSON
};
