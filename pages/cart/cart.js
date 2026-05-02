const app = getApp();

Page({
  data: {
    cart: [],
    total: 0
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const cart = app.globalData.cart.map((item) => ({ ...item }));
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.setData({ cart, total });
  },

  changeQty(e) {
    const { id, delta } = e.currentTarget.dataset;
    const current = app.globalData.cart.find((item) => item.id === id);
    if (!current) return;
    const next = current.quantity + Number(delta);
    app.updateCartQuantity(id, next);
    this.refresh();
  },

  goOrder() {
    if (!this.data.cart.length) {
      wx.showToast({ title: '购物车为空', icon: 'none' });
      return;
    }
    // ✅ 跳转前将购物车数据临时锁定在 globalData 里
    const app = getApp();
    wx.setStorageSync('order_cart', this.data.cart);
    console.log('跳转前存储缓存:', wx.getStorageSync('order_cart'));
    wx.navigateTo({ url: '/pages/order/order' });
  }
});
