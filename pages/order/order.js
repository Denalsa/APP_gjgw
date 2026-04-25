const app = getApp();

Page({
  data: {
    cart: [],
    total: 0,
    note: '',
    latestOrder: null
  },

  onShow() {
    this.refreshCart();
  },

  refreshCart() {
    const cart = app.globalData.cart.map((item) => ({ ...item }));
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.setData({ cart, total });
  },

  onInputNote(e) {
    this.setData({ note: e.detail.value });
  },

  submitOrder() {
    if (!this.data.cart.length) {
      wx.showToast({ title: '暂无可下单菜品', icon: 'none' });
      return;
    }
    const order = app.createOrder(this.data.note);
    this.setData({ latestOrder: order, cart: [], total: 0 });
    wx.showToast({ title: '下单成功', icon: 'success' });
  }
});
