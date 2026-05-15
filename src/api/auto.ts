import request from "./request";

/** 小程序静默登录 */
export const wxLogin = (data) => {
  return request<AUTH.LoginResponse>({
    url: "/wx/login",
    method: "POST",
    data,
    showLoading: false,
  });
};
