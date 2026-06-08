// src/components/Modal/index.tsx
import React, { PropsWithChildren } from 'react'
import { View } from '@tarojs/components'

export interface ModalProps {
  /** 是否显示弹窗 */
  visible: boolean
  /** 弹窗标题，默认：温馨提示 */
  title?: string
  /** 确认按钮文字，默认：确定 */
  confirmText?: string
  /** 取消按钮文字，默认：取消 */
  cancelText?: string
  /** 是否显示取消按钮，默认：true */
  showCancel?: boolean
  /** 点击确认回调 */
  onConfirm?: () => void
  /** 点击取消回调 */
  onCancel?: () => void
  /** 是否允许点击遮罩关闭，默认：true */
  maskClosable?: boolean
  /** 自定义内容区域类名 */
  contentClassName?: string
  // --- 新增属性 ---
  /** 确认按钮加载状态 */
  confirmLoading?: boolean
}

const Modal: React.FC<PropsWithChildren<ModalProps>> = ({
  visible,
  title = '温馨提示',
  confirmText = '确定',
  cancelText = '取消',
  showCancel = true,
  onConfirm,
  onCancel,
  maskClosable = true,
  children,
  contentClassName = '',
  // --- 解构新属性 ---
  confirmLoading = false,
}) => {
  if (!visible) return null

  const handleMaskClick = () => {
    if (maskClosable) {
      onCancel?.()
    }
  }

  // --- 确认按钮点击处理 ---
  const handleConfirm = () => {
    // 如果处于 loading 状态，则不触发回调
    if (!confirmLoading) {
      onConfirm?.()
    }
  }

  const handleCancel = () => {
    // 如果处于 loading 状态，通常仍允许取消，但也可以根据需求禁止
    // 这里保持允许取消
    onCancel?.()
  }

  return (
    <View
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      catchMove
      onClick={handleMaskClick}
    >
      {/* 弹窗内容容器，阻止冒泡避免点击内容区关闭遮罩 */}
      <View
        className='bg-white rounded-2xl overflow-hidden w-[588px] max-w-[calc(100%-32px)] mx-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题区域 */}
        {title && (
          <View className='px-5 pt-5 pb-2 text-center'>
            <View className='text-32px font-semibold text-gray-900'>{title}</View>
          </View>
        )}

        {/* 内容区域，支持自定义内容和滚动 */}
        <View
          className={`px-5 pb-3 pt-1 max-h-[70vh] overflow-y-auto ${contentClassName}`}
        >
          {children}
        </View>

        {/* 底部按钮区域 */}
        <View className='flex flex-row justify-center gap-3 px-5 pb-5 pt-2'>
          {showCancel && (
            <View
              className='w-210px text-center py-2 bg-gray-100 rounded-full text-gray-700 text-center active:bg-gray-200 transition-colors cursor-pointer min-w-[80px]'
              onClick={handleCancel}
            >
              {cancelText}
            </View>
          )}
          {confirmText && (
            <View
              // --- 按钮类名逻辑 ---
              className={`
                ${showCancel ? 'w-210px' : 'w-[85%]'} 
                text-center py-2 rounded-full text-white text-center transition-colors cursor-pointer min-w-[80px]
                // 根据 loading 状态切换背景色和手指样式
                ${confirmLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 active:bg-blue-600'}
              `}
              onClick={handleConfirm}
            >
              {/* --- 按钮文字逻辑 --- */}
              {confirmLoading ? '加载中...' : confirmText}
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

export default Modal