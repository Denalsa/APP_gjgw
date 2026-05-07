App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
      //新增 onLaunch 生命周期，调用 wx.cloud.init 初始化云开发环境，使小程序能够使用云存储和云数据库能力。
    } else {
      wx.cloud.init({
        env: 'cloud1-d9gw4slrf8bc6bd35', // 替换为你的云环境ID prod-d6girqehu56c8172c         cloud1-d9gw4slrf8bc6bd35
        traceUser: true
      });
    }
    // 读取本地缓存中的角色信息 
    const userRole = wx.getStorageSync('userRole') || '';
    const merchantInfo = wx.getStorageSync('merchantInfo') || null;
    this.globalData.userRole = userRole;
    this.globalData.merchantInfo = merchantInfo;
  
  },
  globalData: {
    cart: [],
    orders: [],
    userRole: '',          // 'customer' | 'merchant'
    openid: '',
    merchantInfo: null     // 商家信息
  },
  // 设置用户角色
  setUserRole(role, info) {
    this.globalData.userRole = role;
    this.globalData.merchantInfo = info;
    wx.setStorageSync('userRole', role);
    if (info) {
      wx.setStorageSync('merchantInfo', info);
    }
  },

  // 退出商家登录
  clearMerchantLogin() {
    this.globalData.userRole = '';
    this.globalData.merchantInfo = null;
    wx.removeStorageSync('userRole');
    wx.removeStorageSync('merchantInfo');
  },

  addToCart(dish) {
    const existing = this.globalData.cart.find((item) => item.id === dish.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.globalData.cart.push({ ...dish, quantity: 1 });
    }
  },

  updateCartQuantity(id, quantity) {
    this.globalData.cart = this.globalData.cart
      .map((item) => (item.id === id ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);
  },

  clearCart() {
    this.globalData.cart = [];
  }
});
