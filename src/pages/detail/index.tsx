import { View, ScrollView, Button, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { getProducts } from '@/api/product'
import SkuPopup from '@/components/SkuPopup'
import { Image, HtmlRender } from '@/components'

export default function ProductDetail() {
    const router = useRouter()
    const { id } = router.params
    const [product, setProduct] = useState<PRODUCT.Detail | null>(null)
    const [loading, setLoading] = useState(true)

    // 存储当前选中的具体 SKU 节点
    const [selectedSpec, setSelectedSpec] = useState<PRODUCT.SpecItem | null>(null)
    const [showSku, setShowSku] = useState(false)

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

    // 提取满额包邮边界值（兼容接口下发的字段，假设字段名为 freeShippingAmount
    const freeShippingMinAmount = product.freeShippingAmount

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
                <View className='text-red-500 text-3xl font-bold mb-2'>
                    <Text className='text-xl mr-0.5'>¥</Text>
                    {currentPrice.toFixed(2)}
                </View>
                <View className='text-gray-900 text-base font-medium leading-relaxed'>{product.name}</View>
                {/* <View className='flex justify-between text-gray-500 mt-3 text-xs'>
                    <View>已售 {Math.floor(Math.random() * 100) + 10} 件</View>
                    <View>好评率 99%</View>
                </View> */}
            </View>

            {/* 3. 选择规格栏（点击触发弹窗） */}
            <View className='bg-white p-4 mt-2 flex justify-between items-center active:bg-gray-50' onClick={openSkuPopup}>
                <View className='text-gray-800 text-sm font-medium'>选择规格</View>
                <View className='flex items-center flex-1 justify-end pr-1 text-sm'>
                    <View className={selectedSpec ? 'text-gray-800' : 'text-gray-400'}>
                        {selectedSpecText}
                    </View>
                    <Text className="iconfont icon-next ml-2 text-gray-400 text-xs" />
                </View>
            </View>

            {/* 新增高颜值营销服务标签栏：动态匹配满额包邮/无包邮策略 */}
            <View className='bg-white px-4 py-3 mt-2 flex items-center justify-between border-b border-solid border-gray-50 shadow-sm'>
                <View className='flex items-center flex-wrap gap-y-2 flex-1'>
                    {freeShippingMinAmount !== undefined && freeShippingMinAmount !== null ? (
                        <View className='flex items-center bg-red-50 text-red-500 px-2 py-0.5 rounded-md mr-3 text-xs font-medium border border-solid border-red-100/60'>
                            <Text className='iconfont icon-wuliu mr-1 text-24px' />
                            满 ¥{Number(freeShippingMinAmount).toFixed(2)} 包邮
                        </View>
                    ) : (
                        <View className='flex items-center bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md mr-3 text-xs font-medium'>
                            <Text className='iconfont icon-wuliu mr-1 text-24px' />
                            运费按地区计算
                        </View>
                    )}
                    <View className='flex items-center text-gray-400 text-xs mr-3'>
                        <Text className='text-green-500 font-bold mr-1'>✓</Text> 极速发货
                    </View>
                    <View className='flex items-center text-gray-400 text-xs'>
                        <Text className='text-green-500 font-bold mr-1'>✓</Text> 售后无忧
                    </View>
                </View>
            </View>

            {/* 4. 商品详情（富文本区域） */}
            <View className='bg-white mt-2 p-4 mb-4'>
                <View className='text-gray-900 font-bold text-sm mb-3 border-l-4 border-red-500'>商品详情</View>
                <HtmlRender dangerouslySetInnerHTML={{ __html: product.detail }} />
            </View>

            {/* 5. 底部固定操作栏 */}
            <View className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-2 px-4 pb-safe z-30'>
                <Button
                    className='bg-red-500 text-white rounded-full w-full py-2.5 text-base font-medium border-none active:opacity-90 transition-all'
                    onClick={openSkuPopup}
                >
                    立即购买
                </Button>
            </View>

            {/* 多维 SKU 弹窗组件 —— 传入所选规格状态参数以保持多端数据对齐 */}
            <SkuPopup
                visible={showSku}
                product={product}
                selectedSpec={selectedSpec}
                onClose={closeSkuPopup}
                onConfirm={handleSpecConfirm}
            />
        </View>
    )
}