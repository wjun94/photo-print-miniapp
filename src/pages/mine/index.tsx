import { useAuthStore } from '@/store'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'

// 模拟头像图片，可替换为你的真实资源或 CDN 地址
const defaultAvatar = 'https://api.dicebear.com/7.x/adventurer/svg?seed=cloud'

export default function My() {
  const { userInfo } = useAuthStore()
  const navigate = (url: string) => {
    Taro.navigateTo({ url })
  }

  // 订单状态分类数据
  const orderStates = [
    { id: 'unpaid', label: '待付款', icon: 'icon-wallet' },
    { id: 'printing', label: '冲印中', icon: 'icon-print' },
    { id: 'shipped', label: '已发货', icon: 'icon-truck' },
    { id: 'completed', label: '已完成', icon: 'icon-check-circle' },
    { id: 'cancelled', label: '已取消', icon: 'icon-close-circle' },
  ]

  // 功能列表数据
  const menuItems = [
    { id: 'address', label: '地址管理', icon: 'icon-location', url: '/pages/address/list/index' },
    { id: 'coupon', label: '我的优惠券', icon: 'icon-coupon', url: '/pages/coupon/index' },
    { id: 'icon-favorites-fill', label: '我的收藏', icon: 'icon-favorites-fill', url: '/pages/favorite/index' },
    { id: 'faq', label: '常见问题', icon: 'icon-doubt', url: '/pages/faq/index' },
    { id: 'friend', label: '好友列表', icon: 'icon-doubt', url: '/pages/friend/index' },
  ]

  return (
    <View className='min-h-screen px-4 pt-6 pb-10 flex flex-col justify-between box-border'>

      <View className='w-full'>
        {/* 1. 用户信息头部区域 */}
        <View
          className='flex items-center justify-between mb-6 px-1 active:opacity-90'
          onClick={() => navigate('/pages/profile/index')}
        >
          <View className='flex items-center gap-4'>
            {/* 头像 */}
            <Image
              src={defaultAvatar}
              className='w-16 h-16 rounded-full border-2 border-white bg-blue-50 shadow-sm'
            />
            {/* 昵称及签名 */}
            <View className='flex flex-col gap-1'>
              <Text className='text-xl font-bold text-[#222222] tracking-wide'>你好，小云</Text>
              <Text className='text-xs text-[#999999]'>ID：{userInfo?.id}</Text>
            </View>
          </View>
          {/* 右侧箭头 */}
          <Text className='iconfont icon-arrow-right text-[#999999] text-base font-light' />
        </View>

        {/* 2. 我的订单卡片 */}
        <View className='bg-white rounded-2xl p-4 shadow-sm mb-4 border border-solid border-white'>
          {/* 卡片头部 */}
          <View className='flex justify-between items-center mb-5'>
            <Text className='text-base font-bold text-[#333333]'>我的订单</Text>
            <View
              className='flex items-center gap-0.5 active:opacity-70'
              onClick={() => navigate('/pages/order/list/index?status=all')}
            >
              <Text className='text-xs text-[#999999]'>全部订单</Text>
              <Text className='iconfont icon-arrow-right text-[#bbbbbb] text-xs' />
            </View>
          </View>

          {/* 状态网格五等分 */}
          <View className='grid grid-cols-5 gap-0'>
            {orderStates.map((item) => (
              <View
                key={item.id}
                className='flex flex-col items-center gap-2 active:opacity-70'
                onClick={() => navigate(`/pages/order/list/index?status=${item.id}`)}
              >
                {/* 图标占位，配合你的 Iconfont 样式 */}
                <View className='w-7 h-7 flex items-center justify-center text-[#3b82f6]'>
                  <Text className={`iconfont ${item.icon} text-2xl`} />
                </View>
                <Text className='text-xs text-[#555555] font-medium'>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 3. 菜单功能列表卡片 */}
        <View className='bg-white rounded-2xl px-4 py-1 shadow-sm border border-solid border-white flex flex-col'>
          {menuItems.map((item, index) => (
            <View
              key={item.id}
              onClick={() => navigate(item.url)}
              className={`flex items-center justify-between py-4 transition-colors duration-150 ${index !== menuItems.length - 1 ? 'bb' : ''
                }`}
            >
              {/* 左侧图标与文本 */}
              <View className='flex items-center gap-3'>
                <Text style={{ fontSize: '44rpx' }} className={`iconfont ${item.icon} text-primary-400`} />
                <Text className='text-[#333333] font-medium'>{item.label}</Text>
              </View>
              {/* 右侧箭头 */}
              <Text className='iconfont icon-next text-[#cccccc]' />
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}