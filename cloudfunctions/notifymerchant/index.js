// cloudfunctions/notifymerchant/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 请在微信公众平台申请“新订单提醒”模板，替换此ID   
//https://mp.weixin.qq.com/wxamp/newtmpl/mytmpl?token=1695692090&lang=zh_CN
const TEMPLATE_ID = 'Ui42b4ts_Z8uXJfIc5urZFwCP1SNV3J6KpphONj4kTY';

exports.main = async (event, context) => {
  const { orderInfo } = event; // { dishes, total, createTime, note }

  // 查询所有订阅了消息的商家
  const merchantsRes = await db.collection('merchants')
    .where({ subscribed: true })
    .get();

  if (merchantsRes.data.length === 0) {
    return { success: false, message: '暂无商家订阅' };
  }

  // 组装模板消息数据
  const now = new Date(orderInfo.createTime || Date.now());
  const timeStr = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
  const dishNames = orderInfo.dishes.map(d => `${d.name}x${d.quantity}`).join('、');
  
  const msgData = {
    thing1: { value: dishNames.substring(0, 20) },      // 菜品摘要
    amount2: { value: `¥${orderInfo.total}` },          // 订单金额
    time3: { value: timeStr },                          // 下单时间
    thing4: { value: orderInfo.note || '无备注' }       // 备注
  };

  // 并发发送给所有订阅商家
  const sendPromises = merchantsRes.data.map(merchant => {
    return cloud.openapi.subscribeMessage.send({
      touser: merchant.openid,
      templateId: TEMPLATE_ID,
      data: msgData,
      miniprogramState: 'developer' // 开发中暂用developer，发布后改formal
    });
  });

  try {
    await Promise.all(sendPromises);
    return { success: true };
  } catch (err) {
    console.error('发送订阅消息失败', err);
    return { success: false, error: err.message };
  }
};

// 在 cloudfunctions/notifyMerchant/index.js 中添加日志
console.log('--- notifyMerchant start ---');
console.log('接收到的订单信息:', orderInfo);
console.log('查询到的商家数量:', merchantsRes.data.length);
console.log('发送结果:', sendResults);
console.log('--- notifyMerchant end ---');