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
    useRequest(() => getProductCoupons(id), {
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

    // 按钮动作统一分发：未领取则去领取，已领取则去使用
    const handleCouponAction = async (coupon: any) => {
        setBtnLoadingId(coupon.id)
        // 如果已经是已领取状态，直接引导用户去使用（唤起 SKU 购买）
        if (coupon.isReceived) {
            setShowCouponPopup(false) // 关闭优惠券弹窗
            setTimeout(() => {
                setShowSku(true) // 顺畅过渡唤起 SKU 规格弹窗
            }, 300)
            return
        }

        // 未领取状态执行领券逻辑
        if (btnLoadingId) return
        try {
            await receiveCoupon(coupon.id)
            Taro.showToast({ title: '领取成功', icon: 'success' })
            // 动态更新本地状态
            setCoupons(prev =>
                prev.map(item => item.id === coupon.id ? { ...item, isReceived: true } : item)
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

    const currentPrice = selectedSpec ? selectedSpec.price : (product.specs[0]?.price || 0)

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
                    <View className='text-red-500 text-3xl font-bold'>
                        <Text className='text-xl mr-0.5'>¥</Text>
                        {currentPrice.toFixed(2)}
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
                        {coupons.slice(0, 2).map(coupon => (
                            <View
                                key={coupon.id}
                                className={`text-20px px-2 py-0.5 rounded relative border border-solid ${coupon.isReceived
                                    ? 'bg-gray-50 text-gray-400 border-gray-200'
                                    : 'bg-red-50 text-red-500 border-red-200'
                                    }`}
                            >
                                {coupon.fullAmount === 0 ? '无门槛' : `满${coupon.fullAmount}`}减{coupon.reduceAmount}
                            </View>
                        ))}
                    </View>
                    <View className='flex items-center text-xs text-red-500 ml-2'>
                        <Text>{coupons.every(c => c.isReceived) ? '查看' : '领券'}</Text>
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

            {/* 优惠券弹窗 */}
            <BottomSheet
                visible={showCouponPopup}
                title='优惠券明细'
                onClose={() => setShowCouponPopup(false)}
                enableDragClose={true}
                contentClassName='max-h-[55vh]'
            >
                <View className='flex flex-col gap-3 pt-2 pb-68px'>
                    {coupons.map((coupon) => (
                        <View
                            key={coupon.id}
                            className={`flex items-center justify-between border border-solid rounded-xl p-3 relative overflow-hidden transition-all ${coupon.isReceived
                                ? 'bg-orange-50/20 border-orange-200' // 已领取后，呈现温暖淡雅的“可使用”氛围调
                                : 'bg-gradient-to-r from-red-50/50 to-orange-50/50 border-red-100'
                                }`}
                        >
                            {/* 左侧金额与描述 */}
                            <View className='flex items-center pl-2'>
                                <View className={`font-bold mr-4 flex items-baseline flex-shrink-0 ${coupon.isReceived ? 'text-orange-500' : 'text-red-500'}`}>
                                    <Text className='text-xs'>￥</Text>
                                    <Text className='text-2xl leading-none'>{coupon.reduceAmount}</Text>
                                </View>
                                <View className='flex flex-col'>
                                    <Text className={`text-sm font-medium ${coupon.isReceived ? 'text-gray-700' : 'text-gray-800'}`}>
                                        {coupon.name}
                                    </Text>
                                    <Text className='text-xs text-gray-400 mt-1'>
                                        {coupon.fullAmount === 0 ? '无门槛券' : `满${coupon.fullAmount}元可用`}
                                    </Text>
                                </View>
                            </View>

                            {/* 右侧动作按钮：始终可点 */}
                            <Button
                                disabled={btnLoadingId === coupon.id} // 仅在请求中禁用以防连击
                                onClick={() => handleCouponAction(coupon)}
                                className={`h-7 px-4 rounded-full text-xs font-medium flex items-center justify-center m-0 transition-all active:scale-95 border-none after:border-none flex-shrink-0 ${coupon.isReceived
                                    ? 'bg-orange-500 text-white shadow-sm' // 已领取：亮眼的“立即使用”主色调按钮
                                    : 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm' // 未领取：渐变色
                                    }`}
                            >
                                {btnLoadingId === coupon.id ? '处理中...' : (coupon.isReceived ? '立即使用' : '立即领取')}
                            </Button>
                        </View>
                    ))}
                </View>
            </BottomSheet>
        </View>
    )
}