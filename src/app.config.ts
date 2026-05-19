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
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  }
})
