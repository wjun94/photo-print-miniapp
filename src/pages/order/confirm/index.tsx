import { View, Text, Image, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { orderPreview, orderSubmit } from '@/api/order'

interface PreviewData {
    product: {
        id: string
        name: string
        coverImage: string
        description: string
    }
    spec: {
        id: string
        name: string
        price: number
        stock: number
    }
    quantity: number
    totalAmount: number
    address: {
        id: string
        receiverName: string
        mobile: string
        provinceName: string
        cityName: string
        districtName: string
        detail: string
        doorplate: string
    } | null
}

export default function OrderConfirm() {
    const router = useRouter()
    const { productId, specId, quantity } = router.params
    const [preview, setPreview] = useState<PreviewData | null>(null)
    const [selectedAddressId, setSelectedAddressId] = useState<string>('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (productId && specId && quantity) {
            fetchPreview()
        } else {
            Taro.showToast({ title: '参数错误', icon: 'none' })
            setTimeout(() => Taro.navigateBack(), 1500)
        }
    }, [])

    const fetchPreview = async () => {
        try {
            const data = await orderPreview({ productId, specId, quantity: parseInt(quantity || '0') })
            setPreview(data)
            if (data.address) {
                setSelectedAddressId(data.address.id)
            }
        } catch (err) {
            Taro.showToast({ title: '获取订单信息失败', icon: 'none' })
        }
    }

    const chooseAddress = () => {
        Taro.navigateTo({
            url: '/pages/address/list?select=true',
            events: {
                acceptAddress: (address: any) => {
                    setSelectedAddressId(address.id)
                }
            }
        })
    }

    const submitOrder = async () => {
        if (!selectedAddressId) {
            Taro.showToast({ title: '请选择收货地址', icon: 'none' })
            return
        }
        if (!preview) return
        setSubmitting(true)
        try {
            const res = await orderSubmit({
                addressId: selectedAddressId,
                productId: preview.product.id,
                specId: preview.spec.id,
                quantity: preview.quantity
            })
            Taro.showToast({ title: '下单成功', icon: 'success' })
            setTimeout(() => {
                Taro.redirectTo({ url: `/pages/order/detail/index?id=${res.orderId}` })
            }, 1500)
        } catch (err) {
            Taro.showToast({ title: err.message || '下单失败', icon: 'none' })
        } finally {
            setSubmitting(false)
        }
    }

    if (!preview) return <View className='text-center py-10'>加载中...</View>

    return (
        <View className='bg-gray-100 min-h-screen p-4'>
            {/* 地址卡片 */}
            <View className='bg-white rounded-lg p-4 mb-3' onClick={chooseAddress}>
                {preview.address && selectedAddressId ? (
                    <>
                        <View className='flex justify-between'>
                            <Text className='font-bold'>{preview.address.receiverName}</Text>
                            <Text>{preview.address.mobile}</Text>
                        </View>
                        <Text className='text-gray-500 text-sm mt-1'>
                            {preview.address.provinceName} {preview.address.cityName} {preview.address.districtName} {preview.address.detail} {preview.address.doorplate}
                        </Text>
                    </>
                ) : (
                    <View className='text-center py-2 text-blue-500'>请选择收货地址</View>
                )}
            </View>

            {/* 商品卡片 */}
            <View className='bg-white rounded-lg p-3 flex'>
                <Image src={preview.product.coverImage} className='w-24 h-24 rounded mr-3' mode='aspectFill' />
                <View className='flex-1'>
                    <Text className='font-bold'>{preview.product.name}</Text>
                    <Text className='text-gray-500 text-sm mt-1'>规格：{preview.spec.name}</Text>
                    <View className='flex justify-between mt-2'>
                        <Text className='text-red-500'>¥{preview.spec.price}</Text>
                        <Text>x{preview.quantity}</Text>
                    </View>
                </View>
            </View>

            {/* 总价 */}
            <View className='bg-white rounded-lg p-4 mt-3 flex justify-between'>
                <Text>共{preview.quantity}件商品，合计：</Text>
                <Text className='text-red-500 font-bold'>¥{preview.totalAmount.toFixed(2)}</Text>
            </View>

            {/* 提交按钮 */}
            <Button
                className='bg-red-500 text-white py-3 rounded-full mt-6'
                onClick={submitOrder}
                disabled={submitting}
            >
                {submitting ? '提交中...' : '提交订单'}
            </Button>
        </View>
    )
}