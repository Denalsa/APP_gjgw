App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
      //新增 onLaunch 生命周期，调用 wx.cloud.init 初始化云开发环境，使小程序能够使用云存储和云数据库能力。
    } else {
      wx.cloud.init({
        env: 'prod-d6girqehu56c8172c', // 替换为你的云环境ID
        traceUser: true
      });
    }
  },
  globalData: {
    cart: [],
    orders: []
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
  },

  createOrder(note = '') {
    const timestamp = Date.now();
    const cartSnapshot = this.globalData.cart.map((item) => ({ ...item }));
    const totalPrice = cartSnapshot.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = {
      id: `ORD-${timestamp}`,
      items: cartSnapshot,
      totalPrice,
      note,
      createdAt: timestamp,
      merchantStatus: '已发送到商家'
    };

    this.globalData.orders.unshift(order);
    this.clearCart();
    return order;
  }
});
