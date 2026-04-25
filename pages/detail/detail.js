const { getDishById } = require('../../utils/data');
const app = getApp();

Page({
  data: {
    dish: null
  },

  onLoad(options) {
    const dish = getDishById(options.id);
    this.setData({ dish });
  },

  addDish() {
    const { dish } = this.data;
    if (!dish) return;
    app.addToCart(dish);
    wx.showToast({ title: '已加入购物车', icon: 'success' });
  }
});
