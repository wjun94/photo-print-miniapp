import { View, Button, Text } from '@tarojs/components'
import { Image } from '@/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { uploadMultiImages } from '@/utils/upload'

// 1. 重构数据结构定义
interface PhotoItem {
  id: string
  imageUrl: string
  quantity: number
  status: 'local' | 'uploading' | 'success' | 'fail'
}

export default function Upload() {
  const { params: { productId, specId } } = useRouter()
  // 2. 将 photos 修改为 items
  const [items, setItems] = useState<PhotoItem[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    Taro.eventCenter.on("/cropper", (value, index) => {
      setItems((v) => {
        v[index].imageUrl = value
        return [...v]
      })
      // items[editIdx].imageUrl = value
      // setItems([...items])
    })

    return () => {
      Taro.eventCenter.off("/cropper")
    }
  }, [])

  // 处理图片选择 (支持最多20张)
  const handleChooseImages = () => {
    const remaining = 20 - items.length
    if (remaining <= 0) {
      Taro.showToast({ title: '最多上传20张照片', icon: 'none' })
      return
    }

    Taro.chooseImage({
      count: remaining,
      sizeType: ['original'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles
        const MAX_SIZE = 20 * 1024 * 1024 // 调整为 UI 稿中的 20MB
        if (tempFiles.some(file => file.size > MAX_SIZE)) {
          Taro.showToast({ title: '单张图片大小不能超过 20MB', icon: 'none' })
          return
        }

        const newItems: PhotoItem[] = tempFiles.map((file, idx) => ({
          id: `local-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          imageUrl: file.path,
          quantity: 1, // 默认初始数量为 1
          status: 'local'
        }))

        setItems(prev => [...prev, ...newItems])
      }
    })
  }

  // 数量改变逻辑
  const handleQuantityChange = (index: number, change: number, e: any) => {
    e.stopPropagation()
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newQty = item.quantity + change
        return { ...item, quantity: newQty < 1 ? 1 : newQty }
      }
      return item
    }))
  }

  // 单张删除逻辑
  const handleDelete = (index: number, e: any) => {
    e.stopPropagation()
    if (isUploading) {
      Taro.showToast({ title: '正在上传中，请稍候', icon: 'none' })
      return
    }
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  // 一键清空逻辑
  const handleClearAll = () => {
    if (items.length === 0) return
    Taro.showModal({
      title: '提示',
      content: '确定要清空已上传的所有照片吗？',
      success: (res) => {
        if (res.confirm) {
          setItems([])
        }
      }
    })
  }

  // 提交订单逻辑
  const handleOrderSubmit = async () => {
    const pendingItems = items.filter(p => p.status !== 'success')

    if (pendingItems.length === 0 && items.length > 0) {
      navigateToOrder(items)
      return
    }

    setIsUploading(true)
    Taro.showLoading({ title: '正在上传图片...', mask: true })

    try {
      const filePaths = pendingItems.map(p => p.imageUrl)
      setItems(prev => prev.map(p => p.status === 'local' ? { ...p, status: 'uploading' } : p))

      const response = await uploadMultiImages(filePaths)

      let serverDataIdx = 0
      const updatedItems = items.map(p => {
        if (p.status !== 'success') {
          const serverUrl = response[serverDataIdx++]
          return {
            ...p,
            status: (serverUrl.includes("upload/") || serverUrl.includes("upload-dev/")) ? 'success' as const : 'fail' as const,
            imageUrl: serverUrl || p.imageUrl
          }
        }
        return p
      })
      setItems(updatedItems)
      Taro.hideLoading()
      setIsUploading(false)
      navigateToOrder(updatedItems)
    } catch (error) {
      console.error('上传失败', error)
      Taro.hideLoading()
      setIsUploading(false)
      setItems(prev => prev.map(p => p.status === 'uploading' ? { ...p, status: 'local' } : p))
      Taro.showToast({ title: '上传失败，请检查网络后重试', icon: 'none', duration: 2000 })
    }
  }

  const navigateToOrder = (allItems: PhotoItem[]) => {
    const successItems = allItems.filter(p => p.status === 'success')
    if (!successItems.length) {
      Taro.showToast({ title: '请选择并成功上传图片', icon: 'none' })
      return
    }
    Taro.navigateTo({
      url: `../confirm/index?productId=${productId}&specId=${specId}&items=${JSON.stringify(allItems.map(item => ({ imageUrl: item.imageUrl, quantity: item.quantity })))}`
    })
  }

  return (
    <View className="min-h-screen pb-24">
      {/* 顶部提示栏 */}
      <View className="px-4 py-2 flex items-center text-primary-400 bg-primary-200">
        <Text className="iconfont icon-hint mr-2 text-32px" />
        <Text className='text-28px'>支持 JPG、PNG 格式，单张不超过 20MB</Text>
      </View>

      {/* 头部计数与清空 */}
      <View className="flex justify-between items-center px-4 pt-4 pb-2">
        <View className="text-base font-bold text-gray-800">
          已上传 <Text className="text-gray-500 font-normal">({items.length} 张)</Text>
        </View>
        <View className="flex items-center text-blue-500 text-sm" onClick={handleClearAll}>
          <Text className="iconfont icon-delete mr-1 text-26px" /> 清空
        </View>
      </View>

      {/* 照片网格预览区域 */}
      <View className="px-4">
        <View className="grid grid-cols-3 gap-x-4 gap-y-6">
          {items.map((item, idx) => (
            <View key={item.id} className="flex flex-col items-center">
              {/* 图片容器 */}
              <View className="relative h-240px w-full aspect-square rounded-14px overflow-hidden bg-gray-100 shadow-sm">
                <Image
                  src={item.imageUrl}
                  className="w-full h-full rounded-14px object-cover border-1px border-solid border-gray-100"
                  onClick={() => {
                    Taro.navigateTo({ url: `/pages/cropper/index?url=${encodeURIComponent(item.imageUrl)}&idx=${idx}` })
                  }}
                />

                {/* 右上角圆形删除按钮 */}
                <View
                  className="absolute top-0 right-0 w-[44px] h-[44px] flex items-center justify-center z-20 active:opacity-80"
                  style={{ borderBottomLeftRadius: '100%', backgroundColor: 'rgba(0,0,0,0.9)' }}
                  onClick={(e) => handleDelete(idx, e)}
                  catchMove
                >
                  <Text className="text-white text-lg font-bold leading-none ml-1 -mt-1">×</Text>
                </View>

                {/* 上传中遮罩 */}
                {item.status === 'uploading' && (
                  <View className="absolute inset-0 bg-black/50 rounded-14px flex items-center justify-center z-10">
                    <View className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded animate-spin" />
                  </View>
                )}

                {/* 失败遮罩 */}
                {item.status === 'fail' && (
                  <View className="absolute inset-0 bg-red-500/70 rounded-14px flex flex-col items-center justify-center z-10">
                    <View className="text-white text-xs font-medium">失败</View>
                  </View>
                )}
              </View>

              {/* 数量加减控制器 */}
              <View className="flex items-center justify-between border border-gray-300 rounded-full w-24 px-1 py-0.5 mt-2 bg-white shadow-sm">
                <View
                  className="w-6 h-6 flex items-center justify-center text-gray-500 text-lg active:bg-gray-100 rounded-full"
                  onClick={(e) => handleQuantityChange(idx, -1, e)}
                >
                  -
                </View>
                <Text className="text-sm font-semibold text-gray-800">{item.quantity}</Text>
                <View
                  className="w-6 h-6 flex items-center justify-center text-gray-500 text-lg active:bg-gray-100 rounded-full"
                  onClick={(e) => handleQuantityChange(idx, 1, e)}
                >
                  +
                </View>
              </View>
            </View>
          ))}

          {/* 最后的 “继续上传” 虚线框占位按钮 */}
          <View
            className="flex flex-col items-center justify-center h-240px aspect-square border-1px border-dashed border-gray-300 rounded-14px bg-[#f4f5fb] active:bg-gray-100 text-gray-500"
            onClick={handleChooseImages}
          >
            <Text className='iconfont icon-camera text-60px' />
            <Text className="text-xs mt-1">继续上传</Text>
          </View>
        </View>
      </View>

      {/* 底部固定大按钮 */}
      <View className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white border-t border-gray-100 z-30">
        <Button
          className={`w-full rounded-full py-3.5 font-semibold text-base shadow-lg transition-all ${items.length === 0
            ? 'bg-blue-300 text-white'
            : 'bg-blue-600 text-white active:opacity-90'
            }`}
          onClick={handleOrderSubmit}
          disabled={items.length === 0 || isUploading}
        >
          {isUploading ? (
            <View className="flex items-center justify-center gap-2">
              <View className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded animate-spin" />
              <Text>上传中...</Text>
            </View>
          ) : (
            '完成上传'
          )}
        </Button>
      </View>
    </View>
  )
}