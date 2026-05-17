// pages/addDish/addDish.js
Page({
  data: {
    categories: ['炒菜', '炖菜', '蒸菜', '煲汤', '面包', '蛋糕', '西餐正餐'],
    categoryIndex: 0,
    name: '',
    price: '',
    stock: '',
    description: '',
    ingredients: '',
    imagePath: '',      // 云存储 fileID
    tempImage: '',      // 本地临时预览路径
    submitting: false
  },

  onLoad() {
    // 确保云开发已初始化
    if (!wx.cloud) {
      wx.showToast({ title: '云开发未初始化', icon: 'none' });
    }
  },

  // 分类选择
  onCategoryChange(e) {
    this.setData({ categoryIndex: Number(e.detail.value) });
  },

  // 输入事件
  onInputName(e) { this.setData({ name: e.detail.value }); },
  onInputPrice(e) { this.setData({ price: e.detail.value }); },
  onInputStock(e) { this.setData({ stock: e.detail.value }); },
  onInputDesc(e) { this.setData({ description: e.detail.value }); },
  onInputIngredients(e) { this.setData({ ingredients: e.detail.value }); },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        this.setData({ tempImage: tempPath });
        this.uploadImage(tempPath);
      },
      fail: (err) => {
        console.error('选择图片失败', err);
        // 用户取消不算错误
      }
    });
  },

  // 上传图片
  uploadImage(filePath) {
    wx.showLoading({ title: '上传中...' });
    const cloudPath = `dishes/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => {
        wx.hideLoading();
        this.setData({ imagePath: res.fileID });
        wx.showToast({ title: '图片已上传', icon: 'success' });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('上传失败', err);
        wx.showToast({ title: '图片上传失败', icon: 'none' });
        // 上传失败时清空临时预览，避免误导
        this.setData({ tempImage: '' });
      }
    });
  },

  // 表单校验
  validateForm() {
    const { name, price, stock, imagePath } = this.data;
    if (!name.trim()) {
      wx.showToast({ title: '请输入菜品名称', icon: 'none' });
      return false;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' });
      return false;
    }
    if (!stock || isNaN(Number(stock)) || Number(stock) < 0) {
      wx.showToast({ title: '请输入有效库存', icon: 'none' });
      return false;
    }
    if (!imagePath) {
      wx.showToast({ title: '请上传菜品图片', icon: 'none' });
      return false;
    }
    return true;
  },

  // 提交菜品
  submitDish() {
    if (!this.validateForm()) return;
    if (this.data.submitting) return;

    const { categories, categoryIndex, name, price, stock, description, ingredients, imagePath } = this.data;
    this.setData({ submitting: true });
    wx.showLoading({ title: '添加中...' });

    wx.cloud.database().collection('dishes').add({
      data: {
        name: name.trim(),
        category: categories[categoryIndex],
        price: Number(price),
        stock: Number(stock),
        description: description.trim(),
        ingredients: ingredients.split(/[,，、]+/).filter(Boolean),
        image: imagePath,
        createTime: wx.cloud.database().serverDate(),
        updateTime: wx.cloud.database().serverDate()
      }
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '添加成功', icon: 'success' });
      setTimeout(() => { wx.navigateBack(); }, 1200);
    }).catch(err => {
      wx.hideLoading();
      console.error('添加失败', err);
      wx.showToast({ title: '添加失败，请重试', icon: 'none' });
      this.setData({ submitting: false });
    });
  }
});