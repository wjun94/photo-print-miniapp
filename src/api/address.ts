import request from "./request";

/** 获取我的地址列表 */
export const getAddressList = () => {
  return request<ADDRESS.Items[]>({ url: '/address/list' })
};

/** 设为默认地址 */
export const setAddressDefault = (id) => {
  return request<null>({ url: `/address/${id}/default`, method: 'PUT' })
};

/** 删除地址 */
export const addressDelete = (id) => {
  return request<null>({ url: `/address/${id}`, method: 'DELETE' })
};

/** 获取地址信息 */
export const getAddressDetail = (id) => {
  return request<ADDRESS.Items>({ url: `/address/${id}`, method: 'GET' })
};

/** 更新地址信息 */
export const updateAddress = (id, data) => {
  return request<null>({ url: `/address/${id}`, method: 'PUT', data })
};

/** 新建地址信息 */
export const createAddress = (data) => {
  return request<null>({ url: `/address`, method: 'POST', data })
};

/** 获取省市区 */
export const getRegionsAll = () => {
  return request<any>({ url: '/regions/all' })
};