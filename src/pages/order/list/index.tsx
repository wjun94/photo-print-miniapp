import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { orderList } from '@/api/order'
import { ScrollLoadList } from '@/components' // 假设 List 组件路径

export default function OrderList() {
  // 定义请求函数，适配 List 组件需要的格式 (page, pageSize) => Promise<{ list, total }>
  const fetchOrders = async (page: number, pageSize: number) => {
    // 假设 orderList 接口支持分页参数
    const res = await orderList({ page, pageSize })
    // 根据实际接口返回结构调整，这里假设 res 为 { list: ORDER.List[], total: number }
    return {
      list: res.list || [],
    }
  }

  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/order/detail/index?id=${id}` })
  }

  // 状态配置：包含文字、颜色和背景色
  const statusConfig: Record<ORDER.List['status'], { text: string; color: string; bg: string }> = {
    pending: { text: '待处理', color: 'text-orange-600', bg: 'bg-orange-50' },
    paid: { text: '已支付', color: 'text-blue-600', bg: 'bg-blue-50' },
    processing: { text: '处理中', color: 'text-purple-600', bg: 'bg-purple-50' },
    completed: { text: '已完成', color: 'text-green-600', bg: 'bg-green-50' },
    cancelled: { text: '已取消', color: 'text-gray-500', bg: 'bg-gray-100' },
  }

  // 渲染每个订单项
  const renderItem = (order: ORDER.List) => (
    <View
      className='bg-white rounded-xl p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200'
      onClick={() => goToDetail(order.id)}
    >
      {/* 订单头部：订单号 + 状态标签 */}
      <View className='flex justify-between items-center mb-3'>
        <View className='text-sm text-gray-600 font-medium'>订单号：{order.orderNo}</View>
        <View
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[order.status].bg} ${statusConfig[order.status].color}`}
        >
          {statusConfig[order.status].text}
        </View>
      </View>

      {/* 分割线 */}
      <View className='h-px bg-gray-100 mb-3' />

      {/* 订单信息 */}
      <View className='space-y-2'>
        <View className='flex justify-between items-center'>
          <View className='text-xs text-gray-400'>
            {new Date(order.createdAt).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </View>
        </View>
        <View className='text-sm text-gray-600 line-clamp-2 leading-relaxed'>
          <Text className='text-gray-400 mr-1'>收货地址：</Text>
          {order.address}
        </View>
      </View>

      {/* 底部箭头指示器 */}
      <View className='flex justify-end mt-2'>
        <View className='text-xs text-gray-400 flex items-center'>
          查看详情
          <View className='ml-1 text-gray-300'>›</View>
        </View>
      </View>
    </View>
  )

  // 自定义头部（页面标题）
  const renderHeader = () => (
    <View className='sticky top-0 z-10 bg-white px-4 py-3 border-b border-gray-100 shadow-sm'>
      <View className='text-lg font-semibold text-gray-900'>我的订单</View>
    </View>
  )

  return (
    <View className='min-h-screen bg-gray-50'>
      <ScrollLoadList
        request={fetchOrders}
        renderItem={renderItem}
        renderHeader={renderHeader}
        pageSize={10}               // 每页数量，根据实际调整
        emptyText='您还没有任何订单记录，快去逛逛吧'
        loadingMoreText='加载更多订单...'
        noMoreText='—— 已经到底了 ——'
        errorText='加载失败，点击重试'
        keyExtractor={(item) => item.id.toString()}
        className='h-full'
      />
    </View>
  )
}