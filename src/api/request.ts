import Taro from "@tarojs/taro";
import { useAuthStore } from "@/store/authStore";

interface RequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
  header?: any;
  showLoading?: boolean;
}

async function request<T = any>(options: RequestOptions): Promise<T> {
  const {
    url,
    method = "GET",
    data,
    header = {},
    showLoading = true,
  } = options;
  const fullUrl = url.startsWith("http") ? url : API_BASE + url;

  const token = useAuthStore.getState().token;
  if (showLoading) Taro.showLoading({ title: "加载中...", mask: true });

  try {
    const res = await Taro.request({
      url: fullUrl,
      method,
      data,
      header: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...header,
      },
    });
    if (res.data.code !== 0) {
      if (res.data.code === 1 && res.data.message === "无效或过期的令牌") {
        useAuthStore.getState().logout();
        Taro.showToast({ title: "请重新登录", icon: "none" });
        Taro.reLaunch({ url: "/pages/index/index" });
      }
      throw new Error(res.data.message || "请求失败");
    }
    return res.data.data;
  } catch (err: any) {
    Taro.showToast({ title: err.message || "网络错误", icon: "none" });
    throw err;
  } finally {
    if (showLoading) Taro.hideLoading();
  }
}

export async function uploadFile(filePath: string): Promise<any> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error("未登录");

  Taro.showLoading({ title: "上传中..." });
  try {
    const res = await Taro.uploadFile({
      url: API_BASE + "/upload",
      filePath,
      name: "file",
      header: { Authorization: `Bearer ${token}` },
    });
    const data = JSON.parse(res.data);
    if (data.code !== 0) throw new Error(data.message);
    return data.data;
  } finally {
    Taro.hideLoading();
  }
}

export default request;
