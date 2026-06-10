import request from './request';

export interface Coupon {
  id: string;
  name: string;
  type: number;
  fullAmount: number;
  reduceAmount: number;
  discountRate: number;
  maxReduce: number;
  receiveStart: string;
  receiveEnd: string;
  desc: string;
}

/** 获取商品可领优惠券 */
export const getProductCoupons = (productId) => {
  return request({
    url: `/coupon/product/${productId}`,
    method: 'GET',
  });
};

// 领取优惠券
export const receiveCoupon = (couponId: string, productId?: string) => {
  return request({
    url: '/wx/coupon/receive',
    method: 'POST',
    data: { couponId, productId },
  });
};
