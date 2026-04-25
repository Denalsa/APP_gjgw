const { dishCategories, getHotDishImages } = require('../../utils/data');
const app = getApp();

Page({
  data: {
    categories: [],
    activeCategoryId: '',
    currentDishes: [],
    hotImages: [],
    cartCount: 0,
    cartTotal: 0
  },

  onLoad() {
    const categories = dishCategories.map((cat) => ({ id: cat.id, name: cat.name }));
    const activeCategoryId = categories[0]?.id || '';
    this.setData({
      categories,
      activeCategoryId,
      hotImages: getHotDishImages()
    });
    this.updateDishList(activeCategoryId);
  },

  onShow() {
    this.refreshCartInfo();
  },

  updateDishList(categoryId) {
    const found = dishCategories.find((cat) => cat.id === categoryId);
    this.setData({
      currentDishes: found ? found.dishes : []
    });
  },

  switchCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({ activeCategoryId: categoryId });
    this.updateDishList(categoryId);
  },

  addDish(e) {
    const dish = e.currentTarget.dataset.dish;
    app.addToCart(dish);
    this.refreshCartInfo();
    wx.showToast({ title: '已加入购物车', icon: 'success' });
  },

  openDetail(e) {
    wx.navigateTo({
      url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}`
    });
  },

  openCart() {
    wx.navigateTo({ url: '/pages/cart/cart' });
  },

  refreshCartInfo() {
    const cart = app.globalData.cart;
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.setData({ cartCount, cartTotal });
  }
});
