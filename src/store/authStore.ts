import { create } from "zustand";
import Taro from "@tarojs/taro";
import request from "@/api/request";

interface AuthState {
  token: string | null;
  userId: number | null;
  userInfo: USER.Info | null; // 新增
  setToken: (token: string) => void;
  setUserId: (id: number) => void;
  setUserInfo: (info: USER.Info | null) => void; // 新增
  fetchUserInfo: () => Promise<void>; // 新增
  logout: () => void;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: Taro.getStorageSync("token") || null,
  userId: Taro.getStorageSync("userId") || null,
  userInfo: null, // 不持久化，每次启动重新获取

  setToken: (token) => {
    Taro.setStorageSync("token", token);
    set({ token });
  },

  setUserId: (id) => {
    Taro.setStorageSync("userId", id);
    set({ userId: id });
  },

  setUserInfo: (info) => set({ userInfo: info }),

  fetchUserInfo: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const userInfo = await request<USER.Info>({
        url: "/user/info",
        method: "GET",
        showLoading: false,
      });
      set({ userInfo });
    } catch (err) {
      console.error("获取用户信息失败", err);
      // 可选：如果接口返回401（token失效），则自动登出
      // 但 request 内部已处理 token 失效（会调用 logout 并重定向）
    }
  },

  logout: () => {
    Taro.removeStorageSync("token");
    set({ token: null, userId: null, userInfo: null });
    Taro.reLaunch({ url: "/pages/index/index" });
  },

  isLoggedIn: () => !!get().token,
}));
