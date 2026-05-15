import { View, Input, Textarea, Button, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { createOrder } from '@/api/order'
import { SPECS, PRICES } from '@/constants'
import { Image } from '@/components'

interface OrderPhotoItem {
  imageUrl: string
  spec: string
  quantity: number
  price: number
}

export default function CreateOrder() {
  const router = useRouter()
  const { photoUrls } = router.params

  const [items, setItems] = useState<OrderPhotoItem[]>([])
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!photoUrls) {
      Taro.showToast({ title: '请先上传照片', icon: 'none' })
      setTimeout(() => Taro.navigateBack(), 1500)
      return
    }
    const urls = decodeURIComponent(photoUrls).split(',')
    const initialItems = urls.map((img) => ({
      imageUrl: img,
      spec: SPECS[0],
      quantity: 1,
      price: PRICES[SPECS[0]]
    }))
    setItems(initialItems)
  }, [photoUrls])

  const updateItem = (index: number, field: keyof OrderPhotoItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'spec') {
      newItems[index].price = PRICES[value]
    }
    setItems(newItems)
  }

  const handleSubmit = async () => {
    if (!address.trim()) {
      Taro.showToast({ title: '请填写收货地址', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      const orderItems: ORDER.CreateItem[] = items.map(item => ({
        imageUrl: item.imageUrl,
        spec: item.spec,
        quantity: item.quantity,
        price: item.price
      }))
      const order = await createOrder({ address, items: orderItems })
      Taro.showToast({ title: '下单成功', icon: 'success' })
      setTimeout(() => {
        Taro.redirectTo({ url: `/pages/order/detail/index?id=${order.id}` })
      }, 1500)
    } catch (err) {
      // error handled in request
    } finally {
      setSubmitting(false)
    }
  }

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)

  return (
    <View className='p-4 min-h-screen bg-gray-100'>
      {items.map((item, idx) => (
        <View key={item.imageUrl} className='bg-white rounded-lg p-4 mb-4'>
          <View className='text-lg font-bold mb-2'>照片 {idx + 1}</View>
          <Image
            src={item.imageUrl}
            className='w-full h-40 object-cover rounded-lg mb-2'
            mode='aspectFill'
            preview
          />
          <View className='mb-3'>
            <View className='text-sm text-gray-600 mb-1'>选择规格</View>
            <Picker mode='selector' range={SPECS} onChange={(e) => updateItem(idx, 'spec', SPECS[e.detail.value])}>
              <View className='border rounded-lg p-2 bg-gray-50'>{item.spec}</View>
            </Picker>
          </View>
          <View className='mb-3'>
            <View className='text-sm text-gray-600 mb-1'>数量</View>
            <Input
              type='number'
              value={String(item.quantity)}
              onInput={(e) => updateItem(idx, 'quantity', parseInt(e.detail.value) || 1)}
              className='border rounded-lg p-2 bg-gray-50'
            />
          </View>
        </View>
      ))}

      <View className='bg-white rounded-lg p-4 mb-4'>
        <View className='text-lg font-bold mb-2'>收货信息</View>
        <Textarea
          placeholder='请填写详细地址'
          value={address}
          onInput={(e) => setAddress(e.detail.value)}
          className='border rounded-lg p-2 bg-gray-50 min-h-[80px]'
        />
      </View>

      <View className='bg-white rounded-lg p-4 mb-4'>
        <View className='flex justify-between'>
          <View className='text-gray-600'>总金额</View>
          <View className='text-red-500 font-bold'>¥{totalPrice}</View>
        </View>
      </View>

      <Button
        className='bg-blue-500 text-white py-3 rounded-lg'
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? '提交中...' : '提交订单'}
      </Button>
    </View>
  )
}