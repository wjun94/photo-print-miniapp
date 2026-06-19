import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useCallback, useRef } from 'react'
import { orderList, confirmOrder, cancelOrder } from '@/api/order'
import { ScrollLoadList, Image, Modal, ScrollLoadListRef } from '@/components'
import { launchOrderPayment } from "@/utils/pay"

// 弹窗类型定义
type ModalType = 'pay' | 'cancel' | 'confirm' | null

export default function OrderList() {
  const listRef = useRef<ScrollLoadListRef>()
  // 当前选中的 Tab 状态
  const [currentStatus, setCurrentStatus] = useState<string>('all')
  // 列表刷新key，操作成功后递增强制刷新
  const [refreshKey, setRefreshKey] = useState<number>(0)
  // 弹窗状态
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  // 加载状态，防止重复点击
  const [loading, setLoading] = useState<boolean>(false)

  // Tab 栏配置
  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待付款' },
    { key: 'paid', label: '待发货' },
    { key: 'shipped', label: '已发货' },
    { key: 'completed', label: '已完成' },
  ] as const

  const statusText = {
    pending: { text: '待支付', color: 'text-orange-500' },
    paid: { text: '待发货', color: 'text-blue-500' },
    shipped: { text: '已发货', color: 'text-blue-500' },
    completed: { text: '已完成', color: 'text-green-700' },
    cancelled: { text: '已取消', color: 'text-gray-500' },
  }

  useDidShow(() => {
    listRef?.current?.refresh?.()
  })

  // 请求接口适配（加入 status 筛选）
  const fetchOrders = async (page: number, pageSize: number) => {
    const res = await orderList({
      page,
      pageSize,
      status: currentStatus === 'all' ? '' : currentStatus
    })
    return {
      list: (res.list || []) as ORDER.Item[],
    }
  }

  const goToDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/order/detail/index?id=${id}` })
  }

  // 打开弹窗通用方法
  const openModal = useCallback((type: ModalType, orderId: string) => {
    setModalType(type)
    setCurrentOrderId(orderId)
    setModalVisible(true)
  }, [])

  // 关闭弹窗
  const closeModal = useCallback(() => {
    setModalVisible(false)
    setModalType(null)
    setCurrentOrderId(null)
  }, [])

  // 刷新列表
  const refreshList = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  // 立即支付处理
  const handlePay = useCallback(async () => {
    if (!currentOrderId || loading) return

    try {
      setLoading(true)
      await launchOrderPayment(currentOrderId)
      Taro.showToast({ title: '支付成功', icon: 'success' })
      closeModal()
      refreshList()
    } catch (error) {
      Taro.showToast({ title: '支付失败，请重试', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }, [currentOrderId, loading, closeModal, refreshList])

  // 取消订单处理
  const handleCancelOrder = useCallback(async () => {
    if (!currentOrderId || loading) return

    try {
      setLoading(true)
      await cancelOrder({ orderId: currentOrderId })
      Taro.showToast({ title: '订单已取消', icon: 'success' })
      closeModal()
      refreshList()
    } catch (error) {
      Taro.showToast({ title: '取消失败，请重试', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }, [currentOrderId, loading, closeModal, refreshList])

  // 确认收货处理
  const handleConfirmOrder = useCallback(async () => {
    if (!currentOrderId || loading) return

    try {
      setLoading(true)
      await confirmOrder({ orderId: currentOrderId })
      Taro.showToast({ title: '确认收货成功', icon: 'success' })
      closeModal()
      refreshList()
    } catch (error) {
      Taro.showToast({ title: '操作失败，请重试', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }, [currentOrderId, loading, closeModal, refreshList])

  // 根据弹窗类型获取弹窗配置
  const getModalConfig = useCallback(() => {
    switch (modalType) {
      case 'pay':
        return {
          title: '确认支付',
          content: '您确定要立即支付该订单吗？',
          confirmText: '立即支付',
          onConfirm: handlePay
        }
      case 'cancel':
        return {
          title: '取消订单',
          content: '您确定要取消该订单吗？取消后将无法恢复。',
          confirmText: '确认',
          onConfirm: handleCancelOrder
        }
      case 'confirm':
        return {
          title: '确认收货',
          content: '您确定已经收到商品了吗？',
          confirmText: '确认收货',
          onConfirm: handleConfirmOrder
        }
      default:
        return {
          title: '提示',
          content: '',
          confirmText: '确定',
          onConfirm: () => { }
        }
    }
  }, [modalType, handlePay, handleCancelOrder, handleConfirmOrder])

  // 根据订单状态渲染操作按钮
  const renderActionButtons = (order: ORDER.Item) => {
    switch (order.status) {
      case 'pending':
        return (
          <>
            <Button
              className="py-2 px-4 mx-0 rounded-full bg-white text-gray-600 text-sm font-normal"
              onClick={(e) => {
                e.stopPropagation() // 阻止冒泡到订单卡片
                openModal('cancel', order.id)
              }}
            >
              取消订单
            </Button>
            <Button
              className="py-2 px-4 mx-0 ml-2 rounded-full border-none bg-primary-400 text-white text-sm font-normal"
              onClick={async (e) => {
                e.stopPropagation()
                openModal('pay', order.id)
              }}
            >
              立即支付
            </Button>
          </>
        )
      case 'shipped':
        return (
          <Button
            className="py-2 mx-0 w-[max-content] px-4 rounded-full border-none bg-primary-400 text-white text-sm font-normal"
            onClick={(e) => {
              e.stopPropagation()
              setModalType('confirm')
              setModalVisible(true)
            }}
          >
            确认收货
          </Button>
        )
      case 'paid':
      case 'completed':
      case 'cancelled':
      default:
        return null
    }
  }

  // 渲染单个订单卡片 (完全对齐 UI 图)
  const renderItem = (order: ORDER.Item) => (
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

      {/* 商品文本与右侧价格 */}
      {
        order.specs?.map(item => <View key={item.specId} className='flex items-start mb-4'>
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
      <View className="flex justify-end items-end">
        {renderActionButtons(order)}
      </View>
    </View>
  )

  // 顶部固定 Tab 栏
  const renderHeader = () => (
    <View className='sticky top-0 z-10 bg-white flex justify-around items-center border-b border-gray-100 h-12 shadow-sm'>
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

  const modalConfig = getModalConfig()

  return (
    <View className='min-h-screen pb-6'>
      <ScrollLoadList
        ref={listRef}
        // 通过 key 强制重置组件，当切换 Tab 或操作成功时重新触发从第一页加载
        key={`${currentStatus}-${refreshKey}`}
        request={fetchOrders}
        renderItem={renderItem}
        renderHeader={renderHeader}
        pageSize={10}
        keyExtractor={(item) => item.id.toString()}
      />

      {/* 通用确认弹窗 */}
      <Modal
        visible={modalVisible}
        title={modalConfig.title}
        children={<View className="text-center">{modalConfig.content}</View>}
        confirmText={modalConfig.confirmText}
        onCancel={closeModal}
        onConfirm={modalConfig.onConfirm}
        contentClassName="w-420px mx-auto"
      />
    </View>
  )
}