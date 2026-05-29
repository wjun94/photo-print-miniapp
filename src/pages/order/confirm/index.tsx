import { View, Text, Button, Input } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { Image } from '@/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useRequest } from 'ahooks'
import { orderPreview, orderSubmit } from '@/api/order'

export default function ConfirmOrder() {
    const { params } = useRouter()
    const [selectedAddress, setSelectedAddress] = useState<ADDRESS.Items | null>(null)
    const [remark, setRemark] = useState('')

    // 解析路由参数中的 items
    const getItemsParam = (): ORDER.ItemRequest[] => {
        if (!params?.items) return []
        try {
            return JSON.parse(params.items) as ORDER.ItemRequest[]
        } catch (e) {
            return []
        }
    }
    const items = getItemsParam()

    // 1. 使用 useRequest 托管订单预览接口
    const { data: previewData, loading: previewLoading } = useRequest(
        () => orderPreview({
            items,
            productId: params?.productId,
            specId: params?.specId
        }),
        {
            ready: items.length > 0, // 只有当 items 解析成功时才触发请求
            onSuccess: (res) => {
                // 初始化默认地址
                if (res?.defaultAddress) {
                    setSelectedAddress(res.defaultAddress)
                }
            },
            onError: () => {
                Taro.showToast({ title: '获取订单信息失败', icon: 'none' })
            }
        }
    )

    // 2. 使用 useRequest 托管订单提交接口
    const { run: submitOrder, loading: submitLoading } = useRequest(
        async () => {
            if (!selectedAddress) {
                Taro.showToast({ title: '请选择收货地址', icon: 'none' })
                return Promise.reject('无收货地址')
            }
            console.log(params)
            console.log(items)
            return orderSubmit({
                addressId: selectedAddress.id,
                items,
                productId: params?.productId,
                specId: params?.specId,
                remark: remark.trim()
            })
        },
        {
            manual: true, // 手动触发
            onSuccess: (res) => {
                Taro.showToast({ title: '下单成功', icon: 'success' })
                setTimeout(() => {
                    Taro.redirectTo({ url: `/pages/order/detail/index?id=${res.orderId}` })
                }, 1500)
            }
        }
    )

    // 3. 路由前置校验与事件监听
    useEffect(() => {
        if (!params?.items || items.length === 0) {
            Taro.showToast({ title: params?.items ? '参数错误' : '请从商品页进入', icon: 'none' })
            setTimeout(() => Taro.navigateBack(), 1500)
            return
        }

        const handleAddressSelect = (addr: ADDRESS.Items) => {
            setSelectedAddress(addr)
        }
        Taro.eventCenter.on("addres/select", handleAddressSelect)

        return () => {
            Taro.eventCenter.off("addres/select", handleAddressSelect)
        }
    }, [])

    const chooseAddress = () => {
        Taro.navigateTo({ url: `/pages/address/select/index?id=${selectedAddress?.id}` })
    }

    // 安全获取回显数据的默认值
    const previewList = previewData?.specs || []
    const totalAmount = previewData?.totalAmount || 0
    const freight = previewData?.freight || 0
    const actualAmount = previewData?.actualAmount || 0

    if (previewLoading) {
        return <View className='flex justify-center items-center h-screen'>加载中...</View>
    }

    return (
        <View className='bg-gray-100 min-h-screen pb-20'>
            {/* 地址卡片 */}
            <View className='bg-white mx-4 mt-4 rounded-xl p-4 flex items-start' onClick={chooseAddress}>
                {selectedAddress ? (
                    <>
                        <Text className='iconfont icon-shou text-red-500 mr-2 text-42px flex-shrink-0' />
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
                            <View className='flex justify-between h-80px'>
                                <Text className='w-380px line-clamp-2'>{item.productName}</Text>
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

                {/* 买家留言 */}
                <View className='bg-white mt-2 rounded-xl flex items-center justify-between pt-3 bt'>
                    <View className='flex items-center text-30px text-gray-800 ml-2 flex-shrink-0'>
                        <Text className='iconfont icon-remark text-gray-700 text-36px mr-2 leading-[inherit]' />
                        <Text className='font-medium'>买家留言：</Text>
                    </View>
                    <Input
                        className='text-gray-700 flex-1 text-left bg-white'
                        placeholder='选填，可以告诉商家您的特殊要求'
                        value={remark}
                        onInput={(e) => setRemark(e.detail.value)}
                        maxlength={100}
                    />
                </View>
            </View>

            {/* 合计 */}
            <View className='bg-white mx-4 mt-4 rounded-lg p-4 text-30px'>
                <View className='flex justify-between'>
                    <Text>商品金额</Text>
                    <Text>¥{totalAmount.toFixed(2)}</Text>
                </View>
                <View className='flex justify-between mt-4'>
                    <Text>运费</Text>
                    <Text>¥{freight.toFixed(2)}</Text>
                </View>
            </View>

            {/* 底部结算提交栏 */}
            <View className='fixed bottom-0 left-0 right-0 h-100px bg-white flex items-center justify-between pl-4 z-10 box-border'>
                {/* 左侧实付款 */}
                <View className='flex items-center text-30px text-gray-700'>
                    <Text>实付款：</Text>
                    <Text className='text-red-500 font-bold text-36px'>
                        ¥{actualAmount.toFixed(2)}
                    </Text>
                </View>

                {/* 右侧提交订单按钮 */}
                <Button
                    className='bg-primary-400 text-white text-32px h-full px-8 flex items-center justify-center rounded-none m-0 border-none after:border-none'
                    style={{ borderRadius: 0 }} // 覆盖Taro Button自带的微小圆角或边框
                    disabled={submitLoading}
                    onClick={submitOrder}
                >
                    {submitLoading ? '提交中...' : '提交订单'}
                </Button>
            </View>
        </View>
    )
}