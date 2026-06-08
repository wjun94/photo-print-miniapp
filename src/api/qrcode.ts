import request from './request';

/** 获取商务合作和交流群二维码URL */
export const getQrcodes = (data) => {
  return request<{ businessQrcode: string }>({
    url: `/qrcodes`,
    method: 'GET',
    data,
    showErrorToast: false,
  });
};
