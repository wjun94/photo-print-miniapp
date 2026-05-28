import { View, Text, Button, Input } from '@tarojs/components'
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
    // 1. 新增买家留言的状态
    const [remark, setRemark] = useState('')

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

        // 2. 统一使用一个地址选择的事件监听（修复了原本拼写错误并合并逻辑）
        const handleAddressSelect = (addr: ADDRESS.Items) => {
            setSelectedAddress(addr)
        }
        Taro.eventCenter.on("addressSelected", handleAddressSelect)

        return () => {
            Taro.eventCenter.off("addressSelected", handleAddressSelect)
        }
    }, [])

    const fetchPreview = async (items: ORDER.ItemRequest[]) => {
        try {
            const res = await orderPreview({ items, productId: params?.productId, specId: params?.specId })
            setPreviewList(res.specs || [])
            setTotalAmount(res.totalAmount)
            setSelectedAddress(res.defaultAddress)
        } catch (err) {
            Taro.showToast({ title: '获取订单信息失败', icon: 'none' })
        } finally {
            setLoading(false)
        }
    }

    const chooseAddress = () => {
        Taro.navigateTo({ url: `/pages/address/select/index?id=${selectedAddress?.id}` })
    }

    const submitOrder = async () => {
        if (!selectedAddress) {
            Taro.showToast({ title: '请选择收货地址', icon: 'none' })
            return
        }
        try {
            // 3. 在提交时，将 remark 传递给接口
            const res = await orderSubmit({
                addressId: selectedAddress.id,
                items: items,
                productId: params?.productId, 
                specId: params?.specId,
                remark: remark.trim() // 去除前后空格
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
            <View className='bg-white mx-4 mt-4 rounded-xl p-4 flex items-start' onClick={chooseAddress}>
                {selectedAddress ? (
                    <>
                        <Text className='iconfont icon-shou text-red-500 mr-3 text-42px flex-shrink-0' />
                        <View className='flex-1'>
                            <View className='flex items-center mb-2 text-36px font-bold text-gray-900'>
                                <Text className='mr-4'>{selectedAddress.receiverName}</Text>
                                <Text>{selectedAddress.mobile}</Text>
                            </View>
                            <View className='text-28px text-gray-600 leading-relaxed'>
                                {selectedAddress.provinceName} {selectedAddress.cityName} {selectedAddress.districtName} {selectedAddress.detail} {selectedAddress.doorplate}
                            </View>
                        </View>
                    </>
                ) : (
                    <View className='flex items-center justify-center flex-col w-full text-gray-400'>
                        <Text className='iconfont icon-location text-64px' />
                        <View className='text-center py-2 w-full text-28px'>请选择收货地址</View>
                    </View>
                )}
            </View>

            {/* 商品列表 */}
            <View className='bg-white mx-4 mt-4 rounded-lg p-4'>
                <View className='font-bold mb-2'>商品明细</View>
                {previewList.map((item, idx) => (
                    <View key={idx} className='flex py-2 border-b last:border-0'>
                        <Image src={item.imageUrl} className='w-20 h-20 border-1px border-solid border-gray-200 rounded-12px mr-3' mode='aspectFill' />
                        <View className='flex-1'>
                            <View className='flex justify-between'>
                                <Text className='font-medium'>{item.productName}</Text>
                                <Text>x{item.totalQuantity}</Text>
                            </View>
                            <Text className='text-gray-500 text-sm'>规格：{item.specName}</Text>
                            <View className='flex justify-between mt-1'>
                                <Text className='text-red-500'>¥{item.price.toFixed(2)}</Text>
                                <Text className='text-gray-400'>小计：¥{item.totalSubtotal.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                ))}

                {/* 4. 修改买家留言卡片：替换为 Input 输入框 */}
                <View className='bg-white mt-2 rounded-xl flex items-center justify-between pt-3 bt'>
                    <View className='flex items-center text-30px text-gray-800 ml-2 flex-shrink-0'>
                        <Text className='iconfont icon-remark text-gray-700 text-36px mr-2 leading-[inherit]' />
                        <Text className='font-medium'>买家留言：</Text>
                    </View>
                    {/* 使用 Taro 的 Input 组件 */}
                    <Input
                        className='text-gray-700 flex-1 text-left bg-white'
                        placeholder='选填，可以告诉商家您的特殊要求'
                        value={remark}
                        onInput={(e) => setRemark(e.detail.value)}
                        maxlength={100} // 限制留言字数，防止后端字段溢出
                    />
                </View>
            </View>

            {/* 合计 */}
            <View className='bg-white mx-4 mt-4 rounded-lg p-4'>
                <View className='flex justify-between'>
                    <Text>合计</Text>
                    <Text className='text-red-500 font-bold'>¥{totalAmount.toFixed(2)}</Text>
                </View>
            </View>

            {/* 提交按钮 */}
            <View className='fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 z-10'>
                <Button className='bg-primary-400 text-white rounded-full w-full' onClick={submitOrder}>
                    提交订单
                </Button>
            </View>
        </View>
    )
}