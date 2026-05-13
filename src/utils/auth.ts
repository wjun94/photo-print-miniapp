import Taro from "@tarojs/taro";
import { useAuthStore } from "@/store/authStore";
import { wxLogin } from "@/api/auto";

export async function silentLogin() {
  try {
    const { code } = await Taro.login();
    const data = await wxLogin({ code });
    useAuthStore.getState().setToken(data.token);
    useAuthStore.getState().setUserId(data.user_id);
    return data;
  } catch (err) {
    console.error("Login failed", err);
    throw err;
  }
}
