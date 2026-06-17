import { View, Text, Button } from '@tarojs/components'
import { getCouponList } from '@/api/coupon'
import { ScrollLoadList } from '@/components'
import dayjs from 'dayjs'

// 1. 定义优惠券数据接口
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
  // 时间格式化辅助函数
  const formatTime = (timeStr: string) => dayjs(timeStr).format('YYYY.MM.DD')

  // 优惠券点击事件处理
  const handleCouponAction = (item: CouponItem) => {
    if (item.status === 0) {
      // 仅在“未使用”状态下触发点击去使用
      console.log('去使用优惠券：', item)
    }
  }

  return (
    <ScrollLoadList
      request={getCouponList}
      // 列表外部容器样式：规范间距与最小高度
      className="flex flex-col gap-3 pt-2 pb-[68px] min-h-[30vh]"
      renderItem={(item: CouponItem) => {
        const { coupon, status, validStart, validEnd } = item
        const isFullReduce = coupon.type === 1 && coupon.fullAmount > 0

        // ================= 状态样式映射 (背景色、文字色、按钮) =================
        let cardClassName = 'bg-gradient-to-r from-red-50/50 to-orange-50/50 border-red-100'
        let priceColorName = 'text-red-500'
        let btnText = '去使用'
        let btnClassName = 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm'

        switch (status) {
          case 1: // 已使用
            cardClassName = 'bg-orange-50/20 border-orange-200'
            priceColorName = 'text-orange-500'
            btnText = '已使用'
            btnClassName = 'bg-orange-500 text-white shadow-sm opacity-60 cursor-not-allowed'
            break
          case 2: // 已过期
            cardClassName = 'bg-gray-50 border-gray-200 opacity-70'
            priceColorName = 'text-gray-400'
            btnText = '已过期'
            btnClassName = 'bg-gray-200 text-gray-400 cursor-not-allowed'
            break
          case 0: // 未使用
          default:
            cardClassName = 'bg-gradient-to-r from-red-50/20 to-orange-50/20 border-red-100'
            priceColorName = 'text-red-500'
            btnText = '去使用'
            btnClassName = 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm'
            break
        }
        // =================================================================

        return (
          <View
            key={item.id}
            onClick={() => handleCouponAction(item)}
            // 最外层卡片容器：`${cardClassName}` 动态赋予全卡片背景色
            className={`flex items-center justify-between border border-solid rounded-xl p-3 relative overflow-hidden transition-all mx-3 ${cardClassName}`}
          >
            {/* 左侧：金额与描述信息区域 */}
            <View className="flex items-center pl-2 flex-1 min-w-0">
              {/* 优惠券金额 */}
              <View className={`font-bold mr-4 flex items-baseline flex-shrink-0 ${priceColorName}`}>
                <Text className="text-xs">￥</Text>
                <Text className="text-2xl leading-none">{coupon.reduceAmount}</Text>
              </View>

              {/* 文本描述 */}
              <View className="flex flex-col flex-1 min-w-0">
                {/* 券名称：超出部分自动隐藏省略 */}
                <Text
                  className={`text-sm font-medium truncate ${status === 2 ? 'text-gray-400 line-through' : status === 1 ? 'text-gray-700' : 'text-gray-800'
                    }`}
                >
                  {coupon.name}
                </Text>

                {/* 使用门槛 */}
                <Text className="text-xs text-gray-400 mt-1">
                  {isFullReduce ? `满 ${coupon.fullAmount} 元可用` : '无门槛立减券'}
                </Text>

                {/* 有效时间 */}
                <Text className="text-[10px] text-gray-400 mt-0.5">
                  {formatTime(validStart)} - {formatTime(validEnd)}
                </Text>
              </View>
            </View>

            {/* 右侧：动作按钮 */}
            <Button
              disabled={status !== 0}
              className={`h-7 px-4 rounded-full text-xs font-medium flex items-center justify-center m-0 transition-all border-none after:border-none flex-shrink-0 ${status === 0 ? 'active:scale-95' : ''
                } ${btnClassName}`}
            >
              {btnText}
            </Button>
          </View>
        )
      }}
    />
  )
}