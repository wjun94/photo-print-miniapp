import { View, ScrollView, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { getProducts } from '@/api/product'
import SkuPopup from '@/components/SkuPopup'
import { Image } from '@/components'

export default function () {
    const router = useRouter()
    const { id } = router.params
    const [product, setProduct] = useState<PRODUCT.Detail | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedSpec, setSelectedSpec] = useState<PRODUCT.Spec | null>(null)
    const [showSku, setShowSku] = useState(false)

    useEffect(() => {
        if (id) fetchProduct()
    }, [id])

    const fetchProduct = async () => {
        try {
            const data = await getProducts(id)
            setProduct(data)
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

    // 规格确认后跳转下单页
    const handleSpecConfirm = (spec: PRODUCT.Spec, quantity: number) => {
        setSelectedSpec(spec)
        closeSkuPopup()
        // 跳转到订单确认页，携带商品、规格、数量信息
        Taro.navigateTo({
            url: `/pages/order/confirm/index?productId=${product!.id}&specId=${spec.id}&quantity=${quantity}`
        })
    }

    if (loading) return <View className='flex justify-center items-center h-screen'>加载中...</View>
    if (!product) return <View className='text-center mt-10'>商品不存在</View>

    const currentPrice = selectedSpec ? selectedSpec.price : (product.specs[0]?.price || 0)

    return (
        <View className='bg-gray-100 min-h-screen pb-20'>
            {/* 轮播图 */}
            <ScrollView scrollX className='whitespace-nowrap'>
                {product.bannerImages?.length ? (
                    product.bannerImages.map((img, idx) => (
                        <Image key={idx} src={img} className='w-screen h-96 inline-block' mode='aspectFill' />
                    ))
                ) : (
                    <Image src={product.coverImage} className='w-screen h-96' mode='aspectFill' />
                )}
            </ScrollView>

            {/* 商品信息 */}
            <View className='bg-white p-4 mt-2'>
                <View className='text-2xl font-bold mb-2'>{product.name}</View>
                <View className='text-red-500 text-2xl font-bold mb-2'>¥{currentPrice.toFixed(2)}</View>
                <View className='flex justify-between text-gray-500 text-sm'>
                    <View>已售 {Math.floor(Math.random() * 5000) + 100}</View>
                    <View>好评率 98%</View>
                </View>
            </View>

            {/* 选择规格 */}
            <View className='bg-white p-4 mt-2 flex justify-between items-center' onClick={openSkuPopup}>
                <View>
                    <View className='text-gray-400 text-sm'>选择规格</View>
                    <View className='mt-1'>{selectedSpec ? selectedSpec.name : '请选择规格'}</View>
                </View>
                <View className='text-gray-400'>{'>'}</View>
            </View>

            {/* 商品详情（富文本） */}
            <View className='bg-white mt-2 p-4'>
                <View className='text-lg font-bold mb-2'>商品详情</View>
                <View className='text-gray-600' dangerouslySetInnerHTML={{ __html: product.detail }} />
            </View>

            {/* 底部操作栏：仅“立即购买”按钮 */}
            <View className='fixed bottom-0 left-0 right-0 bg-white border-t py-2 px-4'>
                <Button className='bg-red-500 text-white rounded-full w-full' onClick={openSkuPopup}>
                    立即购买
                </Button>
            </View>

            {/* SKU弹窗 */}
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