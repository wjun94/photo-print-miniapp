import { View, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getImageCdnUrl } from '@/utils'

export default function Index() {

  const navigate = (url: string) => {
    Taro.navigateTo({ url })
  }

  return (
    <View className='flex flex-col items-center  min-h-screen p-4 bg-gray-100'>
      <View
        className='w-full h-400px max-w-md bg-white rounded-lg shadow-md p-6 mb-4'
        style={{
          background: `url(${getImageCdnUrl("home.jpg")})`,
          backgroundSize: 'cover'
        }}
      >
        <View className='text-2xl font-bold text-center mb-2'>照片打印商城</View>
        <View className='text-gray-500 text-center mb-6'>上传照片，在线下单打印</View>
      </View>

      <View className='w-full max-w-md space-y-3'>
        <Button className='bg-blue-500 text-white py-3 rounded-lg' onClick={() => navigate('/pages/upload/index')}>
          上传照片
        </Button>
        {/* <Button className='bg-green-500 text-white py-3 rounded-lg' onClick={() => navigate('/pages/order/create/index')}>
          创建订单
        </Button> */}
        <Button className='bg-purple-500 text-white py-3 rounded-lg' onClick={() => navigate('/pages/order/list/index')}>
          我的订单
        </Button>
      </View>

      {/* {!isLoggedIn() && (
        <View className='mt-6 text-gray-400 text-xs'>提示：未登录将自动登录</View>
      )} */}
    </View>
  )
}