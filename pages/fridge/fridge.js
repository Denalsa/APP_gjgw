// pages/fridge/fridge.js
const app = getApp();

// 食材分类配置
const CATEGORIES = [
  { id: 'meat', name: '肉类', icon: '🥩', freshDays: 2, urgentDays: 7 },
  { id: 'vegetable', name: '蔬菜', icon: '🥬', freshDays: 2, urgentDays: 3 },
  { id: 'staple', name: '淀粉主食', icon: '🍚', freshDays: 3, urgentDays: 5 },
  { id: 'fruit', name: '水果', icon: '🍎', freshDays: 3, urgentDays: 5 },
  { id: 'dry', name: '干货半成品', icon: '📦', freshDays: 30, urgentDays: 90 }
];

Page({
  data: {
    categories: CATEGORIES,
    activeCategory: 'vegetable', // 默认展示蔬菜
    ingredients: [],
    currentIngredients: [],
    urgentCount: 0,
    loading: true,
    // 弹窗相关
    showModal: false,
    modalTitle: '',
    modalType: 'add', // 'add' | 'edit'
    editId: '',
    formData: {
      name: '',
      category: 'vegetable',
      storageDate: ''
    },
    // 新增分类
    showCategoryModal: false,
    newCategoryName: ''
  },

  onLoad() {
    // 校验是否为管理员/商家
    if (app.globalData.userRole !== 'merchant') {
      wx.showToast({ title: '请先登录商家账号', icon: 'none' });
      setTimeout(() => { wx.reLaunch({ url: '/pages/login/login' }); }, 1500);
      return;
    }
    this.loadIngredients();
  },

  onShow() {
    if (app.globalData.userRole !== 'merchant') return;
    this.loadIngredients();
  },

  // 从云数据库加载所有食材
  loadIngredients() {
    const db = wx.cloud.database();
    this.setData({ loading: true });
    db.collection('ingredients')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        const allIngredients = res.data;
        // 计算每种食材的存储时长和状态
        const processed = allIngredients.map(item => {
          const storageDate = new Date(item.storageDate);
          const now = new Date();
          const days = Math.floor((now - storageDate) / (1000 * 60 * 60 * 24));
          const category = CATEGORIES.find(c => c.id === item.category);
          let status = 'fresh';
          let statusText = '新鲜';
          let statusClass = 'tag-fresh';
          if (category) {
            if (days >= category.urgentDays) {
              status = 'urgent';
              statusText = '急需处理';
              statusClass = 'tag-urgent';
            } else if (days < category.freshDays) {
              status = 'fresh';
              statusText = '新鲜';
              statusClass = 'tag-fresh';
            } else {
              status = 'normal';
              statusText = '正常';
              statusClass = 'tag-normal';
            }
          }
          return {
            ...item,
            days,
            status,
            statusText,
            statusClass,
            categoryName: category ? category.name : '未分类'
          };
        });

        // 统计急需处理的食材数量（肉类>7天，蔬菜>3天，半成品>3个月）
        const urgentCount = processed.filter(item => item.status === 'urgent').length;

        this.setData({
          ingredients: processed,
          urgentCount,
          loading: false
        });
        this.filterByCategory();
      })
      .catch(err => {
        console.error('加载食材失败', err);
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ loading: false });
      });
  },

  // 根据当前分类筛选
  filterByCategory() {
    const { ingredients, activeCategory } = this.data;
    const current = ingredients.filter(item => item.category === activeCategory);
    this.setData({ currentIngredients: current });
  },

  // 切换分类
  switchCategory(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ activeCategory: id }, () => {
      this.filterByCategory();
    });
  },

  // 打开新增弹窗
  openAddModal() {
    this.setData({
      showModal: true,
      modalTitle: '新增食材',
      modalType: 'add',
      editId: '',
      formData: {
        name: '',
        category: this.data.activeCategory,
        storageDate: this.getToday()
      }
    });
  },

  // 打开编辑弹窗
  openEditModal(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      showModal: true,
      modalTitle: '编辑食材',
      modalType: 'edit',
      editId: item._id,
      formData: {
        name: item.name,
        category: item.category,
        storageDate: item.storageDate
      }
    });
  },

  // 获取今天日期字符串
  getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 表单输入
  onInputName(e) { this.setData({ 'formData.name': e.detail.value }); },
  onInputCategory(e) {
    const index = Number(e.detail.value);
    this.setData({ 'formData.category': CATEGORIES[index].id });
  },
  onDateChange(e) { this.setData({ 'formData.storageDate': e.detail.value }); },

  // 保存食材（新增或编辑）
  saveIngredient() {
    const { formData, modalType, editId } = this.data;
    if (!formData.name.trim()) {
      wx.showToast({ title: '请输入食材名称', icon: 'none' });
      return;
    }
    if (!formData.storageDate) {
      wx.showToast({ title: '请选择入库日期', icon: 'none' });
      return;
    }

    const db = wx.cloud.database();
    wx.showLoading({ title: '保存中...' });

    if (modalType === 'add') {
      db.collection('ingredients').add({
        data: {
          name: formData.name.trim(),
          category: formData.category,
          storageDate: formData.storageDate,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      }).then(() => {
        wx.hideLoading();
        wx.showToast({ title: '添加成功', icon: 'success' });
        this.setData({ showModal: false });
        this.loadIngredients();
      }).catch(err => {
        wx.hideLoading();
        console.error('添加失败', err);
        wx.showToast({ title: '添加失败', icon: 'none' });
      });
    } else {
      db.collection('ingredients').doc(editId).update({
        data: {
          name: formData.name.trim(),
          category: formData.category,
          storageDate: formData.storageDate,
          updateTime: db.serverDate()
        }
      }).then(() => {
        wx.hideLoading();
        wx.showToast({ title: '修改成功', icon: 'success' });
        this.setData({ showModal: false });
        this.loadIngredients();
      }).catch(err => {
        wx.hideLoading();
        console.error('修改失败', err);
        wx.showToast({ title: '修改失败', icon: 'none' });
      });
    }
  },

  // 删除食材
  deleteIngredient(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除该食材吗？',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database();
          db.collection('ingredients').doc(id).remove()
            .then(() => {
              wx.showToast({ title: '已删除', icon: 'success' });
              this.loadIngredients();
            })
            .catch(err => {
              console.error('删除失败', err);
              wx.showToast({ title: '删除失败', icon: 'none' });
            });
        }
      }
    });
  },

  // 关闭弹窗
  closeModal() { this.setData({ showModal: false }); },

  // 返回商家后台
  goBack() { wx.navigateBack(); }
});