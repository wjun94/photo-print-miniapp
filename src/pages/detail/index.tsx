import { View, ScrollView, Button, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { getProducts } from '@/api/product'
import { getProductCoupons, receiveCoupon } from '@/api/coupon'
import SkuPopup from '@/components/SkuPopup'
import { Image, HtmlRender, BottomSheet } from '@/components'
import { useRequest } from 'ahooks'

export default function ProductDetail() {
    const router = useRouter()
    const { id } = router.params
    const [product, setProduct] = useState<PRODUCT.Detail | null>(null)
    const [loading, setLoading] = useState(true)

    // 存储当前选中的具体 SKU 节点
    const [selectedSpec, setSelectedSpec] = useState<PRODUCT.SpecItem | null>(null)
    const [showSku, setShowSku] = useState(false)

    // 优惠券相关状态
    const [coupons, setCoupons] = useState<any[]>([])
    const [showCouponPopup, setShowCouponPopup] = useState(false)
    const [btnLoadingId, setBtnLoadingId] = useState<string | null>(null)

    // 获取优惠券列表
    const { refresh } = useRequest(() => getProductCoupons(id), {
        ready: !!id,
        onSuccess: (res) => {
            setCoupons(res || [])
        }
    })

    useEffect(() => {
        if (id) fetchProduct()
    }, [id])

    // 获取商品详情
    const fetchProduct = async () => {
        try {
            const data = await getProducts(id)
            setProduct(data)

            // 进入详情页默认选中第一个有库存的完整 SKU 节点
            if (data.specs?.length) {
                const inStockSpec = data.specs.find(s => s.stock > 0) || data.specs[0]
                setSelectedSpec(inStockSpec)
            }
        } catch (err) {
            Taro.showToast({ title: '获取商品失败', icon: 'none' })
        } finally {
            setLoading(false)
        }
    }

    // 按钮动作统一分发：0-可领取(去领券)，1-可使用(唤起SKU)，2-已达上限(拦截)
    const handleCouponAction = async (coupon: any) => {
        const status = coupon.status ?? (coupon.isReceived ? 1 : 0)

        // 1. 已达上限状态，直接拦截
        if (status === 2) return

        setBtnLoadingId(coupon.id)

        // 2. 状态1：可使用，引导用户去购买（唤起 SKU）
        if (status === 1) {
            setShowCouponPopup(false) // 关闭优惠券弹窗
            setTimeout(() => {
                setShowSku(true) // 顺畅过渡唤起 SKU 规格弹窗
            }, 300)
            return
        }

        // 3. 状态0：未领取状态执行领券逻辑
        if (btnLoadingId) return // 防止连续点击

        try {
            await receiveCoupon(coupon.id)
            refresh()
            Taro.showToast({ title: '领取成功', icon: 'success' })

            // 动态更新本地券状态为 1 (已领取可使用)
            setCoupons(prev =>
                prev.map(item => item.id === coupon.id ? { ...item, status: 1 } : item)
            )
        } catch (err: any) {
            Taro.showToast({ title: err?.message || '领取失败', icon: 'none' })
        } finally {
            setBtnLoadingId(null)
        }
    }

    const openSkuPopup = () => {
        setShowSku(true)
    }

    const closeSkuPopup = () => {
        setShowSku(false)
    }

    // 规格确认回调
    const handleSpecConfirm = (spec: PRODUCT.SpecItem, quantity: number) => {
        setSelectedSpec(spec)
        closeSkuPopup()
    }

    if (loading) return <View className='flex justify-center items-center h-screen text-gray-500 text-sm'>加载中...</View>
    if (!product) return <View className='text-center mt-10 text-gray-500 text-sm'>商品不存在</View>

    // 将选中的多维规格 attributes 转换为可读文本
    const selectedSpecText = selectedSpec
        ? Object.entries(selectedSpec.attributes).map(([_, v]) => v).join(' / ')
        : '请选择规格'

    // 提取满额包邮边界值
    const freeShippingMinAmount = product.freeShippingAmount

    // 安全获取商品自定义标签数组
    const productTags: string[] = (product as any).tags || []

    return (
        <View className='bg-gray-50 min-h-screen pb-24'>
            {/* 1. 轮播图区域 */}
            <ScrollView scrollX className='whitespace-nowrap bg-white'>
                {product.bannerImages?.length ? (
                    product.bannerImages.map((img, idx) => (
                        <Image preview key={idx} src={img} className='w-screen h-96 inline-block' mode='aspectFill' />
                    ))
                ) : (
                    <Image preview src={product.coverImage} className='w-screen h-96' mode='aspectFill' />
                )}
            </ScrollView>

            {/* 2. 商品基础信息 */}
            <View className='bg-white p-4 shadow-sm'>
                {/* 价格与销售数据行 */}
                <View className='flex justify-between items-baseline mb-2'>
                    <View className='flex items-center'>
                        <View className='text-red-500 text-3xl font-bold'>
                            <Text className='text-xl mr-0.5'>¥</Text>
                            {product?.minPrice.toFixed(2)}
                        </View>
                        {product?.maxPrice ? <View className='text-red-500 text-3xl font-bold'>
                            -<Text className='text-xl mr-0.5'>¥</Text>
                            {product?.maxPrice.toFixed(2)}
                        </View> : null}
                    </View>
                    <View className='text-gray-400 text-xs'>
                        已售 {Math.floor(Math.random() * 100) + 50} 件
                    </View>
                </View>

                {/* 商品标题 */}
                <View className='text-gray-900 text-32px font-semibold leading-relaxed'>{product.name}</View>

                {/* 商品特色标签 */}
                {productTags.length > 0 && (
                    <View className='flex flex-wrap gap-2 mt-2.5'>
                        {productTags.map((tag, i) => (
                            <View
                                key={i}
                                className='bg-red-50 text-red-500 text-24px px-2 py-0.5 rounded-md font-medium border border-solid border-red-100/50'
                            >
                                {tag}
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* 3. 营销服务标签栏 */}
            <View className='bg-white px-4 py-3 mt-2 flex items-center justify-between border-b border-solid border-gray-50 shadow-sm'>
                <View className='flex items-center flex-wrap gap-y-2 flex-1'>
                    {freeShippingMinAmount !== undefined && freeShippingMinAmount !== null ? (
                        <View className='flex items-center bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md mr-3 text-24px font-medium border border-solid border-orange-100'>
                            <Text className='iconfont icon-shipped mr-1' />
                            满 ¥{Number(freeShippingMinAmount).toFixed(2)} 包邮
                        </View>
                    ) : (
                        <View className='flex items-center bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md mr-3 text-xs font-medium border border-solid border-gray-100'>
                            <Text className='iconfont icon-shipped mr-1' />
                            运费按地区计算
                        </View>
                    )}
                    <View className='flex items-center text-gray-400 text-xs mr-3'>
                        <Text className='text-green-500 font-bold mr-0.5'>✓</Text> 极速发货
                    </View>
                    <View className='flex items-center text-gray-400 text-xs'>
                        <Text className='text-green-500 font-bold mr-0.5'>✓</Text> 售后无忧
                    </View>
                </View>
            </View>

            {/* 4. 领券外层入口栏 */}
            {coupons.length > 0 && (
                <View
                    className='bg-white p-4 mt-2 flex justify-between items-center active:bg-gray-50'
                    onClick={() => setShowCouponPopup(true)}
                >
                    <View className='text-gray-800 text-sm font-medium w-16 flex-shrink-0'>领券</View>
                    <View className='flex items-center flex-1 overflow-hidden gap-2 pl-2'>
                        {coupons.slice(0, 2).map(coupon => {
                            const status = coupon.status ?? (coupon.isReceived ? 1 : 0)
                            const isHandled = status === 1 || status === 2 // 已领取或达上限呈现非高亮状态
                            return (
                                <View
                                    key={coupon.id}
                                    className={`text-20px px-2 py-0.5 rounded relative border border-solid ${isHandled
                                        ? 'bg-orange-50 text-orange-500 border-orange-200'
                                        : 'bg-red-50 text-red-500 border-red-200'
                                        }`}
                                >
                                    {coupon.fullAmount === 0 ? '无门槛' : `满${coupon.fullAmount}`}减{coupon.reduceAmount}
                                </View>
                            )
                        })}
                    </View>
                    <View className='flex items-center text-xs text-red-500 ml-2'>
                        <Text>{coupons.every(c => (c.status === 1 || c.status === 2 || c.isReceived)) ? '查看' : '领券'}</Text>
                        <Text className="iconfont icon-next ml-1 text-gray-400" />
                    </View>
                </View>
            )}

            {/* 5. 选择规格栏 */}
            <View className='bg-white p-4 mt-2 flex justify-between items-center active:bg-gray-50' onClick={openSkuPopup}>
                <View className='text-gray-800 text-sm font-medium w-16 flex-shrink-0'>选择规格</View>
                <View className='flex items-center flex-1 justify-end pr-1 text-sm overflow-hidden'>
                    <View className={`line-clamp-1 ${selectedSpec ? 'text-gray-800' : 'text-gray-400'}`}>
                        {selectedSpecText}
                    </View>
                    <Text className="iconfont icon-next ml-2 text-gray-400 text-xs" />
                </View>
            </View>

            {/* 6. 商品详情（富文本区域） */}
            <View className='bg-white mt-2 p-4 mb-4'>
                <View className='text-gray-900 font-bold text-sm mb-3 border-l-4 border-red-500 pl-2'>商品详情</View>
                <HtmlRender dangerouslySetInnerHTML={{ __html: product.detail }} />
            </View>

            {/* 7. 底部固定操作栏 */}
            <View className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-2 px-4 pb-safe z-30'>
                <Button
                    className='bg-red-500 text-white rounded-full w-full py-2.5 text-base font-medium border-none active:opacity-90 transition-all'
                    onClick={openSkuPopup}
                >
                    立即购买
                </Button>
            </View>

            {/* 多维 SKU 弹窗组件 */}
            <SkuPopup
                visible={showSku}
                product={product}
                selectedSpec={selectedSpec}
                params={{ couponId: btnLoadingId }}
                onClose={closeSkuPopup}
                onConfirm={handleSpecConfirm}
            />

            {/* 优惠券明细弹窗 */}
            <BottomSheet
                visible={showCouponPopup}
                title='优惠券明细'
                onClose={() => setShowCouponPopup(false)}
                enableDragClose={true}
                contentClassName='max-h-[55vh]'
            >
                <View className='flex flex-col gap-3 pt-2 pb-68px min-h-30vh'>
                    {coupons.map((coupon) => {
                        const status = coupon.status ?? (coupon.isReceived ? 1 : 0)

                        // 1. 根据核心状态动态匹配卡片整体视觉背景
                        let cardClassName = 'bg-gradient-to-r from-red-50/50 to-orange-50/50 border-red-100'
                        let priceColorName = 'text-red-500'
                        if (status === 1) {
                            cardClassName = 'bg-orange-50/20 border-orange-200'
                            priceColorName = 'text-orange-500'
                        } else if (status === 2) {
                            cardClassName = 'bg-gray-50 border-gray-200 opacity-70'
                            priceColorName = 'text-gray-400'
                        }

                        // 2. 根据状态码及加载态，动态分配按钮文案与类名
                        let btnText = '立即领取'
                        let btnClassName = 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm'


                        switch (status) {
                            case 1:
                                btnText = '立即使用'
                                btnClassName = 'bg-orange-500 text-white shadow-sm'
                                break
                            case 2:
                                btnText = '已达上限'
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
                                    disabled={status === 2}
                                    onClick={() => handleCouponAction(coupon)}
                                    className={`h-7 px-4 rounded-full text-xs font-medium flex items-center justify-center m-0 transition-all border-none after:border-none flex-shrink-0 ${status !== 2 && 'active:scale-95'
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