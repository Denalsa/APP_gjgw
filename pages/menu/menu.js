// pages/menu/menu.js
const app = getApp();

Page({
  data: {
    categories: ['炒菜', '炖菜', '凉菜', '烧菜', '一人食', '融合菜'],
    activeCategory: '炒菜',        // ★ 统一用这个名字
    dishes: [],
    currentDishes: [],
    hotImages: [],
    loading: true,
    cartCount: 0,
    cartTotal: 0,
    searchKeyword: ''
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
        const cloudFiles = allDishes
          .filter(d => d.image && d.image.startsWith('cloud://'))
          .map(d => d.image);

        const finish = (list) => {
          this.setData({ dishes: list, loading: false });
          this.filterDishes();
          this.initHotImages();
        };

        if (cloudFiles.length > 0) {
          wx.cloud.getTempFileURL({
            fileList: cloudFiles,
            success: (imgRes) => {
              const map = {};
              imgRes.fileList.forEach(f => map[f.fileID] = f.tempFileURL);
              allDishes.forEach(d => { if (d.image && map[d.image]) d.image = map[d.image]; });
              finish(allDishes);
            },
            fail: () => finish(allDishes)
          });
        } else {
          finish(allDishes);
        }
      })
      .catch(() => {
        wx.showToast({ title: '加载菜品失败', icon: 'none' });
        this.setData({ loading: false });
      });
  },

  // ★ 合并后的筛选函数（支持搜索 + 分类）
  filterDishes() {
    const { dishes, activeCategory, searchKeyword } = this.data;
    let result = dishes;

    if (searchKeyword) {
      // 有搜索词：全局搜索（菜名、食材、描述）
      const kw = searchKeyword.toLowerCase();
      result = result.filter(d => {
        const matchName = d.name && d.name.toLowerCase().includes(kw);

        let matchIngredients = false;
        if (d.ingredients) {
          if (Array.isArray(d.ingredients)) {
            matchIngredients = d.ingredients.some(i => i.toLowerCase().includes(kw));
          } else if (typeof d.ingredients === 'string') {
            matchIngredients = d.ingredients.toLowerCase().includes(kw);
          }
        }

        const matchDesc = d.description && d.description.toLowerCase().includes(kw);
        return matchName || matchIngredients || matchDesc;
      });
    } else {
      // 无搜索词：按分类筛选
      result = result.filter(d => d.category === activeCategory);
    }

    this.setData({ currentDishes: result });
  },

  // 热门推荐
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
    const id = e.currentTarget.dataset.id;
    this.setData({
      activeCategory: id,
      searchKeyword: ''
    }, () => {
      this.filterDishes();
    });
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value.trim() }, () => {
      this.filterDishes();
    });
  },

  // 清空搜索
  clearSearch() {
    this.setData({ searchKeyword: '' }, () => {
      this.filterDishes();
    });
  },

  // 打开详情
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

  // 购物车信息
  refreshCartInfo() {
    const cart = app.globalData.cart || [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const total = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    this.setData({ cartCount: count, cartTotal: total.toFixed(2) });
  },

  // 底部导航
  goMenu() {},
  goProfile() {
    wx.navigateTo({ url: '/pages/login/login' });
  },
  

  openCart() {
    wx.navigateTo({ url: '/pages/cart/cart' });
  }
});