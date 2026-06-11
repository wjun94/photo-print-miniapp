import { View, Text, ITouchEvent } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useRef } from 'react'

interface BottomSheetProps {
  /** 是否显示 */
  visible: boolean
  /** 标题 */
  title?: string
  /** 关闭回调 */
  onClose: () => void
  /** 是否允许点击遮罩层关闭 */
  closeOnClickOverlay?: boolean
  /** 是否启用手势向下滑动关闭 */
  enableDragClose?: boolean
  /** 自定义内容区样式类 */
  contentClassName?: string
  /** 子组件 */
  children: React.ReactNode
}

export default function BottomSheet(props: BottomSheetProps) {
  const {
    visible,
    title,
    onClose,
    closeOnClickOverlay = true,
    enableDragClose = true,
    contentClassName = '',
    children
  } = props

  // 管理弹窗的渲染状态（解决动画结束后卸载DOM）
  const [isRendered, setIsRendered] = useState(visible)
  // 控制弹窗主体的动画状态
  const [isAnimating, setIsAnimating] = useState(false)

  // 手势拖拽相关状态
  const touchStartY = useRef(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // 处理显示/隐藏状态变化
  useEffect(() => {
    if (visible) {
      // 1. 确保DOM已渲染
      setIsRendered(true)
      // 2. 延迟触发动画（使transition生效）
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    } else if (isRendered) {
      // 触发关闭动画
      setIsAnimating(false)
      // 动画结束后卸载组件
      const timer = setTimeout(() => {
        setIsRendered(false)
        setDragOffset(0)
      }, 300) // 与CSS transition-duration一致
      return () => clearTimeout(timer)
    }
  }, [visible])

  // 遮罩层点击处理
  const handleOverlayClick = () => {
    if (closeOnClickOverlay && !isDragging) onClose()
  }

  // --- 手势拖拽逻辑 ---
  const handleTouchStart = (e: ITouchEvent) => {
    if (!enableDragClose) return
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: ITouchEvent) => {
    if (!enableDragClose || !isDragging) return

    const currentY = e.touches[0].clientY
    const deltaY = currentY - touchStartY.current

    // 仅允许向下拖拽（正值表示向下移动）
    if (deltaY > 0) {
      // 限制最大拖拽距离为屏幕高度的50%
      const maxDrag = Taro.getSystemInfoSync().windowHeight * 0.5
      setDragOffset(Math.min(deltaY, maxDrag))
    }
  }

  const handleTouchEnd = () => {
    if (!enableDragClose || !isDragging) return

    setIsDragging(false)
    // 拖拽距离超过阈值则关闭
    if (dragOffset > 80) {
      onClose()
    } else {
      // 弹回原位
      setDragOffset(0)
    }
  }

  if (!isRendered) return null

  return (
    <View className="fixed inset-0 z-50">
      {/* 遮罩层 - 优化了动画衔接 */}
      <View
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${isAnimating ? 'opacity-50' : 'opacity-0 pointer-events-none'}`}
        onClick={handleOverlayClick}
        catchMove
      />

      {/* 弹窗主体 - 重构动画逻辑 */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] transition-transform duration-300 ease-out pb-safe"
        style={{
          // 核心优化：明确设置初始/结束状态
          transform: isDragging
            ? `translateY(${dragOffset}px)`
            : (isAnimating ? 'translateY(0)' : 'translateY(100%)'),
          // 拖拽时禁用过渡效果
          transitionProperty: isDragging ? 'none' : 'transform'
        }}
        onTouchStart={handleTouchStart as any}
        onTouchMove={handleTouchMove as any}
        onTouchEnd={handleTouchEnd}
        catchMove
      >
        {/* 拖拽手柄 & 标题区 */}
        <View className="pt-3 pb-4 flex flex-col items-center">
          {enableDragClose && (
            <>
              {/* <View className="w-12 h-1.5 bg-gray-300 rounded-full mb-4" /> */}
            </>
          )}

          <View className="w-full px-4 flex items-center justify-between">
            <View className="w-6" />
            {title && (
              <Text className="text-gray-900 font-medium text-lg">{title}</Text>
            )}
            <View
              className="w-6 h-6 mr-20px flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full"
              onClick={onClose}
            >
              <Text className="text-xl leading-none">✕</Text>
            </View>
          </View>
        </View>

        {/* 内容区域 */}
        <View className={`flex-1 overflow-y-auto px-4 ${contentClassName}`}>
          {children}
        </View>
      </View>
    </View>
  )
}