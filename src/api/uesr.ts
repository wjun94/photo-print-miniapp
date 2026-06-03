import request from './request';

/** 绑定上级接口 */
export const bindInviter = (data) => {
  return request<null>({
    url: `/bind`,
    method: 'POST',
    data,
    showErrorToast: false,
  });
};
