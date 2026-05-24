import { View, Button, Input } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Image } from '@/components'
import Taro from '@tarojs/taro'

interface SkuPopupProps {
    visible: boolean
    product: PRODUCT.Detail
    selectedSpec: PRODUCT.Spec | null
    onClose: () => void
    onConfirm: (spec: PRODUCT.Spec, quantity: number) => void
}

export default function SkuPopup({ visible, product, selectedSpec, onClose, onConfirm }: SkuPopupProps) {
    const [quantity, setQuantity] = useState(1)
    const [currentSpec, setCurrentSpec] = useState<PRODUCT.Spec | null>(selectedSpec)

    useEffect(() => {
        if (selectedSpec) setCurrentSpec(selectedSpec)
    }, [selectedSpec])

    if (!visible) return null

    const handleSpecSelect = (spec: PRODUCT.Spec) => {
        setCurrentSpec(spec)
        setQuantity(1)
    }

    const increase = () => {
        if (currentSpec && quantity >= currentSpec.stock) {
            Taro.showToast({ title: '库存不足', icon: 'none' })
            return
        }
        setQuantity(quantity + 1)
    }

    const decrease = () => {
        if (quantity > 1) setQuantity(quantity - 1)
    }

    const handleConfirm = () => {
        if (!currentSpec) {
            Taro.showToast({ title: '请选择规格', icon: 'none' })
            return
        }
        if (quantity > currentSpec.stock) {
            Taro.showToast({ title: '数量超过库存', icon: 'none' })
            return
        }
        onConfirm(currentSpec, quantity)
    }

    const price = currentSpec ? currentSpec.price : 0
    const stock = currentSpec ? currentSpec.stock : 0

    return (
        <>
            <View catchMove className='fixed inset-0 bg-black bg-opacity-50 z-40' onClick={onClose} />
            <View catchMove className='fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 p-4 animate-slide-up'>
                {/* 商品缩略信息 */}
                <View className='flex mb-4'>
                    <Image src={product.coverImage} className='w-24 h-24 rounded-lg mr-3' mode='aspectFill' />
                    <View className='flex-1'>
                        <View className='text-red-500 text-xl font-bold'>¥{price.toFixed(2)}</View>
                        <View className='text-gray-500 text-sm'>库存 {stock} 件</View>
                        <View className='text-gray-500 text-sm'>已选 {currentSpec?.name || ''}</View>
                    </View>
                </View>

                {/* 规格选项 */}
                <View className='mb-4'>
                    <View className='text-gray-700 mb-2'>选择规格</View>
                    <View className='flex flex-wrap gap-2'>
                        {product.specs.map(spec => (
                            <View
                                key={spec.id}
                                className={`px-4 py-2 rounded-full border ${currentSpec?.id === spec.id ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300'}`}
                                onClick={() => handleSpecSelect(spec)}
                            >
                                {spec.name}
                            </View>
                        ))}
                    </View>
                </View>

                {/* 数量选择器 */}
                <View className='mb-4'>
                    <View className='text-gray-700 mb-2'>数量</View>
                    <View className='flex items-center'>
                        <View className='w-8 h-8 border border-gray-300 rounded-l flex justify-center items-center' onClick={decrease}>-</View>
                        <Input type='number' value={String(quantity)} className='w-16 h-8 border-t border-b border-gray-300 text-center' onInput={e => setQuantity(Number(e.detail.value))} />
                        <View className='w-8 h-8 border border-gray-300 rounded-r flex justify-center items-center' onClick={increase}>+</View>
                    </View>
                </View>

                <Button className='bg-red-500 text-white rounded-full w-full' onClick={handleConfirm}>
                    确定
                </Button>
            </View>
        </>
    )
}