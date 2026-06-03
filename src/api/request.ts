import Taro from '@tarojs/taro';
import { useAuthStore } from '@/store/authStore';
import { silentLogin } from '@/utils/auth';

// 定义缺少的 API_BASE，防止编译报错（请根据你实际的全局变量或导入调整）
declare const API_BASE: string;

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: any;
  showLoading?: boolean;
  showErrorToast?: boolean; // 👈 新增：是否显示错误弹窗，默认为 true
}

async function request<T = any>(options: RequestOptions): Promise<T> {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    showLoading = true,
    showErrorToast = true, // 👈 新增：解构并设置默认值
  } = options;
  const fullUrl = url.startsWith('http') ? url : API_BASE + url;

  const token = useAuthStore.getState().token;
  if (showLoading) Taro.showLoading({ title: '加载中...', mask: true });

  try {
    const res = await Taro.request({
      url: fullUrl,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...header,
      },
    });

    if (res?.statusCode === 401) {
      const { token: newToken } = await silentLogin();
      // 更新 store
      useAuthStore.getState().setToken(newToken);
      // 获取用户信息
      await useAuthStore.getState().fetchUserInfo();
      throw new Error('登录过期，已重新登录');
    } else if (res.data.code !== 0) {
      if (res.data.code === 1 && res.data.message === '无效或过期的令牌') {
        useAuthStore.getState().logout();
        Taro.showToast({ title: '请重新登录', icon: 'none' });
        Taro.reLaunch({ url: '/pages/index/index' });
      }
      throw new Error(res.data.message || '请求失败');
    }
    return res.data.data;
  } catch (err: any) {
    // 👈 修改：只有在 showErrorToast 为 true 时才弹出提示
    if (showErrorToast) {
      Taro.showToast({ title: err.message || '网络错误', icon: 'none' });
    }
    throw err;
  } finally {
    if (showLoading) Taro.hideLoading();
  }
}

export default request;
