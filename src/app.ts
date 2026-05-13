import { PropsWithChildren } from "react";
import { useLaunch } from "@tarojs/taro";
import { useAuthStore } from "@/store";
import { silentLogin } from "@/utils/auth";

import "windi.css";
import "./app.less";

function App({ children }: PropsWithChildren<any>) {
  useLaunch(async () => {
    console.log("App launched.");
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

  // children 是将要会渲染的页面
  return children;
}

export default App;
