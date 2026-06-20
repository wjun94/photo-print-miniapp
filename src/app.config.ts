const imgUrl = './assets/tabbar/';

export default defineAppConfig({
  pages: [
    'pages/index/index',
    // 商品详情
    'pages/detail/index',
    // 优惠券列表
    'pages/coupon/index',
    // 上传照片
    'pages/upload/index',
    // 收益管理
    'pages/income/index',
    // 好友列表
    'pages/friend/index',
    // 创建订单
    'pages/order/create/index',
    // 订单详情
    'pages/order/detail/index',
    // 提交商品
    'pages/order/upload/index',
    // 确认订单页
    'pages/order/confirm/index',
    // 订单列表
    'pages/order/list/index',
    // 编辑照片
    'pages/cropper/index',
    // 我的
    'pages/mine/index',
    // 我的地址
    'pages/address/list/index',
    // 编辑地址
    'pages/address/edit/index',
    // 选择地址
    'pages/address/select/index',
  ],
  // 底部 TabBar 配置
  tabBar: {
    color: '#666666', // 未选中文字颜色
    selectedColor: '#1677ff', // 选中文字颜色
    backgroundColor: '#ffffff', // 背景色
    borderStyle: 'black', // 顶部边框
    list: [
      {
        pagePath: 'pages/index/index', // 首页路径
        text: '首页',
        iconPath: imgUrl + 'home.png',
        selectedIconPath: imgUrl + 'home1.png',
      },
      /* {
        pagePath: 'pages/order/list/index', // 订单页面路径
        text: '订单',
        iconPath: imgUrl + 'order.png',
        selectedIconPath: imgUrl + 'order1.png',
      }, */
      {
        pagePath: 'pages/mine/index', // 我的页面路径
        text: '我的',
        iconPath: imgUrl + 'mine.png',
        selectedIconPath: imgUrl + 'mine1.png',
      },
    ],
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black',
  },
});
