import { View, Text, Button } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { Image } from '@/components'
import Taro from '@tarojs/taro'
import { orderPreview, orderSubmit } from '@/api/order'

export default function ConfirmOrder() {
    const params = Taro.getCurrentInstance().router?.params
    const [items, setItems] = useState<ORDER.ItemRequest[]>([])
    const [previewList, setPreviewList] = useState<ORDER.PreviewItem[]>([])
    const [totalAmount, setTotalAmount] = useState(0)
    const [selectedAddress, setSelectedAddress] = useState<ADDRESS.Items | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // 从上一页获取 items 数组（路由参数或全局状态）
        if (params?.items) {
            try {
                const parsedItems = JSON.parse(params.items) as ORDER.ItemRequest[]
                setItems(parsedItems)
                fetchPreview(parsedItems)
            } catch (e) {
                Taro.showToast({ title: '参数错误', icon: 'none' })
                Taro.navigateBack()
            }
        } else {
            Taro.showToast({ title: '请从商品页进入', icon: 'none' })
            Taro.navigateBack()
        }
    }, [])

    // 监听地址选择结果（从地址列表页返回）
    useEffect(() => {
        const handler = (data: { address: ADDRESS.Items }) => {
            setSelectedAddress(data.address)
        }
        Taro.eventCenter.on('addressSelected', handler)
        return () => {
            Taro.eventCenter.off('addressSelected', handler)
        }
    }, [])

    const fetchPreview = async (items: ORDER.ItemRequest[]) => {
        try {
            const res = await orderPreview({ items, productId: params?.productId, specId: params?.specId })
            setPreviewList(res.items)
            setTotalAmount(res.totalAmount)
            setSelectedAddress(res.defaultAddress)
        } catch (err) {
            Taro.showToast({ title: '获取订单信息失败', icon: 'none' })
        } finally {
            setLoading(false)
        }
    }

    const chooseAddress = () => {
        Taro.navigateTo({ url: '/pages/address/list?selectMode=true' })
    }

    const submitOrder = async () => {
        if (!selectedAddress) {
            Taro.showToast({ title: '请选择收货地址', icon: 'none' })
            return
        }
        try {
            const res = await orderSubmit({
                addressId: selectedAddress.id,
                items: items
            })
            Taro.showToast({ title: '下单成功', icon: 'success' })
            setTimeout(() => {
                Taro.redirectTo({ url: `/pages/order/detail/index?id=${res.orderId}` })
            }, 1500)
        } catch (err) {
            // 错误已在 request 中处理
        }
    }

    if (loading) {
        return <View className='flex justify-center items-center h-screen'>加载中...</View>
    }

    return (
        <View className='bg-gray-100 min-h-screen pb-20'>
            {/* 地址卡片 */}
            <View className='bg-white mx-4 mt-4 rounded-lg p-4' onClick={chooseAddress}>
                {selectedAddress ? (
                    <>
                        <View className='flex justify-between mb-2'>
                            <Text className='font-bold'>{selectedAddress.receiverName}</Text>
                            <Text>{selectedAddress.mobile}</Text>
                        </View>
                        <View className='text-gray-600'>
                            {selectedAddress.provinceName} {selectedAddress.cityName} {selectedAddress.districtName} {selectedAddress.detail} {selectedAddress.doorplate}
                        </View>
                    </>
                ) : (
                    <View className='text-center py-2 text-gray-400'>请选择收货地址</View>
                )}
                <View className='text-right text-gray-400 mt-2'>修改 &gt;</View>
            </View>

            {/* 商品列表 */}
            <View className='bg-white mx-4 mt-4 rounded-lg p-4'>
                <View className='font-bold mb-2'>商品明细</View>
                {previewList.map((item, idx) => (
                    <View key={idx} className='flex py-2 border-b last:border-0'>
                        <Image src={item.imageUrl} className='w-20 h-20 rounded-8px mr-3' mode='aspectFill' />
                        <View className='flex-1'>
                            <View className='flex justify-between'>
                                <Text className='font-medium'>{item.productName}</Text>
                                <Text>x{item.quantity}</Text>
                            </View>
                            <Text className='text-gray-500 text-sm'>规格：{item.specName}</Text>
                            <View className='flex justify-between mt-1'>
                                <Text className='text-red-500'>¥{item.price.toFixed(2)}</Text>
                                <Text className='text-gray-400'>小计：¥{item.subtotal.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </View>

            {/* 合计 */}
            <View className='bg-white mx-4 mt-4 rounded-lg p-4'>
                <View className='flex justify-between'>
                    <Text>合计</Text>
                    <Text className='text-red-500 font-bold'>¥{totalAmount.toFixed(2)}</Text>
                </View>
            </View>

            {/* 提交按钮 */}
            <View className='fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3'>
                <Button className='bg-primary-400 text-white rounded-full w-full' onClick={submitOrder}>
                    提交订单
                </Button>
            </View>
        </View>
    )
}