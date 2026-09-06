// cloudfunctions/notifymerchant/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 请在微信公众平台申请“新订单提醒”模板，替换此ID   
//https://mp.weixin.qq.com/wxamp/newtmpl/mytmpl?token=1695692090&lang=zh_CN
const TEMPLATE_ID = 'Ui42b4ts_Z8uXJfIc5urZFwCP1SNV3J6KpphONj4kTY';

exports.main = async (event, context) => {
  console.log('--- notifyMerchant start ---');
  console.log('完整 event 对象:', JSON.stringify(event));
  try {
    const { orderInfo } = event;
    if (!orderInfo || !orderInfo.dishes || !orderInfo.total) {
      return { success: false, message: '订单信息不完整' };
    }
    //本次新加  是不是最大boss?就是最大boss
    const merchantOpenid = event.userInfo.openId;
    console.log('收到的 merchantOpenid:', merchantOpenid);
    // 查询所有已订阅的商家
    //const merchantsRes = await db.collection('merchants')
     // .where({ subscribed: true })
     // .get();

    //if (merchantsRes.data.length === 0) {
    //  return { success: false, message: '暂无商家订阅' };
    //}
    const merchantsRes = { data: [{ openid: merchantOpenid }] };
    const { dishes, total, createTime, note } = orderInfo;
    const now = new Date(createTime || Date.now());
    const timeStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
    const dishNames = dishes.map(d => `${d.name}x${d.quantity}`).join('、');

    const msgData = {
      thing2: { value: dishNames.substring(0, 20) },
      amount10: { value: `¥${total}` },
      time4: { value: timeStr },
      thing9: { value: note || '无备注' }
    };

    const sendResults = [];
    for (const merchant of merchantsRes.data) {
      if (!merchant.openid) continue;
      try {
        const res = await cloud.openapi.subscribeMessage.send({
          touser: merchant.openid,
          templateId: TEMPLATE_ID,
          page: 'pages/merchant/merchant',  // ← 点击消息跳转商家页
          data: msgData,
          miniprogramState: 'formal'  // 或根据环境动态判断
        });
        sendResults.push({ openid: merchant.openid, errCode: 0 });
      } catch (sendErr) {
        console.error('发送失败:', merchant.openid, sendErr);
        // 如果是 43101（用户拒绝/未订阅），重置数据库状态
        if (sendErr.errCode === 43101) {
          await db.collection('merchants').doc(merchant._id).update({
            data: { subscribed: false }
          });
        }
        sendResults.push({ 
          openid: merchant.openid, 
          errCode: sendErr.errCode || -1, 
          errMsg: sendErr.errMsg || sendErr.message 
        });
      }
    }

    console.log('发送结果:', JSON.stringify(sendResults));
    console.log('--- notifyMerchant end ---');
    return { success: true, sendResults };
  } catch (err) {
    console.error('云函数执行出错:', err);
    return { success: false, error: err.message || 'unknown error' };
  }
};