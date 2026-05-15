import { View, Button, ScrollView } from '@tarojs/components'
import { Image } from '@/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { uploadFile } from '@/utils/upload'

interface UploadedPhoto {
  id: number
  image_url: string
  status: 'uploading' | 'success' | 'fail'
}

export default function Upload() {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])

  // 选择照片（多选）
  const handleChooseImages = () => {
    Taro.chooseImage({
      count: 9, // 最多9张
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFiles = res.tempFiles
        // 限制总数量（已有+新选不超过9）
        const remaining = 9 - photos.length
        const toUpload = tempFiles.slice(0, remaining)
        if (toUpload.length === 0) {
          Taro.showToast({ title: `最多上传9张照片`, icon: 'none' })
          return
        }
        // 添加占位项（上传中状态）
        const newPhotos: UploadedPhoto[] = toUpload.map((file, idx) => ({
          id: -Date.now() - idx, // 临时负ID
          image_url: file.path,
          status: 'uploading'
        }))
        setPhotos([...photos, ...newPhotos])

        // 并发上传（限制同时5个）
        await uploadMultiple(toUpload, newPhotos)
      }
    })
  }

  // 并发上传控制
  const uploadMultiple = async (files: Taro.chooseImage.ImageFile[], placeholders: UploadedPhoto[]) => {
    const concurrency = 5
    const results: UploadedPhoto[] = []
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency)
      const batchPlaceholders = placeholders.slice(i, i + concurrency)
      const promises = batch.map((file, idx) => uploadFile(file.path).then(res => ({
        ...batchPlaceholders[idx],
        image_url: res.url,
        status: 'success' as const
      })).catch(err => ({
        ...batchPlaceholders[idx],
        status: 'fail' as const,
        error: err.message
      })))
      const batchResults = await Promise.all(promises)
      results.push(...batchResults)
      // 实时更新状态
      setPhotos(prev => {
        const newList = [...prev]
        for (let j = 0; j < batchResults.length; j++) {
          const idx = newList.findIndex(p => p.id === batchPlaceholders[j].id)
          if (idx !== -1) newList[idx] = batchResults[j]
        }
        return newList
      })
    }
  }

  // 删除照片
  const handleDelete = (index: number) => {
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

  // 去下单（至少选择一张成功的照片）
  const goToOrder = () => {
    const successPhotos = photos.filter(p => p.status === 'success')
    if (successPhotos.length === 0) {
      Taro.showToast({ title: '请至少上传一张照片', icon: 'none' })
      return
    }
    const photoIds = successPhotos.map(p => p.id)
    const photoUrls = successPhotos.map(p => p.image_url)
    Taro.navigateTo({
      url: `/pages/order/create/index?photoIds=${photoIds.join(',')}&photoUrls=${encodeURIComponent(photoUrls.join(','))}`
    })
  }

  return (
    <View className='p-4 min-h-screen bg-gray-100'>
      <View className='bg-white rounded-lg p-4 mb-4'>
        <View className='text-lg font-bold mb-2'>上传照片</View>
        <View className='text-gray-500 text-sm mb-4'>支持 JPG/PNG，单张不超过5MB，最多9张</View>
        <Button
          className='bg-blue-500 text-white py-2 rounded-lg'
          onClick={handleChooseImages}
          disabled={photos.length >= 9}
        >
          {photos.length >= 9 ? '已达上限' : '选择照片（可多选）'}
        </Button>
      </View>

      {photos.length > 0 && (
        <ScrollView className='bg-white rounded-lg p-4' scrollY style={{ maxHeight: '70vh' }}>
          <View className='text-md font-bold mb-2'>已上传照片</View>
          <View className='grid grid-cols-3 gap-2'>
            {photos.map((photo, idx) => (
              <View key={photo.id} className='relative'>
                <Image
                  src={photo.image_url}
                  className='w-full h-32 object-cover rounded-lg'
                  mode='aspectFill'
                />
                <View
                  className='absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs'
                  onClick={() => handleDelete(idx)}
                  style={{ lineHeight: '24px', textAlign: 'center' }}
                >
                  ×
                </View>
                {photo.status === 'uploading' && (
                  <View className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg'>
                    <View className='text-white text-xs'>上传中...</View>
                  </View>
                )}
                {photo.status === 'fail' && (
                  <View className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg'>
                    <View className='text-white text-xs'>失败</View>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {photos.some(p => p.status === 'success') && (
        <Button className='bg-green-500 text-white py-3 rounded-lg mt-4' onClick={goToOrder}>
          去下单（{photos.filter(p => p.status === 'success').length}张）
        </Button>
      )}
    </View>
  )
}