import { View, Button, ScrollView } from '@tarojs/components'
import { Image } from '@/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { uploadMultiImages } from '@/utils/upload'

interface PhotoItem {
  id: string          // 临时本地ID，用于删除和渲染
  url: string         // 渲染使用的路径：初始为本地临时路径，上传成功后替换为服务器URL
  status: 'local' | 'uploading' | 'success' | 'fail'
}

export default function Upload() {
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // 1. 选择照片（纯本地保存，不触发上传）
  const handleChooseImages = () => {
    const remaining = 9 - photos.length
    if (remaining <= 0) {
      Taro.showToast({ title: '最多上传9张照片', icon: 'none' })
      return
    }

    Taro.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        // 1. 检查是否有文件超过大小限制
        const hasOversized = tempFiles.some(file => file.size > MAX_SIZE);
        if (hasOversized) {
          Taro.showToast({
            title: '单张图片大小不能超过 10MB',
            icon: 'none'
          });
          return; // 直接拦截，不进行后续的 setPhotos
        }

        const newPhotos: PhotoItem[] = tempFiles.map((file, idx) => ({
          id: `local-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          url: file.path,
          status: 'local'
        }))

        setPhotos(prev => [...prev, ...newPhotos])
      }
    })
  }

  // 2. 删除照片
  const handleDelete = (index: number, e: any) => {
    e.stopPropagation()
    if (isUploading) {
      Taro.showToast({ title: '正在上传中，请稍候', icon: 'none' })
      return
    }
    Taro.showModal({
      title: '提示',
      content: '确定删除这张照片吗？',
      success: (res) => {
        if (res.confirm) {
          setPhotos(prev => prev.filter((_, i) => i !== index))
        }
      }
    })
  }

  // 3. 点击“去下单”（统一触发上传并跳转）
  const handleOrderSubmit = async () => {
    const pendingPhotos = photos.filter(p => p.status !== 'success')

    // 如果全部都已经成功了，直接走跳转逻辑
    if (pendingPhotos.length === 0 && photos.length > 0) {
      navigateToOrder(photos)
      return
    }

    setIsUploading(true)
    Taro.showLoading({ title: '正在上传图片...', mask: true })

    const filePaths = pendingPhotos.map(p => p.url)

    // 将整体状态更新为“上传中”
    setPhotos(prev => prev.map(p => p.status === 'local' ? { ...p, status: 'uploading' } : p))

    // 这里的 response 明确为 string[]
    const response = await uploadMultiImages(filePaths)

    let serverDataIdx = 0
    const updatedPhotos = photos.map(p => {
      // 只更新本次参与上传（状态为 uploading 或 fail）的图片
      if (p.status !== 'success') {
        const serverUrl = response[serverDataIdx++]
        return {
          ...p,
          status: serverUrl.includes("/upload") ? 'success' as const : 'fail' as const,
          url: serverUrl || p.url // 上传成功后，将本地临时路径替换为服务器真实 URL
        }
      }
      return p
    })
    setPhotos(updatedPhotos)
    Taro.hideLoading()
    setIsUploading(false)

    // 携带最新的服务器 URL 列表跳转
    navigateToOrder(updatedPhotos)
  }

  // 4. 跳转下单页封装
  const navigateToOrder = (allPhotos: PhotoItem[]) => {
    // 过滤出所有上传成功的服务器 URL
    const successPhotoUrls = allPhotos
      .filter(p => p.status === 'success')
      .map(p => p.url)
    if (!successPhotoUrls.length) {
      Taro.showToast({ title: '请上传图片', icon: 'none' })
      return
    }
    Taro.navigateTo({
      url: `/pages/order/create/index?photoUrls=${encodeURIComponent(successPhotoUrls.join(','))}`
    })
  }

  return (
    <View className="p-4 min-h-screen bg-gray-100">
      {/* 上传控制卡片 */}
      <View className="bg-white rounded-xl p-4 mb-4">
        <View className="text-lg font-bold mb-2 text-gray-800">上传照片</View>
        <View className="text-gray-400 text-sm mb-4">
          支持 JPG/PNG，最多9张（当前已选 {photos.length}/9）
        </View>
        <Button
          className={`w-full border-none transition-colors ${photos.length >= 9
            ? 'bg-gray-300 text-white'
            : 'bg-blue-500 text-white active:bg-blue-600'
            }`}
          onClick={handleChooseImages}
          disabled={photos.length >= 9 || isUploading}
        >
          {photos.length >= 9 ? '已达上限' : '选择照片（可多选）'}
        </Button>
      </View>

      {/* 照片预览区域 */}
      {photos.length > 0 && (
        <ScrollView className="bg-white rounded-xl p-4" scrollY>
          <View className="text-base font-bold mb-3 text-gray-800">已选照片</View>

          {/* Grid 布局：一行三列 */}
          <View className="grid grid-cols-3 gap-2">
            {photos.map((photo, idx) => (
              <View key={photo.id} className="relative h-28 w-full">
                <Image
                  src={photo.url}
                  className="w-full h-full rounded-lg object-cover"
                  mode="aspectFill"
                  onClick={() => Taro.navigateTo({ url: '/pages/cropper/index' })}
                />

                {/* 删除按钮 */}
                <View
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs z-10 active:opacity-80"
                  onClick={(e) => handleDelete(idx, e)}
                >
                  ×
                </View>

                {/* 上传中遮罩 */}
                {photo.status === 'uploading' && (
                  <View className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <View className="text-white text-xs">上传中...</View>
                  </View>
                )}

                {/* 失败遮罩 */}
                {photo.status === 'fail' && (
                  <View className="absolute inset-0 bg-red-500 bg-opacity-60 flex items-center justify-center rounded-lg">
                    <View className="text-white text-xs font-medium">失败(重试)</View>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* 固定到底部的去下单按钮 */}
      <View className="mt-6 px-1">
        <Button
          className={`w-full rounded-lg py-1 transition-all ${photos.length === 0
            ? 'bg-gray-500 text-gray-400'
            : 'bg-emerald-500 text-white active:bg-emerald-600 shadow-md'
            }`}
          onClick={handleOrderSubmit}
          disabled={photos.length === 0 || isUploading}
        >
          {isUploading ? '正在提交...' : `去下单 (${photos.length}张)`}
        </Button>
      </View>
    </View>
  )
}