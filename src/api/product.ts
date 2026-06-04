import request from "./request";

/** 订单列表 */
export const products = (data) => {
  return request<{ list: ORDER.Item[] }>({
    url: "/products",
    method: "GET",
    data: data as ORDER.CreateReq,
  });
};

/** 订单详情 */
export const getProducts = (id) => {
  return request<PRODUCT.Detail>({
    url: `/products/${id}`,
    method: "GET",
  });
};
