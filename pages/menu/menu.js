// pages/menu/menu.js
const app = getApp();

Page({
  data: {
    categories: [
      { id: 1, name: '炒菜' },
      { id: 2, name: '炖菜' },
      { id: 3, name: '蒸菜' },
      { id: 4, name: '煲汤' },
      { id: 5, name: '面包' },
      { id: 6, name: '蛋糕' },
      { id: 7, name: '西餐正餐' }
    ],
    activeCategoryId: 1,       // 默认显示“炒菜”
    dishes: [],                // 所有菜品（从云数据库加载）
    currentDishes: [],         // 当前分类的菜品
    hotImages: [],             // 热门推荐图片（取前几个菜品）
    loading: true,
    cartCount: 0,
    cartTotal: 0
  },

  onLoad() {
    this.loadDishes();
  },

  onShow() {
    this.loadDishes();
    this.refreshCartInfo();
  },

  // 从云数据库加载所有菜品
  loadDishes() {
    const db = wx.cloud.database();
    this.setData({ loading: true });
    db.collection('dishes')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        const allDishes = res.data;
        // 转换 cloud:// 图片为临时链接
        const cloudFiles = allDishes
          .filter(d => d.image && d.image.startsWith('cloud://'))
          .map(d => d.image);
        if (cloudFiles.length > 0) {
          wx.cloud.getTempFileURL({
            fileList: cloudFiles,
            success: (imgRes) => {
              const map = {};
              imgRes.fileList.forEach(f => map[f.fileID] = f.tempFileURL);
              allDishes.forEach(d => { if (d.image && map[d.image]) d.image = map[d.image]; });
              this.setData({ dishes: allDishes, loading: false });
              this.filterDishes();
              this.initHotImages();
            },
            fail: () => {
              this.setData({ dishes: allDishes, loading: false });
              this.filterDishes();
              this.initHotImages();
            }
          });
        } else {
          this.setData({ dishes: allDishes, loading: false });
          this.filterDishes();
          this.initHotImages();
        }
      })
      .catch(() => {
        wx.showToast({ title: '加载菜品失败', icon: 'none' });
        this.setData({ loading: false });
      });
  },

  // 根据当前分类筛选菜品
  filterDishes() {
    const { dishes, activeCategoryId, categories } = this.data;
    const categoryName = categories.find(c => c.id === activeCategoryId)?.name || '';
    const current = dishes.filter(d => d.category === categoryName);
    this.setData({ currentDishes: current });
  },

  // 设置热门推荐（取前 4 个菜品）
  initHotImages() {
    const top = this.data.dishes.slice(0, 4).map(d => ({
      id: d._id || d.id,
      image: d.image,
      name: d.name
    }));
    this.setData({ hotImages: top });
  },

  // 切换分类
  switchCategory(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (id === this.data.activeCategoryId) return;
    this.setData({ activeCategoryId: id }, () => {
      this.filterDishes();
    });
  },

  // 打开菜品详情（通过 data-id 传递）
  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  // 加入购物车
  addDish(e) {
    const dish = e.currentTarget.dataset.dish;
    if (!dish) return;
    app.addToCart(dish);
    this.refreshCartInfo();
    wx.showToast({ title: '已加入购物车', icon: 'success' });
  },

  // 更新底部购物车信息
  refreshCartInfo() {
    const cart = app.globalData.cart || [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const total = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    this.setData({ cartCount: count, cartTotal: total.toFixed(2) });
  },

  // 去购物车
  openCart() {
    // 若 cart 是 tabBar 页面请改用 wx.switchTab({ url: '/pages/cart/cart' })
    wx.navigateTo({ url: '/pages/cart/cart' });
  }
});