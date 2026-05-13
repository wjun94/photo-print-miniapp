import request from "./request";

export const wxLogin = (data) => {
  return request<AUTH.LoginResponse>({
    url: "/wx/login",
    method: "POST",
    data,
    showLoading: false,
  });
};
