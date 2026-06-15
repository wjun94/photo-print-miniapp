import { View, Text, Button, Input } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { Image, BottomSheet } from '@/components'
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

// 假设优惠券的数据结构
interface CouponItem {
    id: string
    name: string
    reduceAmount: number
    fullAmount: number
    status?: number // 0-可用/可领，1-已领/可使用，2-不可用
    isReceived?: boolean
    reason: string
}

export default function ConfirmOrder() {
    const router = useRouter()
    const [selectedAddress, setSelectedAddress] = useState<ADDRESS.Items | null>(null)
    const [remark, setRemark] = useState('')

    // 存储打平解码后的真实业务核心参数
    const [bizParams, setBizParams] = useState<FlattenedParams | null>(null)
    const [isInitialized, setIsInitialized] = useState(false)

    // 优惠券相关状态
    const [showCouponPopup, setShowCouponPopup] = useState(false)
    const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null)

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
            couponId: selectedCoupon?.id || '', // 动态覆盖/透传最新的优惠券ID
        }),
        {
            // 只有当参数解析完毕，且组合出合法的 items 之后才去触发请求
            ready: isInitialized && finalItems.length > 0,
            refreshDeps: [bizParams, selectedCoupon?.id], // 依赖 bizParams 和 优惠券ID 的建立与切换
            onSuccess: (res) => {
                // 初始化默认收货地址
                if (res?.defaultAddress && !selectedAddress) {
                    setSelectedAddress(res.defaultAddress)
                }
                if (res?.coupons?.length) {
                    setSelectedCoupon(res?.coupons[0])
                }
                // 如果后端在预览接口里返回了当前推荐/默认选中的优惠券，可以回显（取决于后端是否返回此字段）
                if (res?.currentCouponId && !selectedCoupon) {
                    // 假设 res 包含当前已应用券的标识
                    setSelectedCoupon({ id: res.currentCouponId } as CouponItem)
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
                remark: remark.trim(),
                couponId: selectedCoupon?.id || '' // 提交最终选中的优惠券
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

    // 优惠券选择点击事件处理
    const handleCouponAction = (coupon: CouponItem) => {
        if (coupon.status === 0) {
            Taro.showToast({ title: coupon.reason, icon: 'none' })
            return
        }
        setShowCouponPopup(false)
        if (coupon?.id === selectedCoupon?.id) return;
        setSelectedCoupon(coupon)
    }

    // 取消使用优惠券
    /** const handleCancelCoupon = () => {
        setSelectedCoupon(null)
        setShowCouponPopup(false)
    } */

    // 安全获取回显数据的默认值
    const previewList = previewData?.specs || []
    const totalAmount = previewData?.totalAmount || 0
    const freight = previewData?.freight || 0
    const actualAmount = previewData?.actualAmount || 0

    // 使用接口数据并提供空数组兜底
    const couponList: CouponItem[] = previewData?.coupons || []

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

            {/* 优惠券选择卡片入口 */}
            <View
                className='bg-white mx-4 mt-4 rounded-lg px-4 py-2 flex justify-between items-center text-sm'
                onClick={() => setShowCouponPopup(true)}
            >
                <View className='flex items-center text-gray-800'>
                    <Text className='iconfont icon-coupon text-red-500 mr-2 text-base' />
                    <Text className='font-medium'>优惠券</Text>
                </View>
                <View className='flex items-center gap-1'>
                    {selectedCoupon?.name ? (
                        <Text>{selectedCoupon.name}</Text>
                    ) : (
                        <Text className='text-gray-400'>
                            {couponList.length > 0 ? `${couponList.length}张可用` : '暂无可用优惠券'}
                        </Text>
                    )}
                    <Text className='iconfont icon-next text-gray-400 text-24px' />
                </View>
            </View>

            {/* 金额汇总结算 */}
            <View className='bg-white mx-4 mt-4 rounded-lg p-4 text-sm text-gray-700'>
                <View className='flex justify-between'>
                    <Text>商品金额</Text>
                    <Text className='font-medium text-gray-900'>¥{totalAmount.toFixed(2)}</Text>
                </View>
                <View className='flex justify-between mt-4'>
                    <Text>优惠券</Text>
                    <Text className='font-medium text-gray-900'>-¥{(previewData?.discountAmount || 0).toFixed(2)}</Text>
                </View>
                <View className='flex justify-between mt-4'>
                    <Text>运费</Text>
                    <Text className='font-medium text-gray-900'>¥{freight.toFixed(2)}</Text>
                </View>
            </View>

            {/* 底部固定结算操作栏 */}
            <View className='fixed bottom-0 left-0 right-0 h-100px bg-white flex items-center justify-between pl-4 z-30 box-border border-t border-gray-100'>
                <View className='flex items-center text-sm text-gray-700'>
                    <Text>实付金额：</Text>
                    <Text className='text-red-500 font-bold text-lg'>
                        ¥{actualAmount.toFixed(2)}
                    </Text>
                </View>

                <Button
                    className='bg-red-500 text-white text-base h-full px-8 flex items-center justify-center rounded-none m-0 border-none'
                    style={{ borderRadius: 0 }}
                    disabled={submitLoading || finalItems.length === 0}
                    onClick={submitOrder}
                >
                    {submitLoading ? '提交中...' : '提交订单'}
                </Button>
            </View>

            {/* 优惠券明细弹窗 */}
            <BottomSheet
                visible={showCouponPopup}
                title='优惠券明细'
                onClose={() => setShowCouponPopup(false)}
                enableDragClose={true}
                contentClassName='max-h-[55vh]'
            >
                <View className='flex flex-col gap-3 pt-2 pb-68px min-h-30vh box-border'>
                    {/* 无/不使用优惠券处理选项 */}
                    {/* <View
                        onClick={handleCancelCoupon}
                        className={`flex items-center justify-between border border-solid rounded-xl p-4 transition-all bg-gray-50 ${!selectedCoupon ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
                            }`}
                    >
                        <Text className={`text-sm font-medium ${!selectedCoupon ? 'text-red-500' : 'text-gray-700'}`}>
                            不使用优惠券
                        </Text>
                        <View className={`w-4 h-4 rounded-full border border-solid flex items-center justify-center ${!selectedCoupon ? 'border-red-500 bg-red-500' : 'border-gray-400'
                            }`}>
                            {!selectedCoupon && <View className='w-2 h-2 bg-white rounded-full' />}
                        </View>
                    </View> */}

                    {/* 优惠券列表为空时的兜底提示 */}
                    {couponList.length === 0 && (
                        <View className='text-center py-10 text-gray-400 text-sm'>
                            暂无符合当前订单使用的优惠券
                        </View>
                    )}

                    {/* 循环渲染优惠券 */}
                    {couponList.map((coupon) => {
                        const status = coupon.status ?? (coupon.isReceived ? 1 : 0)

                        // 1. 根据核心状态动态匹配卡片整体视觉背景
                        let cardClassName = 'bg-gradient-to-r from-red-50/50 to-orange-50/50 border-red-100'
                        let priceColorName = 'text-red-500'

                        // 如果是当前正在使用的券，加上高亮描边
                        const isCurrentActive = selectedCoupon?.id === coupon.id
                        if (status === 0) {
                            cardClassName = 'bg-gray-50/20 border-gray-200'
                            priceColorName = 'text-gray-500'
                        } else if (status === 1) {
                            cardClassName = 'bg-orange-50/20 border-orange-200'
                            priceColorName = 'text-orange-500'
                        } else if (status === 2) {
                            cardClassName = 'bg-gray-50 border-gray-200 opacity-70'
                            priceColorName = 'text-gray-400'
                        }

                        if (isCurrentActive) {
                            cardClassName += ' border-red-500 ring-1 ring-red-500'
                        }

                        // 2. 根据状态码及加载态，动态分配按钮文案与类名
                        let btnText = '立即使用'
                        let btnClassName = 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm'
                        switch (status) {
                            case 0:
                                btnText = '不可使用'
                                btnClassName = 'bg-gray-200 text-gray-400'
                                break
                            case 1:
                                btnText = isCurrentActive ? '使用中' : '立即使用'
                                btnClassName = isCurrentActive ? 'bg-red-500 text-white' : 'bg-orange-500 text-white shadow-sm'
                                break
                            case 2:
                                btnText = '不可用'
                                btnClassName = 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                break
                            case 0:
                            default:
                                btnText = '立即领取'
                                btnClassName = 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm'
                                break
                        }

                        return (
                            <View
                                key={coupon.id}
                                className={`flex items-center justify-between border border-solid rounded-xl p-3 relative overflow-hidden transition-all ${cardClassName}`}
                            >
                                {/* 左侧金额与描述 */}
                                <View className='flex items-center pl-2'>
                                    <View className={`font-bold mr-4 flex items-baseline flex-shrink-0 ${priceColorName}`}>
                                        <Text className='text-xs'>￥</Text>
                                        <Text className='text-2xl leading-none'>{coupon.reduceAmount}</Text>
                                    </View>
                                    <View className='flex flex-col'>
                                        <Text className={`text-sm font-medium ${status === 2 ? 'text-gray-400 line-through' : status === 1 ? 'text-gray-700' : 'text-gray-800'}`}>
                                            {coupon.name}
                                        </Text>
                                        <Text className='text-xs text-gray-400 mt-1'>
                                            {coupon.fullAmount === 0 ? '无门槛券' : `满${coupon.fullAmount}元可用`}
                                        </Text>
                                    </View>
                                </View>

                                {/* 右侧动作按钮 */}
                                <Button
                                    onClick={() => handleCouponAction(coupon)}
                                    className={`h-7 px-4 rounded-full text-xs font-medium flex items-center justify-center m-0 transition-all border-none after:border-none flex-shrink-0 ${status !== 2 && !isCurrentActive && 'active:scale-95'
                                        } ${btnClassName}`}
                                >
                                    {btnText}
                                </Button>
                            </View>
                        )
                    })}
                </View>
            </BottomSheet>
        </View>
    )
}