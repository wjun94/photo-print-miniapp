import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { orderList } from '@/api/order'
import { ScrollLoadList, Image } from '@/components'

// 模拟扩展后的订单数据结构（供参考）
interface OrderItem {
  id: number
  orderNo: string
  status: 'all' | 'paid' | 'printing' | 'shipped' | 'completed'
  createdAt: string
  goodsName: string
  goodsSpec: string
  goodsImg: string
  price: number
  quantity: number
}

export default function OrderList() {
  // 当前选中的 Tab 状态
  const [currentStatus, setCurrentStatus] = useState<string>('all')

  // Tab 栏配置
  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待付款' },
    { key: 'printing', label: '冲印中' },
    { key: 'shipped', label: '已发货' },
    { key: 'completed', label: '已完成' },
  ] as const

  const statusText = {
    pending: { text: '待处理', color: 'text-orange-500' },
    paid: { text: '已支付', color: 'text-blue-500' },
    processing: { text: '处理中', color: 'text-blue-500' },
    completed: { text: '已完成', color: 'text-blue-500' },
    cancelled: { text: '已取消', color: 'text-blue-500' },
  }

  // 请求接口适配（加入 status 筛选）
  const fetchOrders = async (page: number, pageSize: number) => {
    const res = await orderList({
      page,
      pageSize,
      status: currentStatus === 'all' ? undefined : currentStatus
    })
    return {
      list: (res.list || []) as ORDER.List[],
    }
  }

  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/order/detail/index?id=${id}` })
  }

  // 渲染单个订单卡片 (完全对齐 UI 图)
  const renderItem = (order: OrderItem) => (
    <View
      className='mx-4 mt-3 bg-white rounded-2xl p-4 active:opacity-90 transition-all'
      onClick={() => goToDetail(order.id)}
    >
      {/* 1. 顶部：订单号 + 状态文本 */}
      <View className='flex justify-between items-center mb-4'>
        <View className='text-sm text-gray-500 font-normal'>
          订单号：{order.orderNo}
        </View>
        <View className={`text-sm font-normal ${statusText[order.status]?.color}`}>
          {statusText[order.status]?.text}
        </View>
      </View>

      {/* 2. 中部：商品图文详情 */}
      <View className='flex items-start mb-4'>
        {/* 商品图片 */}
        <Image
          src={order.goodsImg}
          className='w-20 h-20 bg-gray-100 rounded-lg mr-3 flex-shrink-0 object-cover'
        />

        {/* 商品文本与右侧价格 */}
        <View className='flex-1 flex justify-between items-start min-w-0'>
          <View className='flex-1 min-w-0 pr-4'>
            <Text className='text-base text-gray-800 font-normal block truncate'>
              {order.goodsName}
            </Text>
            <Text className='text-sm text-gray-400 mt-1 block'>
              {order.goodsSpec}
            </Text>
          </View>

          <View className='text-right flex-shrink-0'>
            <Text className='text-base text-gray-800 font-medium block'>
              ¥ {order.price}
            </Text>
            <Text className='text-sm text-gray-400 mt-1 block'>
              共 {order.quantity} 件
            </Text>
          </View>
        </View>
      </View>

      {/* 3. 底部：时间 + 箭头指示器 */}
      <View className='flex justify-between items-center pt-2'>
        <View className='text-sm text-gray-400'>
          {order.createdAt}
        </View>
        {/* 自定义向右箭头样式 */}
        <View className='text-gray-400 text-lg font-light leading-none'>
          ›
        </View>
      </View>
    </View>
  )

  // 顶部固定 Tab 栏
  const renderHeader = () => (
    <View className='sticky top-0 z-10 bg-white flex justify-around items-center .bb h-12 shadow-sm'>
      {tabs.map((tab) => {
        const isActive = currentStatus === tab.key
        return (
          <View
            key={tab.key}
            className='relative flex flex-col items-center justify-center h-full px-2 active:opacity-70'
            onClick={() => setCurrentStatus(tab.key)}
          >
            <Text className={`text-sm ${isActive ? 'text-blue-500 font-medium' : 'text-gray-600'}`}>
              {tab.label}
            </Text>
            {/* 激活状态的底部蓝色短横线 */}
            {isActive && (
              <View className='absolute bottom-0 w-8 h-0.5 bg-blue-500 rounded-full' />
            )}
          </View>
        )
      })}
    </View>
  )

  return (
    <View className='min-h-screen bg-gray-50/60 pb-6'>
      <ScrollLoadList
        // 通过 key 强制重置组件，当切换 Tab 时重新触发从第一页加载
        key={currentStatus}
        request={fetchOrders}
        renderItem={renderItem}
        renderHeader={renderHeader}
        pageSize={10}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  )
}