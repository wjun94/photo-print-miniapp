export default defineAppConfig({
  pages: [
    'pages/index/index',
    // 上传照片
    'pages/upload/index',
    // 创建订单
    'pages/order/create/index',
    // 订单详情
    'pages/order/detail/index',
    // 订单列表
    'pages/order/list/index',
    // 编辑照片
    'pages/cropper/index',
    // 我的
    'pages/mine/index',
  ],
  // 底部 TabBar 配置
  tabBar: {
    color: "#666666", // 未选中文字颜色
    selectedColor: "#1677ff", // 选中文字颜色
    backgroundColor: "#ffffff", // 背景色
    borderStyle: "black", // 顶部边框
    list: [
      {
        pagePath: "pages/index/index", // 首页路径
        text: "首页",
        iconPath: "", // 可放图标图片路径
        selectedIconPath: ""
      },
      {
        pagePath: "pages/mine/index", // 我的页面路径
        text: "我的",
        iconPath: "",
        selectedIconPath: ""
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  }
})