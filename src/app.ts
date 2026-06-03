import { PropsWithChildren } from 'react';
import {
  useLaunch,
  getCurrentInstance,
  setStorageSync,
  useDidShow,
  removeStorageSync,
} from '@tarojs/taro';
import { useAuthStore } from '@/store';
import { silentLogin } from '@/utils/auth';
import { bindInviter } from '@/api/uesr';

import 'windi.css';
import './app.less';

function App({ children }: PropsWithChildren<any>) {
  const instance = getCurrentInstance();
  const bind = () => {
    const id = instance.router?.params?.uid;
    if (id) {
      setStorageSync('share_id', id);
      if (useAuthStore.getState().isLoggedIn()) {
        setTimeout(() => {
          bindInviter({
            inviteCode: id,
          }).finally(() => {
            removeStorageSync('share_id');
          });
        }, 1500);
      }
    }
  };
  useLaunch(async () => {
    console.log('App launched.');
    const token = useAuthStore.getState().token;
    if (!token) {
      // 无 token，执行静默登录
      await silentLogin();
    }
    // 无论是否刚登录，只要有 token 就拉取用户信息
    if (useAuthStore.getState().token) {
      await useAuthStore.getState().fetchUserInfo();
    }
  });

  useDidShow(() => {
    bind();
  });

  // children 是将要会渲染的页面
  return children;
}

export default App;
