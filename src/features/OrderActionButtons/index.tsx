// @/components/OrderActionButtons.tsx
import { View, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Modal } from '@/components'
import { useState, useCallback } from 'react'
import { confirmOrder, cancelOrder } from '@/api/order'
import { launchOrderPayment } from "@/utils/pay"

// 定义 Props 类型
interface OrderActionButtonsProps {
  order: {
    id: string
    status: ORDER.Status
  }
  onRefresh?: () => void // 操作成功后通知外部刷新数据
}

// 弹窗类型定义
type ModalType = 'pay' | 'cancel' | 'confirm' | null

const OrderActionButtons: React.FC<OrderActionButtonsProps> = ({ order, onRefresh }) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // 关闭弹窗
  const closeModal = useCallback(() => {
    setModalVisible(false)
    setModalType(null)
  }, [])

  // 刷新列表（优先调用外部传入的，否则尝试触发页面刷新）
  const refreshList = useCallback(() => {
    onRefresh?.()
    // 如果外部没传，尝试发个全局事件或者 noop
  }, [onRefresh])

  // 处理支付
  const handlePay = useCallback(async () => {
    if (!order.id || loading) return
    try {
      setLoading(true)
      await launchOrderPayment(order.id)
      Taro.showToast({ title: '支付成功', icon: 'none' })
      closeModal()
      refreshList()
    } catch (error) {
      Taro.showToast({ title: '支付失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [order.id, loading, closeModal, refreshList])

  // 处理取消订单
  const handleCancelOrder = useCallback(async () => {
    if (!order.id || loading) return
    try {
      setLoading(true)
      await cancelOrder({ orderId: order.id })
      Taro.showToast({ title: '订单已取消', icon: 'none' })
      closeModal()
      refreshList()
    } catch (error) {
      Taro.showToast({ title: '取消失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [order.id, loading, closeModal, refreshList])

  // 处理确认收货
  const handleConfirmOrder = useCallback(async () => {
    if (!order.id || loading) return
    try {
      setLoading(true)
      await confirmOrder({ orderId: order.id })
      Taro.showToast({ title: '确认收货成功', icon: 'none' })
      closeModal()
      refreshList()
    } catch (error) {
      Taro.showToast({ title: '操作失败，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [order.id, loading, closeModal, refreshList])

  // 根据弹窗类型获取配置
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
        return { title: '提示', content: '', confirmText: '确定', onConfirm: () => { } }
    }
  }, [modalType, handlePay, handleCancelOrder, handleConfirmOrder])

  const modalConfig = getModalConfig()

  // 渲染操作按钮
  const renderButtons = () => {
    switch (order.status) {
      case 'pending':
        return (
          <>
            <Button
              className="py-2 px-4 mx-0 rounded-full bg-white text-gray-600 text-sm font-normal"
              onClick={(e) => {
                e.stopPropagation()
                setModalType('cancel')
                setModalVisible(true)
              }}
            >
              取消订单
            </Button>
            <Button
              className="py-2 px-4 mx-0 ml-2 rounded-full border-none bg-primary-400 text-white text-sm font-normal"
              onClick={(e) => {
                e.stopPropagation()
                setModalType('pay')
                setModalVisible(true)
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

  return (
    <>
      <View onClick={(e) => e.stopPropagation()} className="flex justify-end items-end">
        {renderButtons()}
      </View>

      {/* 内置弹窗 */}
      <Modal
        visible={modalVisible}
        title={modalConfig.title}
        children={<View className="text-center px-20px">{modalConfig.content}</View>}
        confirmText={modalConfig.confirmText}
        onCancel={closeModal}
        onConfirm={modalConfig.onConfirm}
        confirmLoading={loading} // 添加 loading 状态防止重复提交
      />
    </>
  )
}

export default OrderActionButtons