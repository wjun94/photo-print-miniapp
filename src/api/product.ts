import request from "./request";

/** 订单列表 */
export const products = (data) => {
  return request<{ list: ORDER.List[] }>({
    url: "/products",
    method: "GET",
    data: data as ORDER.CreateReq,
  });
};