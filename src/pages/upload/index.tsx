import { View, Button, ScrollView, Text } from '@tarojs/components'
import { Image } from '@/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { uploadMultiImages } from '@/utils/upload'

interface PhotoItem {
  id: string
  url: string
  status: 'local' | 'uploading' | 'success' | 'fail'
}

export default function Upload() {
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [isUploading, setIsUploading] = useState(false)

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
        const MAX_SIZE = 10 * 1024 * 1024
        if (tempFiles.some(file => file.size > MAX_SIZE)) {
          Taro.showToast({ title: '单张图片大小不能超过 10MB', icon: 'none' })
          return
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

  const handleOrderSubmit = async () => {
    const pendingPhotos = photos.filter(p => p.status !== 'success')

    if (pendingPhotos.length === 0 && photos.length > 0) {
      navigateToOrder(photos)
      return
    }

    setIsUploading(true)
    Taro.showLoading({ title: '正在上传图片...', mask: true })

    try {
      const filePaths = pendingPhotos.map(p => p.url)
      setPhotos(prev => prev.map(p => p.status === 'local' ? { ...p, status: 'uploading' } : p))

      const response = await uploadMultiImages(filePaths)

      let serverDataIdx = 0
      const updatedPhotos = photos.map(p => {
        if (p.status !== 'success') {
          const serverUrl = response[serverDataIdx++]
          return {
            ...p,
            status: (serverUrl.includes("upload/") || serverUrl.includes("upload-dev/")) ? 'success' as const : 'fail' as const,
            url: serverUrl || p.url
          }
        }
        return p
      })
      setPhotos(updatedPhotos)
      Taro.hideLoading()
      setIsUploading(false)
      navigateToOrder(updatedPhotos)
    } catch (error) {
      console.error('上传失败', error)
      Taro.hideLoading()
      setIsUploading(false)
      // 将所有处于 uploading 状态的图片回滚为 local，让用户可重试
      setPhotos(prev => prev.map(p => p.status === 'uploading' ? { ...p, status: 'local' } : p))
      Taro.showToast({ title: '上传失败，请检查网络后重试', icon: 'none', duration: 2000 })
    }
  }

  const navigateToOrder = (allPhotos: PhotoItem[]) => {
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
    <View className="min-h-screen bg-gray-50 pb-8">
      {/* 顶部导航优化 */}
      <View className="pt-6 px-4 pb-3">
        <View className="text-2xl font-bold text-gray-900">📷 上传照片</View>
        <View className="text-gray-600 text-sm mt-1">
          选择照片，即可快速下单打印
        </View>
      </View>

      {/* 上传控制卡片优化 */}
      <View className="mx-4 mb-5 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <View className="p-5">
          <View className="flex items-center justify-between mb-2">
            <View className="text-base font-semibold text-gray-800">照片选择</View>
            <View className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
              已选 {photos.length}/9
            </View>
          </View>
          <View className="text-gray-500 text-sm mb-5">
            支持 JPG/PNG 格式，单张不超过 10MB
          </View>
          <Button
            className={`w-full rounded-lg py-3.5 font-medium shadow-sm transition-all ${photos.length >= 9
              ? 'bg-gray-100 text-gray-400'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99]'
              }`}
            onClick={handleChooseImages}
            disabled={photos.length >= 9 || isUploading}
          >
            {photos.length >= 9 ? '已达9张上限' : '📤 选择照片（可多选）'}
          </Button>
        </View>
      </View>

      {/* 照片预览区域 - 修复图片高度和删除按钮问题 */}
      {photos.length > 0 && (
        <View className="mx-4 mb-6">
          <View className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <View className="p-5">
              <View className="flex items-center justify-between mb-4">
                <View className="text-base font-semibold text-gray-800">已选照片</View>
                <View className="text-xs text-gray-500">点击图片可裁剪</View>
              </View>
              <ScrollView scrollY className="max-h-[420px]">
                <View className="grid grid-cols-3 gap-3.5">
                  {photos.map((photo, idx) => (
                    <View
                      key={photo.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                    >
                      {/* 修复1: 确保图片容器有明确高度（正方形） */}
                      <View className="w-full h-full h-24">
                        <Image
                          src={photo.url}
                          className="w-full h-full object-cover"
                          mode="aspectFill"
                          onClick={() => Taro.navigateTo({ url: '/pages/cropper/index' })}
                        />
                      </View>

                      {/* 核心修改: 右上角扇形删除按钮（1:1还原截图效果） */}
                      <View
                        className="absolute top-0 right-0 w-[44px] h-[44px] flex items-center justify-center z-20 active:opacity-80"
                        style={{ borderBottomLeftRadius: '100%', backgroundColor: 'rgba(0,0,0,0.9)' }}
                        onClick={(e) => handleDelete(idx, e)}
                        catchMove
                      >
                        <Text className="text-white text-lg font-bold leading-none ml-1.5 -mt-1.5">×</Text>
                      </View>

                      {/* 上传中遮罩 */}
                      {photo.status === 'uploading' && (
                        <View className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                          <View className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded animate-spin" />
                        </View>
                      )}

                      {/* 失败遮罩 */}
                      {photo.status === 'fail' && (
                        <View className="absolute inset-0 bg-red-500/70 flex flex-col items-center justify-center z-10">
                          <View className="text-white text-28px font-medium">上传失败</View>
                          <View className="text-white/90 text-[24px] mt-1">点击重试</View>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      )}

      {/* 底部按钮优化 */}
      <View className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white border-t border-gray-100">
        <Button
          className={`w-full rounded-lg py-4 font-semibold text-base shadow-md transition-all ${photos.length === 0
            ? 'bg-gray-200 text-gray-400'
            : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99]'
            }`}
          onClick={handleOrderSubmit}
          disabled={photos.length === 0 || isUploading}
        >
          {isUploading ? (
            <View className="flex items-center justify-center gap-2">
              <View className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded animate-spin" />
              <span>上传中...</span>
            </View>
          ) : (
            `🖨️ 去下单 (${photos.length}张)`
          )}
        </Button>
      </View>

      <View className="h-16" />
    </View>
  )
}