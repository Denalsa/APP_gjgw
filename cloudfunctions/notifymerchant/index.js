// cloudfunctions/notifymerchant/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const TEMPLATE_ID = 'Ui42b4ts_Z8uXJfIc5urZFwCP1SNV3J6KpphONj4kTY';

exports.main = async (event, context) => {
  console.log('--- notifyMerchant start ---');
  try {
    const { orderInfo } = event;
    if (!orderInfo || !orderInfo.dishes || !orderInfo.total) {
      return { success: false, message: '订单信息不完整' };
    }

    const merchantOpenid = event.userInfo.openId;
    const merchantsRes = { data: [{ openid: merchantOpenid }] };

    const { dishes, total, createTime, note, ingredients = [] } = orderInfo; // ★ 解构 ingredients

    // ★ 对比冰箱库存
    let needPrepare = [];      // 冰箱没有的
    let mayNeedPrepare = [];   // 冰箱已有的
    if (ingredients.length > 0) {
      const fridgeRes = await db.collection('ingredients').get();
      const fridgeNames = fridgeRes.data.map(item => item.name);
      ingredients.forEach(ing => {
        if (fridgeNames.includes(ing)) {
          mayNeedPrepare.push(ing);
        } else {
          needPrepare.push(ing);
        }
      });
    }

    // ★ 构建提示文本
    let prepTip = '';
    if (needPrepare.length > 0) {
      prepTip += `需采购：${needPrepare.join('、')}；`;
    }
    if (mayNeedPrepare.length > 0) {
      prepTip += `冰箱已有：${mayNeedPrepare.join('、')}`;
    }
    if (prepTip === '') prepTip = '无原材料信息';
    if (prepTip.length > 20) prepTip = prepTip.substring(0, 20) + '...';

    const now = new Date(createTime || Date.now());
    const timeStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
    const dishNames = dishes.map(d => `${d.name}x${d.quantity}`).join('、');

    const msgData = {
      thing2: { value: dishNames.substring(0, 20) },
      amount10: { value: `¥${total}` },
      time4: { value: timeStr },
      thing9: { value: prepTip }   // ★ 使用 prepTip 而非 note
    };

    const sendResults = [];
    for (const merchant of merchantsRes.data) {
      if (!merchant.openid) continue;
      try {
        await cloud.openapi.subscribeMessage.send({
          touser: merchant.openid,
          templateId: TEMPLATE_ID,
          page: 'pages/merchant/merchant',
          data: msgData,
          miniprogramState: 'formal'
        });
        sendResults.push({ openid: merchant.openid, errCode: 0 });
      } catch (sendErr) {
        console.error('发送失败:', merchant.openid, sendErr);
        if (sendErr.errCode === 43101) {
          await db.collection('merchants').doc(merchant._id).update({ data: { subscribed: false } });
        }
        sendResults.push({ openid: merchant.openid, errCode: sendErr.errCode || -1, errMsg: sendErr.errMsg || sendErr.message });
      }
    }
    console.log('发送结果:', JSON.stringify(sendResults));
    console.log('--- notifyMerchant end ---');
    return { success: true, sendResults, needPrepare, mayNeedPrepare };
  } catch (err) {
    console.error('云函数执行出错:', err);
    return { success: false, error: err.message || 'unknown error' };
  }
};