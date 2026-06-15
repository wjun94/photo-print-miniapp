import request from './request';

/** 订单列表 */
export const orderList = (data) => {
  return request<{ list: ORDER.Item[] }>({
    url: '/order/list',
    method: 'GET',
    data,
  });
};

/** 创建订单 */
export const createOrder = (data) => {
  return request<{ id: number }>({
    url: '/order',
    method: 'POST',
    data,
  });
};

/** 订单支付 */
export const payOrder = (data: { orderId: string }) => {
  return request<{ id: number }>({
    url: '/pay/order',
    method: 'POST',
    data,
  });
};

/** 取消订单 */
export const cancelOrder = (data) => {
  return request<null>({
    url: '/order/cancel',
    method: 'POST',
    data,
  });
};

/** 确认收货 */
export const confirmOrder = (data) => {
  return request<null>({
    url: '/order/confirm',
    method: 'POST',
    data,
  });
};

/** 支付成功 */
export const paySuccess = (data) => {
  return request<null>({
    url: '/order/pay/success',
    method: 'POST',
    data,
  });
};

/** 订单详情 */
export const getOrder = (id) => {
  return request({
    url: `/order/${id}`,
    method: 'GET',
  });
};

/** 确认订单页面预览（获取商品信息、默认地址） */
export const orderPreview = (data) => {
  return request<any>({
    url: '/order/preview',
    method: 'POST',
    data,
  });
};

/** 提交订单 */
export const orderSubmit = (data) => {
  return request<any>({
    url: '/order/submit',
    method: 'POST',
    data,
  });
};
