const app = getApp();

Page({
  data: {
    cart: [],
    total: 0,
    note: '',
    latestOrder: null,
    orderSubmitted: false,   // 新增：标记是否已提交
    orderId: ''              // 新增：云函数返回的订单ID
  },

  onShow() {
    if (!this.data.orderSubmitted) {
      this.refreshCart();
    }
  },

refreshCart() {
  //console.log('order页onShow，当前缓存:', wx.getStorageSync('order_cart'));
  const app = getApp();
  // 优先从缓存取，没有则从全局取
  let cart = wx.getStorageSync('order_cart') || [];
  if (cart.length === 0) {
    // 缓存没有，尝试从全局拿（兼容直接打开订单页的场景）
    cart = app.globalData.cart.map(item => ({ ...item }));
  }
  
  // 关键：先不清除缓存，留着等提交成功再清（或用户离开时）
  // wx.removeStorageSync('order_cart');  <-- 注释掉或移到后面

  if (cart.length === 0) {
    wx.showToast({ title: '购物车为空', icon: 'none' });
    wx.showToast({ title: '购物车为空，请重新添加', icon: 'none' });
    return;
  }
  
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  this.setData({ cart, total });
},

  onInputNote(e) {
    this.setData({ note: e.detail.value });
  },

  submitOrder() {
    const cart = this.data.cart;
    if (!cart || cart.length === 0) {
      wx.showToast({ title: '购物车为空', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中...' });

    wx.cloud.callFunction({
      name: 'createorder',       // ← 注意你仓库里的实际目录名
      data: {
        cart: cart,
        note: this.data.note || ''
      }
    }).then(res => {
      wx.hideLoading();
      wx.showToast({ title: '下单成功' });
      app.clearCart();
      wx.removeStorageSync('order_cart');

      // ★ 调用 notifyMerchant
      const orderInfo = {
        dishes: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
        total: this.data.total,
        createTime: Date.now(),
        note: this.data.note || ''
      };
      wx.cloud.callFunction({
        name: 'notifymerchant',  
        // ★ 仓库里叫 notifymerchant
        data: { orderInfo }
      }).then(() => console.log('通知商家成功'))
        .catch(err => console.warn('通知商家失败', err));

      this.setData({ orderSubmitted: true, orderId: res.result.orderId || '' });
    }).catch(err => {
      wx.hideLoading();
      console.error('下单失败', err);
      wx.showToast({ title: '下单失败，请重试', icon: 'error' });
    });
}

,
// 返回首页
goHome() {
  wx.reLaunch({ url: '/pages/index/index' });  // 重启回首页，避免页面栈残留
},

// 图片加载失败时使用默认图（可选）
onImageError(e) {
  const index = e.currentTarget.dataset.index;
  const cart = this.data.cart;
  cart[index].image = '/images/default-food.png';
  this.setData({ cart });
}
});
