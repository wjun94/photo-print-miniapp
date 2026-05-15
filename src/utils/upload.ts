import Taro from "@tarojs/taro";
import { useAuthStore } from "@/store/authStore";

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