import { View, Text, Button, Input } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { Image } from '@/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useRequest } from 'ahooks'
import { orderPreview, orderSubmit } from '@/api/order'

// 定义统一的解包后的参数结构
interface FlattenedParams {
    productId?: string
    specId?: string
    skuKey?: string
    quantity?: number // 普通购买来源
    price?: number
    couponId?: string
    items?: ORDER.ItemRequest[] // 上传照片定制来源
}

export default function ConfirmOrder() {
    const router = useRouter()
    const [selectedAddress, setSelectedAddress] = useState<ADDRESS.Items | null>(null)
    const [remark, setRemark] = useState('')

    // 存储打平解码后的真实业务核心参数
    const [bizParams, setBizParams] = useState<FlattenedParams | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)

    // 1. 核心解析逻辑：从 router.params.params 中解密数据
    useEffect(() => {
        if (router.params?.params) {
            try {
                const decodedJson = JSON.parse(decodeURIComponent(router.params.params)) as FlattenedParams
                setBizParams(decodedJson)
            } catch (e) {
                console.error('ConfirmOrder 路由参数解析失败:', e)
                Taro.showToast({ title: '核心订单参数异常', icon: 'none' })
            }
        }
        setIsInitialized(true)
    }, [router.params])

    // 2. 动态兼容并构建后端需要的标准的 items 请求数组
    const getNormalizedItems = (): ORDER.ItemRequest[] => {
        if (!bizParams) return []

        // 来源 A：如果是从照片上传页过来的，直接采用拼好的 items 数组
        if (bizParams.items && bizParams.items.length > 0) {
            return bizParams.items
        }

        // 来源 B：如果是 SKU 弹窗普通商品直接直达的，包装成单项
        if (bizParams.productId) {
            return [{
                imageUrl: '', // 普通商品无单独定制图
                quantity: bizParams.quantity || 1
            }]
        }

        return []
    }
    const finalItems = getNormalizedItems()

    // 3. 使用 useRequest 托管订单预览接口
    const { data: previewData, loading: previewLoading } = useRequest(
        () => orderPreview({
            items: finalItems,
            ...bizParams,
        }),
        {
            // 只有当参数解析完毕，且组合出合法的 items 之后才去触发请求
            ready: isInitialized && finalItems.length > 0,
            refreshDeps: [bizParams], // 依赖 bizParams 的建立
            onSuccess: (res) => {
                // 初始化默认收货地址
                if (res?.defaultAddress) {
                    setSelectedAddress(res.defaultAddress)
                }
            },
            onError: (err) => {
                console.error('订单预览失败：', err)
                Taro.showToast({ title: '获取订单信息失败', icon: 'none' })
            }
        }
    )

    // 4. 使用 useRequest 托管订单提交接口
    const { run: submitOrder, loading: submitLoading } = useRequest(
        async () => {
            if (!selectedAddress) {
                Taro.showToast({ title: '请选择收货地址', icon: 'none' })
                return Promise.reject('无收货地址')
            }
            if (!bizParams || finalItems.length === 0) {
                Taro.showToast({ title: '订单数据丢失，请重新下单', icon: 'none' })
                return Promise.reject('参数丢失')
            }
            return orderSubmit({
                ...bizParams,
                addressId: selectedAddress.id,
                items: finalItems,
                productId: bizParams.productId,
                specId: bizParams.specId,
                remark: remark.trim()
            })
        },
        {
            manual: true, // 手动点击触发
            onSuccess: (res) => {
                Taro.showToast({ title: '下单成功', icon: 'success' })
                setTimeout(() => {
                    Taro.redirectTo({ url: `/pages/order/detail/index?id=${res.orderId}` })
                }, 1500)
            }
        }
    )

    // 5. 路由拦截前置校验与地址选择事件监听
    useEffect(() => {
        // 全局广播：接收地址选择页传回来的地址对象
        const handleAddressSelect = (addr: ADDRESS.Items) => {
            setSelectedAddress(addr)
        }
        Taro.eventCenter.on("addres/select", handleAddressSelect)

        return () => {
            Taro.eventCenter.off("addres/select")
        }
    }, [])

    // 6. 参数未就绪时的拦截退回提示
    useEffect(() => {
        if (isInitialized && (!router.params?.params || finalItems.length === 0)) {
            Taro.showToast({ title: '无法获取有效的商品规格', icon: 'none' })
            setTimeout(() => Taro.navigateBack(), 1500)
        }
    }, [isInitialized, bizParams])

    const chooseAddress = () => {
        Taro.navigateTo({ url: `/pages/address/select/index?id=${selectedAddress?.id}` })
    }

    // 安全获取回显数据的默认值
    const previewList = previewData?.specs || []
    const totalAmount = previewData?.totalAmount || 0
    const freight = previewData?.freight || 0
    const actualAmount = previewData?.actualAmount || 0

    // 页面骨架或加载中状态
    if (previewLoading || !isInitialized) {
        return <View className='flex justify-center items-center h-screen text-gray-500 text-sm'>加载订单中...</View>
    }

    return (
        <View className='bg-gray-100 min-h-screen pb-24'>
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
                    <View className='flex items-center justify-center flex-col w-full text-gray-400 py-4'>
                        <Text className='iconfont icon-location text-64px' />
                        <View className='text-center py-2 w-full text-28px'>请选择收货地址</View>
                    </View>
                )}
            </View>

            {/* 商品列表 */}
            <View className='bg-white mx-4 mt-4 rounded-lg p-4'>
                <View className='font-bold mb-2 text-gray-800 text-base'>商品信息</View>
                {previewList.map((item, idx) => (
                    <View key={idx} className='flex py-3 border-b last:border-0 border-gray-100'>
                        {/* 如果接口未返回单项图，降级回显业务原图 */}
                        <Image
                            src={item.imageUrl || bizParams?.items?.[idx]?.imageUrl || ''}
                            className='w-20 h-20 border border-solid border-gray-100 rounded-lg mr-3 bg-gray-50 flex-shrink-0'
                            mode='aspectFill'
                        />
                        <View className='flex-1 flex flex-col justify-between'>
                            <View className='flex justify-between items-start'>
                                <Text className='w-380px line-clamp-2 text-sm text-gray-800'>{item.productName || '定制商品'}</Text>
                                <Text className='text-gray-500 text-sm font-medium'>x{item.totalQuantity}</Text>
                            </View>
                            <View className='text-gray-400 text-xs mt-1'>{item.specName || '默认'}</View>
                            <View className='flex justify-between items-end mt-1'>
                                <Text className='text-red-500 font-bold text-sm'>¥{item.price.toFixed(2)}</Text>
                                <Text className='text-gray-400 text-xs'>小计：¥{item.totalSubtotal.toFixed(2)}</Text>
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

            {/* 金额汇总结算 */}
            <View className='bg-white mx-4 mt-4 rounded-lg p-4 text-sm text-gray-700'>
                <View className='flex justify-between'>
                    <Text>商品金额</Text>
                    <Text className='font-medium text-gray-900'>¥{totalAmount.toFixed(2)}</Text>
                </View>
                <View className='flex justify-between mt-4'>
                    <Text>运费</Text>
                    <Text className='font-medium text-gray-900'>¥{freight.toFixed(2)}</Text>
                </View>
            </View>

            {/* 底部固定结算操作栏 */}
            <View className='fixed bottom-0 left-0 right-0 h-100px bg-white flex items-center justify-between pl-4 z-30 box-border border-t border-gray-100'>
                {/* 左侧实付款 */}
                <View className='flex items-center text-sm text-gray-700'>
                    <Text>实付款：</Text>
                    <Text className='text-red-500 font-bold text-lg'>
                        ¥{actualAmount.toFixed(2)}
                    </Text>
                </View>

                {/* 右侧提交订单按钮 */}
                <Button
                    className='bg-red-500 text-white text-base h-full px-8 flex items-center justify-center rounded-none m-0 border-none'
                    style={{ borderRadius: 0 }}
                    disabled={submitLoading || finalItems.length === 0}
                    onClick={submitOrder}
                >
                    {submitLoading ? '提交中...' : '提交订单'}
                </Button>
            </View>
        </View>
    )
}