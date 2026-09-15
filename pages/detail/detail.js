// pages/detail/detail.js
const app = getApp();

Page({
  data: {
    dish: null,
    loading: true
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
  
    wx.previewImage({
      current: url,      // 当前显示图片的链接
      urls: [url]        // 需要预览的图片链接列表（这里只预览当前一张）
    });
  },


  onLoad(options) {
    const dishId = options.id;
    if (!dishId) {
      wx.showToast({ title: '菜品不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.loadDish(dishId);
  },

  // 从云数据库获取菜品详情
  loadDish(dishId) {
    const db = wx.cloud.database();
    this.setData({ loading: true });

    db.collection('dishes')
      .doc(dishId)
      .get()
      .then(res => {
        const dish = res.data;
        if (!dish) {
          wx.showToast({ title: '菜品不存在', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 1500);
          return;
        }

        // 转换 cloud:// 图片为临时链接
        if (dish.image && dish.image.startsWith('cloud://')) {
          wx.cloud.getTempFileURL({
            fileList: [dish.image],
            success: (imgRes) => {
              if (imgRes.fileList.length > 0) {
                dish.image = imgRes.fileList[0].tempFileURL;
              }
              this.setData({ dish, loading: false });
            },
            fail: () => {
              this.setData({ dish, loading: false });
            }
          });
        } else {
          this.setData({ dish, loading: false });
        }
      })
      .catch(err => {
        console.error('获取菜品详情失败', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ loading: false });
      });
  },

  // 加入购物车
  addDish() {
    const { dish } = this.data;
    if (!dish) return;
    app.addToCart(dish);
    wx.showToast({ title: '已加入购物车', icon: 'success' });
  }
});