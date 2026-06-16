import { View, Text, Button } from '@tarojs/components'
import { getCouponList } from '@/api/coupon'
import { ScrollLoadList } from '@/components'
import dayjs from 'dayjs'

interface CouponItem {
  id: string
  status: number // 0: 未使用, 1: 已使用, 2: 已过期
  validStart: string
  validEnd: string
  coupon: {
    id: string
    name: string
    type: number // 1: 满减券, 2: 无门槛
    fullAmount: number
    reduceAmount: number
    discountRate: number
    desc: string
  }
}

export default () => {
  const formatTime = (timeStr: string) => dayjs(timeStr).format('YYYY.MM.DD')

  return (
    <ScrollLoadList
      request={getCouponList}
      renderItem={(item: CouponItem) => {
        const { coupon, status, validStart, validEnd } = item
        const isFullReduce = coupon.type === 1 && coupon.fullAmount > 0
        const isAvailable = status === 0

        return (
          <View
            key={item.id}
            className={`flex m-3 bg-white rounded-lg shadow-sm overflow-hidden h-24 ${!isAvailable ? 'opacity-60 filter grayscale' : ''
              }`}
          >
            {/* 左侧：金额区域 */}
            <View className="w-1/3 bg-gradient-to-br from-red-400 to-red-500 flex flex-row justify-center items-center text-white">
              <Text className="text-sm mt-2 font-medium">￥</Text>
              <Text className="text-3xl font-bold">{coupon.reduceAmount}</Text>
            </View>

            {/* 中间：信息区域 */}
            <View className="w-1/2 p-3 flex flex-col justify-center">
              <Text className="text-base font-bold text-gray-800 truncate">
                {coupon.name}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                {isFullReduce ? `满 ${coupon.fullAmount} 元可用` : '无门槛立减券'}
              </Text>
              <Text className="text-[10px] text-gray-400 mt-1">
                {formatTime(validStart)} - {formatTime(validEnd)}
              </Text>
            </View>

            {/* 右侧：状态/按钮区域 */}
            <View className="w-[22%] flex flex-col justify-center items-center border-l border-dashed border-gray-200 p-2">
              {status === 0 && (
                <View className="flex flex-col items-center">
                  <Text className="text-xs text-green-500 font-medium mb-2">未使用</Text>
                  <Button className="m-0 px-2 py-0.5 h-auto leading-tight bg-red-500 text-white rounded-full text-[10px] border-none after:border-none">
                    去使用
                  </Button>
                </View>
              )}
              {status === 1 && (
                <Text className="text-xs text-gray-400">已使用</Text>
              )}
              {status === 2 && (
                <Text className="text-xs text-gray-400">已过期</Text>
              )}
            </View>
          </View>
        )
      }}
    />
  )
}