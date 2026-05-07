// pages/menu/menu.js
Page({
  data: {
    categories: ['炒菜', '炖菜', '蒸菜', '煲汤', '面包', '蛋糕', '西餐正餐'],
    activeCategory: '炒菜',
    dishes: [],
    loading: true
  },

  onLoad() {
    this.loadDishes();
  },

  onShow() {
    this.loadDishes();
  },

  // ★ 从云数据库加载菜品
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
            },
            fail: () => this.setData({ dishes: allDishes, loading: false })
          });
        } else {
          this.setData({ dishes: allDishes, loading: false });
        }
      })
      .catch(() => {
        wx.showToast({ title: '加载菜品失败', icon: 'none' });
        this.setData({ loading: false });
      });
  },

  // 切换分类
  switchCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.category });
  },

  // 查看详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  // 加入购物车
  addToCart(e) {
    const dish = e.currentTarget.dataset.dish;
    const app = getApp();
    app.addToCart(dish);
    this.refreshCartInfo();
    wx.showToast({ title: '已加入购物车', icon: 'success' });
  },

  // 去购物车
  goCart() {
    wx.switchTab({ url: '/pages/cart/cart' });
  }
});