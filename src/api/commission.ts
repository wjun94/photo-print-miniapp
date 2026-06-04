import request from './request';

/** 佣金明细列表 */
export const getCommissionList = (data) => {
  return request<{ list: COMMISSION.Item[] }>({
    url: '/commission/list',
    method: 'GET',
    data,
  });
};

/** 获取邀请的好友列表 */
export const getFriendsList = (data) => {
  return request<{ list: COMMISSION.FriendItem[] }>({
    url: '/commission/friends',
    method: 'GET',
    data,
  });
};

/** 获取累计佣金 */
export const getCommissionTotal = (data) => {
  return request<{ totalCommission: number }>({
    url: '/commission/total',
    method: 'GET',
    data,
  });
};
