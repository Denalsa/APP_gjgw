// pages/login/login.js
const app = getApp();

Page({
  data: {
    showMerchantLogin: false,
    password: '',
    passwordError: ''
  },

  // 进入客户模式
  goCustomer() {
    app.setUserRole('customer');
    wx.reLaunch({ url: '/pages/index/index' });
  },

  // 显示商家登录入口
  showMerchant() {
    this.setData({ showMerchantLogin: true, password: '', passwordError: '' });
  },

  // 隐藏商家登录
  hideMerchant() {
    this.setData({ showMerchantLogin: false, password: '', passwordError: '' });
  },

  // 输入密码
  onPasswordInput(e) {
    this.setData({ password: e.detail.value, passwordError: '' });
  },

  // 商家登录（通过云函数验证）
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
        wx.reLaunch({ url: '/pages/merchant/merchant' });
      } else {
        this.setData({ passwordError: result.message || '密码错误' });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('登录失败', err);
      this.setData({ passwordError: '登录失败，请稍后重试' });
    });
  }
});