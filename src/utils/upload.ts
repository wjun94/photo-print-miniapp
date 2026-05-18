import Taro from "@tarojs/taro";
import { useAuthStore } from "@/store/authStore";

/**
 * 微信小程序 - 批量上传多张图片（TypeScript版）
 * @param filePaths 图片临时路径数组
 * @returns 上传成功后的图片地址数组
 */
export const uploadMultiImages = (
  filePaths: string[],
): Promise<string[]> => {
  // 【这里换成你的后端上传接口】
  return new Promise(async (resolve, reject) => {
    const successUrls: string[] = [];
    const token = useAuthStore.getState().token;

    try {
      // 串行依次上传（最稳定）
      for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i];

        // 单张上传
        const res = await Taro.uploadFile({
          url: API_BASE + "/upload/single",
          filePath,
          name: "file",
          header: { Authorization: `Bearer ${token}` },
        });
        // 解析后端返回值
        const result = JSON.parse(res.data);
        if (result.code === 0 && result.data.url) {
          successUrls.push(result.data.url);
        } else {
          successUrls.push(filePath);
          Taro.showToast({ title: `第${i + 1}张${result.message}`, icon: 'none' })
        }
      }
      // 全部上传完成
      resolve(successUrls);
    } catch (err) {
      reject(err);
    }
  });
};

/** 上传单张图片 */
export async function uploadSingleFile(filePath: string): Promise<any> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error("未登录");

  Taro.showLoading({ title: "上传中..." });
  try {
    const res = await Taro.uploadFile({
      url: API_BASE + "/upload/single",
      filePath,
      name: "file",
      header: { Authorization: `Bearer ${token}` },
    });
    const data = JSON.parse(res.data);
    if (data.code !== 0) {
      Taro.showToast({ title: data.message || "网络错误", icon: "none" });
      throw new Error(data.message)
    };
    return data.data;
  } finally {
    Taro.hideLoading();
  }
}