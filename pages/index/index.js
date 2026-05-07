// pages/index/index.js
const app = getApp();

Page({
  data: {
    today: '',
    solarTerm: '',
    coverIndex: 0,
    coverImages: [
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=80'
    ]
  },

  onLoad() {
    // 若没有选择角色，跳转登录页
    const userRole = app.globalData.userRole || wx.getStorageSync('userRole');
    if (!userRole) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }

    // 商家无法进入客户首页，直接重定向到商家后台
    if (userRole === 'merchant') {
      wx.reLaunch({ url: '/pages/merchant/merchant' });
      return;
    }

    const now = new Date();
    const dateText = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    this.setData({
      today: dateText,
      solarTerm: this.getSolarTerm(now)
    });
  },

  getSolarTerm(date) {
    const terms = [
      '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满',
      '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
      '立冬', '小雪', '大雪', '冬至'
    ];
    const start = new Date(date.getFullYear(), 0, 5).getTime();
    const diff = date.getTime() - start;
    const termIndex = Math.max(0, Math.min(23, Math.floor(diff / (15.2 * 24 * 60 * 60 * 1000))));
    return terms[termIndex] || '节气计算中';
  },

  switchCover() {
    const next = (this.data.coverIndex + 1) % this.data.coverImages.length;
    this.setData({ coverIndex: next });
  },

  goMenu() {
    wx.navigateTo({ url: '/pages/menu/menu' });
  }
});