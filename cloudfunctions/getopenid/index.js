// cloudfunctions/getOpenid/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 商家密码（可在云函数环境变量中配置，这里直接用常量示例）
// 实际生产建议使用更安全的方式
const MERCHANT_PASSWORD = '123456';

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { password } = event;

  // Step 1: 校验密码（需要与商家在云数据库中的密码匹配）
  try {
    const merchantRes = await db.collection('merchants')
      .where({ password })
      .get();
    
    if (merchantRes.data.length > 0) {
      // 密码匹配，获取商家信息
      const merchant = merchantRes.data[0];
      await db.collection('merchants').doc(merchant._id).update({
        data: { openid }
      });

      return {
        success: true,
        openid,
        merchantInfo: {
          name: merchant.name || '商家',
          merchantId: merchant._id
        }
      };
    }

    // 密码不匹配
    return {success: false,message: '密码错误',openid};
  } 
  catch (err) {
    console.error('查询商家失败', err);
    return {
      success: false,
      message: '验证失败',
      openid
    };
  }
};