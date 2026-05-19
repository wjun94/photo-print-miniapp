import { View, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getImageCdnUrl } from '@/utils'
import './index.less'

export default function Index() {
  const navigate = (url: string) => {
    Taro.navigateTo({ url })
  }

  return (
    <View className='flex flex-col items-center min-h-screen p-5 bg-gradient-to-b from-gray-50 to-gray-100'>
      {/* 主视觉卡片 - 优化视觉重心与文字可读性 */}
      <View
        className='relative w-full max-w-md rounded-2xl shadow-xl mb-6 overflow-hidden'
        style={{
          background: `url(${getImageCdnUrl("home.jpg")})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* 半透明遮罩层 - 提升文字对比度 */}
        <View className='absolute inset-0 bg-black/40 backdrop-blur-[2px]' />

        {/* 内容区 - 垂直居中 + 柔和动画 */}
        <View className='relative z-10 flex flex-col items-center justify-center h-64 px-4 text-center animate-fade-in'>
          <View className='text-3xl font-bold text-white mb-2 drop-shadow-lg tracking-wide'>
            📸 照片打印商城
          </View>
          <View className='text-white/90 text-base mb-1 drop-shadow'>
            上传照片 · 在线下单 · 极速送达
          </View>
        </View>
      </View>

      {/* 主要操作按钮组 */}
      <View className='w-full max-w-md space-y-3 mb-6'>
        <Button
          className='flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-xl shadow-md active:shadow-sm active:scale-[0.98] transition-all duration-200 font-medium text-base border-0'
          onClick={() => navigate('/pages/upload/index')}
          hoverClass='opacity-90'
        >
          📤 上传照片
        </Button>

        <Button
          className='flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-xl shadow-md active:shadow-sm active:scale-[0.98] transition-all duration-200 font-medium text-base border-0'
          onClick={() => navigate('/pages/order/create/index')}
          hoverClass='opacity-90'
        >
          🛒 创建订单
        </Button>

        <Button
          className='flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3.5 rounded-xl shadow-md active:shadow-sm active:scale-[0.98] transition-all duration-200 font-medium text-base border-0'
          onClick={() => navigate('/pages/order/list/index')}
          hoverClass='opacity-90'
        >
          📦 我的订单
        </Button>
      </View>

      {/* 服务特性卡片 - 增强专业感（稳定版） */}
      <View className='w-full max-w-md bg-white rounded-xl p-4 shadow-md border border-gray-200 animate-fade-in'>
        <View className='flex justify-between items-stretch'>
          <View className='flex flex-col items-center gap-1 flex-1'>
            <View className='text-2xl'>✨</View>
            <View className='text-xs text-gray-600'>高品质相纸</View>
          </View>
          <View className='flex flex-col items-center gap-1 flex-1'>
            <View className='text-2xl'>⚡</View>
            <View className='text-xs text-gray-600'>极速发货</View>
          </View>
          <View className='flex flex-col items-center gap-1 flex-1'>
            <View className='text-2xl'>🛡️</View>
            <View className='text-xs text-gray-600'>隐私保护</View>
          </View>
        </View>
      </View>

      {/* 底部提示 - 轻量化信息 */}
      <View className='mt-4 text-center'>
        <View className='text-gray-400 text-xs flex items-center justify-center gap-1'>
          <span className='inline-block w-1 h-1 rounded-full bg-gray-300' />
          未登录将自动为您创建临时账号
          <span className='inline-block w-1 h-1 rounded-full bg-gray-300' />
        </View>
      </View>

    </View>
  )
}