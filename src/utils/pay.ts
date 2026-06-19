import { payOrder } from '@/api/order';
import Taro from '@tarojs/taro';

/** 发起微信订单支付 */
export const launchOrderPayment = async (orderId: string) => {
  return new Promise(async (resolve, reject) => {
    const payData: any = await payOrder({ orderId });
    await Taro.requestPayment({
      timeStamp: payData.timeStamp,
      nonceStr: payData.nonceStr,
      package: payData.package,
      signType: payData.signType,
      paySign: payData.paySign,
      success() {
        Taro.showToast({ title: '支付成功' });
        resolve(true);
      },
      fail(res) {
        console.log('支付失败', res);
        reject(false);
      },
    });
  });
};
