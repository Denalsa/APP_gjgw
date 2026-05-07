// pages/merchant/merchant.js
const app = getApp();

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
  wx.requestSubscribeMessage({
    tmplIds: ['你的模板ID'], // 替换为实际模板ID
    success: (res) => {
      if (res['你的模板ID'] === 'accept') {
        // 更新数据库中的订阅状态
        const db = wx.cloud.database();
        db.collection('merchants').where({ openid: app.globalData.openid }).update({
          data: { subscribed: true }
        }).then(() => {
          this.setData({ subscribed: true });
          wx.showToast({ title: '已开启接单提醒', icon: 'success' });
        });
      }
    },
    fail: (err) => {
      console.error('订阅失败', err);
      wx.showToast({ title: '订阅失败', icon: 'none' });
    }
  });
},
//以上代码为提醒商家消息版本增加











  // 从云数据库加载菜品
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