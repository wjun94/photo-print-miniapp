import { View, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { orderList } from '@/api/order'
import { useRequest } from 'ahooks'

export default function OrderList() {
  const [orders, setOrders] = useState<ORDER.List[]>([])

  const { loading } = useRequest(orderList, {
    onSuccess: (data) => {
      setOrders(data?.list)
    }
  })



  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/order/detail/index?id=${id}` })
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

  return (
    <View className='p-4 min-h-screen bg-gray-100'>
      <View className='text-xl font-bold mb-4'>我的订单</View>
      {loading ? (
        <View className='text-center py-10'>加载中...</View>
      ) : orders.length === 0 ? (
        <View className='text-center py-10 text-gray-400'>暂无订单</View>
      ) : (
        <ScrollView className='h-full'>
          {orders.map(order => (
            <View
              key={order.id}
              className='bg-white rounded-lg p-4 mb-3 shadow-sm'
              onClick={() => goToDetail(order.id)}
            >
              <View className='flex justify-between mb-2'>
                <View className='text-gray-600 text-sm'>订单号：{order.orderNo}</View>
                <View className={`text-sm ${order.status === 'pending' ? 'text-orange-500' : 'text-green-600'}`}>
                  {statusText(order.status)}
                </View>
              </View>
              <View className='flex justify-between mb-1'>
                <View>总金额：¥{order.totalAmount.toFixed(2)}</View>
                <View className='text-gray-400 text-xs'>{new Date(order.createdAt).toLocaleDateString()}</View>
              </View>
              <View className='text-gray-500 text-sm truncate'>地址：{order.address}</View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}