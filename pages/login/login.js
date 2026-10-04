const app = getApp();

Page({
  data: {
    userAvatar: '',
    userNickname: '',
    defaultAvatar: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagd',
    showMerchantLogin: false,
    password: '',
    passwordError: ''
  },

  onShow() {
    const profile = wx.getStorageSync('userProfile');
    if (profile) {
      this.setData({
        userAvatar: profile.avatarUrl || '',
        userNickname: profile.nickName || ''
      });
    }
  },

  goHistory() {
    wx.showToast({ title: '历史订单功能开发中', icon: 'none' });
  },

  showMerchant() {
    this.setData({ showMerchantLogin: true, password: '', passwordError: '' });
  },

  hideMerchant() {
    this.setData({ showMerchantLogin: false, password: '', passwordError: '' });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value, passwordError: '' });
  },

  merchantLogin() {
    const password = this.data.password.trim();
    if (!password) {
      this.setData({ passwordError: '请输入商家密码' });
      return;
    }

    wx.showLoading({ title: '验证中...' });

    wx.cloud.callFunction({
      name: 'getopenid',
      data: { password }
    }).then(res => {
      wx.hideLoading();
      const result = res.result;
      if (result.success) {
        app.setUserRole('merchant', result.merchantInfo);
        // ★ 新增：保存商家记录的 _id 和 openid
        wx.setStorageSync('merchantId', result.merchantInfo.merchantId);
        wx.setStorageSync('merchantPwd', password);
        wx.reLaunch({ url: '/pages/merchant/merchant' });
      } else {
        this.setData({ passwordError: result.message || '密码错误' });

      }
    }).catch(err => {
      wx.hideLoading();
      console.error('登录失败', err);
      this.setData({ passwordError: '登录失败，请稍后重试' });

    });
  },

  checkFridge() {
    if (app.globalData.userRole === 'merchant') {
      wx.navigateTo({ url: '/pages/fridge/fridge' });
    } else {
      wx.showToast({ title: '请先登录商家账号', icon: 'none' });
    }
  },

  // 底部导航栏：跳转到菜单页
  goMenu() {
    wx.reLaunch({ url: '/pages/menu/menu' });
  },

  // 底部导航栏：当前已在“我的”，无需跳转
  goProfile() {
    // 当前页面就是“我的”
  }
});