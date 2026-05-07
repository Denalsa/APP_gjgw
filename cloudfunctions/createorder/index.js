const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { cart, note } = event;
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  try {
    const res = await db.collection('orders').add({
      data: {
        cart,
        note: note || '',
        total,
        createTime: new Date(),
        openid: cloud.getWXContext().OPENID
      }
    });
    return { 
      success: true, 
      orderId: res._id,
      orderInfo: {
        dishes: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
        total,
        createTime: Date.now(),
        note: note || ''
      }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
};