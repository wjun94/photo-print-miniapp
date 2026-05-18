import { View } from '@tarojs/components'
import { Image } from '@/components'
import Taro, { useRouter } from '@tarojs/taro'
import { getOrder } from '@/api/order'
import { useEffect, useState } from 'react'

export default function OrderDetail() {
  const router = useRouter()
  const { id } = router.params
  const [order, setOrder] = useState<ORDER.List | null>(null)
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

  const statusText = (status: ORDER.List['status']) => {
    const map: Record<ORDER.List['status'], string> = {
      pending: '待处理',
      paid: '已支付',
      processing: '处理中',
      completed: '已完成',
      cancelled: '已取消'
    }
    return map[status]
  }

  if (loading) return <View className='text-center py-10'>加载中...</View>
  if (!order) return <View className='text-center py-10'>订单不存在</View>

  return (
    <View className='p-4 min-h-screen bg-gray-100'>
      <View className='bg-white rounded-lg p-4 mb-4'>
        <View className='flex justify-between mb-2'>
          <View className='text-lg font-bold'>订单详情</View>
          <View className={`text-sm ${order.status === 'pending' ? 'text-orange-500' : 'text-green-600'}`}>
            {statusText(order.status)}
          </View>
        </View>
        <View className='text-gray-500 text-sm mb-1'>订单号：{order.orderNo}</View>
        <View className='text-gray-500 text-sm'>创建时间：{new Date(order.createdAt).toLocaleString()}</View>
      </View>

      <View className='bg-white rounded-lg p-4 mb-4'>
        <View className='font-bold mb-2'>商品列表</View>
        {order.items?.map((item, idx) => (
          <View key={idx} className='flex border-b py-2 last:border-0'>
            <Image src={item.imageUrl || ''} className='w-20 h-20 rounded mr-3' mode='aspectFill' />
            <View className='flex-1'>
              <View>规格：{item.spec}</View>
              <View>数量：{item.quantity}</View>
              <View>单价：¥{item.price.toFixed(2)}</View>
            </View>
          </View>
        ))}
      </View>

      <View className='bg-white rounded-lg p-4'>
        <View className='font-bold mb-2'>收货信息</View>
        <View className='text-gray-700'>{order.address}</View>
      </View>
    </View>
  )
}