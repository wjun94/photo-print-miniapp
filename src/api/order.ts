import request from "./request";

/** 订单列表 */
export const orderList = (data) => {
  return request<ORDER.CreateItem[]>({
    url: '/orders/wx',
    method: 'GET',
    data: data as ORDER.CreateReq
  })
};

/** 创建订单 */
export const createOrder = (data) => {
  return request<{ id: number }>({
    url: '/orders',
    method: 'POST',
    data: data as ORDER.CreateReq
  })
};
