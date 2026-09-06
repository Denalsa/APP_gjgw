// pages/merchant/merchant.js
const app = getApp();
const TEMPLATE_ID = 'Ui42b4ts_Z8uXJfIc5urZFwCP1SNV3J6KpphONj4kTY'; // 粘贴你从公众平台拿到的模板ID


Page({
  data: {
    merchantInfo: null,
    dishes: [],
    loading: true,
    refreshing: false,
    subscribed: false
  },

  onLoad() {
    // 校验是否为商家
    if (app.globalData.userRole !== 'merchant') {
      wx.showToast({ title: '请先登录商家账号', icon: 'none' });
      setTimeout(() => { wx.reLaunch({ url: '/pages/login/login' }); }, 1500);
      return;
    }
    this.setData({ merchantInfo: app.globalData.merchantInfo });
    this.loadDishes();
    this.checkSubscription();
  },

  onShow() {
    if (app.globalData.userRole !== 'merchant') return;
    // 每次显示都刷新菜品列表
    this.loadDishes();
  },
  loadDishes() {
    const db = wx.cloud.database();
    this.setData({ loading: true });

    db.collection('dishes')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        this.setData({
          dishes: res.data,
          loading: false,
          refreshing: false
        });
      })
      .catch(err => {
        console.error('加载菜品失败', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ loading: false, refreshing: false });
      });
  },
  // 检查当前商家是否已订阅
  checkSubscription() {
    const db = wx.cloud.database();
    db.collection('merchants')
      .where({ openid: app.globalData.openid })  // 需要事先在登录时写入 openid
      .get()
      .then(res => {
        if (res.data.length > 0) {
          this.setData({ subscribed: res.data[0].subscribed || false });
        }
      });
  },

// 请求订阅消息
requestSubscribe() {
  const that = this; // 保存 this 指向，后续回调中使用
  console.log('当前 openid:', app.globalData.openid);  // ← 加这行
  wx.requestSubscribeMessage({
    tmplIds: [TEMPLATE_ID],
    success: (res) => {
      console.log('订阅结果:', res);  // ← 加这行
      // 检查用户对特定模板的订阅结果
      if (res[TEMPLATE_ID] === 'accept') {
        // ★ 关键：用户同意后，在云数据库中标记“已订阅”
        const db = wx.cloud.database();
        db.collection('merchants')
          .where({
            // 通过密码定位当前商家，确保更新的是自己的记录
            openid: app.globalData.openid          })
          .update({
            data: { subscribed: true }             })
          .then(updateRes => {
            console.log('stats 完整内容：', JSON.stringify(res.stats, null, 2));
            
            that.setData({ subscribed: true });
            wx.showToast({ title: '已开启接单提醒', icon: 'success' });
          })
          .catch(err => {
            console.error('更新订阅状态失败', err);
            wx.showToast({ title: '开启失败，请重试', icon: 'none' });
          });
      } else {
        // 用户拒绝了订阅
        wx.showToast({ title: '你拒绝了通知，将无法收到新订单提醒', icon: 'none' });
      }
    },
    fail: (err) => {
      console.error('订阅消息调用失败', err);
      wx.showToast({ title: '调用订阅失败，请稍后重试', icon: 'none' });
    }
  });
} ,
  //以上代码为提醒商家消息版本增加，以下从云数据库加载菜品

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.loadDishes();
    wx.stopPullDownRefresh();
  },

  // 跳转到新增菜品页
  goAddDish() {
    wx.navigateTo({ url: '/pages/addDish/addDish' });
  },

  // 删除菜品
  deleteDish(e) {
    const dishId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除该菜品吗？',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database();
          db.collection('dishes').doc(dishId).remove()
            .then(() => {
              wx.showToast({ title: '已删除', icon: 'success' });
              this.loadDishes();
            })
            .catch(err => {
              console.error('删除失败', err);
              wx.showToast({ title: '删除失败', icon: 'none' });
            });
        }
      }
    });
  },

  // 退出商家登录
  logout() {
    wx.showModal({
      title: '退出商家',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.clearMerchantLogin();
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  }
});