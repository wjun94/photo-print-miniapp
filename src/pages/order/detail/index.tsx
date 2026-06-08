import { View, Text, ScrollView } from '@tarojs/components'
import { Image } from '@/components'
import Taro, { useRouter } from '@tarojs/taro'
import { getOrder } from '@/api/order'
import { useEffect, useState } from 'react'
import { OrderActionButtons } from '@/features'

const OrderDetail = () => {
  const router = useRouter()
  const { id } = router.params
  const [order, setOrder] = useState<ORDER.Item | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchDetail()
  }, [id])

  const fetchDetail = async () => {
    try {
      const data = await getOrder(id)
      setOrder(data)
    } catch (err) {
      Taro.showToast({ title: '获取订单失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const statusMap: Record<ORDER.Item['status'], { text: string; subText: string; color: string; }> = {
    pending: { text: '待支付', subText: '您的订单还未支付，请尽快支付！', color: 'text-orange-500' },
    paid: { text: '待发货', subText: '订单已支付，我们会尽快发货。', color: 'text-blue-500' },
    shipped: { text: '已发货', subText: '您的订单已发货，感谢您的支持！', color: 'text-blue-500' },
    refunding: { text: '退款中', subText: '您的订单正在制作中。', color: 'text-red-400' },
    refunded: { text: '已退款', subText: '您的订单正在制作中。', color: 'text-red-400' },
    completed: { text: '已完成', subText: '感谢您的支持，欢迎再次光临！', color: 'text-green-700' },
    cancelled: { text: '已取消', subText: '订单已取消。', color: 'text-gray-500' },
  }

  const currentStatus = order?.status && statusMap[order.status] || statusMap.pending

  const copyOrderNo = () => {
    if (order?.orderNo) {
      Taro.setClipboardData({
        data: order.orderNo,
        success: () => {
          Taro.showToast({ title: '复制成功', icon: 'none' })
        },
      })
    }
  }

  if (loading) return <View className='text-center py-10'>加载中...</View>
  if (!order) return <View className='text-center py-10'>订单不存在</View>
  return (
    <View className='min-h-screen flex flex-col px-4 pt-4'>
      <ScrollView className='flex-1 pb-20'>
        {/* 订单状态横幅 */}
        <View className='flex items-center p-4 bg-white mb-4 rounded-20px'>
          <View>
            <Text className={`text-30px`}>
              订单状态：<Text className={currentStatus.color}>{currentStatus.text}</Text>
            </Text>
            <Text className='text-gray-500 text-sm mt-3 block'>
              {currentStatus.subText}
            </Text>
          </View>
        </View>

        {/* 收货地址 */}
        <View className='bg-white rounded-lg p-4 mb-4 rounded-20px flex items-start'>
          <Text className='iconfont icon-shou text-red-500 mr-2 text-42px flex-shrink-0' />
          <View className='flex-1'>
            <View className='flex items-center mb-2 text-36px font-bold text-gray-900'>
              <Text className='mr-4'>{order.address.receiverName}</Text>
              <Text>{order.address.mobile}</Text>
            </View>
            <View className='text-28px text-gray-600 leading-relaxed'>
              {order.address.provinceName} {order.address.cityName} {order.address.districtName} {order.address.detail} {order.address.doorplate}
            </View>
          </View>
        </View>

        {/* 商品信息 & 金额明细 */}
        <View className='bg-white rounded-lg p-4 mb-4 rounded-20px'>
          <Text className='font-bold mb-3 block text-30px'>商品信息</Text>

          {/* 商品列表 */}
          {
            order.specs?.map(item => <View key={item.specId} className='flex items-start'>
              {/* 商品图片 */}
              <Image
                src={item.imageUrl}
                className='w-20 h-20 bg-gray-100 rounded-lg mr-3 flex-shrink-0 object-cover'
              />
              {/* 2. 中部：商品图文详情 */}
              <View className='flex-1 flex justify-between items-start min-w-0'>
                <View className='flex-1 min-w-0 pr-4'>
                  <Text className='text-base text-gray-800 font-normal block truncate'>
                    {item.productName}
                  </Text>
                  <Text className='text-sm text-gray-400 mt-1 block'>
                    {item.specName}
                  </Text>
                </View>

                <View className='text-right flex-shrink-0'>
                  <Text className='text-base text-gray-800 font-medium block'>
                    ¥ {item.totalSubtotal}
                  </Text>
                  <Text className='text-sm text-gray-400 mt-1 block'>
                    共 {item.totalQuantity} 件
                  </Text>
                </View>
              </View>
            </View>
            )
          }
        </View>

        {/* 金额明细 */}
        <View className='border-t mb-4 bg-white rounded-20px p-4'>
          {
            [{
              label: '商品金额',
              value: `¥${order.amount}`
            },
            {
              label: '运费',
              value: `¥${order.freight}`
            },
            /* {
              label: '优惠券',
              value: `- ¥5.00`
            }, */
            {
              label: '实付款',
              value: `¥${order.actualAmount}`
            },].map(item => <View key={item.label} className='flex justify-between py-1'>
              <Text className='text-gray-600'>{item.label}</Text>
              <Text className='text-gray-800 font-bold'>{item.value}</Text>
            </View>)
          }
        </View>

        {/* 订单信息 */}
        <View className='bg-white rounded-lg p-4 mb-4 rounded-20px'>
          <View className='flex items-center py-1 text-gray-800'>
            <Text className='text-gray-600'>订单编号：
              <Text>{order.orderNo}</Text>
            </Text>
            <Text onClick={copyOrderNo} className='iconfont icon-copy ml-2' />
          </View>
          <View className='py-1'>
            <Text className='text-gray-600'>创建时间：<Text className='text-gray-800'>{order.createdAt}</Text></Text>
          </View>
        </View>
      </ScrollView >

      {/* 底部按钮 */}
      <View className='flex justify-end items-end p-4 bg-white fixed bottom-0 left-0 right-0' >
        <OrderActionButtons order={order} />
      </View >
    </View >
  )
}

export default OrderDetail