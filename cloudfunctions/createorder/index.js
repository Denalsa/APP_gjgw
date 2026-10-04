const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { cart, note } = event;
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  try {
    // ★ 1. 提取菜品ID并查询原材料
    const dishIds = cart.map(item => item._id || item.id).filter(Boolean);
    let ingredients = [];
    if (dishIds.length > 0) {
      const dishesRes = await db.collection('dishes')
        .where({ _id: db.command.in(dishIds) })
        .field({ ingredients: true })
        .get();
      // ★ 2. 提取并去重
      const all = dishesRes.data.flatMap(d => d.ingredients || []);
      ingredients = [...new Set(all)];
    }

    // 3. 创建订单
    const res = await db.collection('orders').add({
      data: {
        cart,
        note: note || '',
        total,
        createTime: new Date(),
        openid: cloud.getWXContext().OPENID
      }
    });

    // ★ 4. 必须把 ingredients 传给 notifymerchant
    return {
      success: true,
      orderId: res._id,
      orderInfo: {
        dishes: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
        total,
        createTime: Date.now(),
        note: note || '',
        ingredients: ingredients   // ★ 就是这行，千万别漏了
      }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
};