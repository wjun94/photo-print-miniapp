import { View, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Image } from '@/components'
import Taro from '@tarojs/taro'

interface SkuPopupProps {
    visible: boolean
    product: PRODUCT.Detail
    params?: { [key: string]: any }
    selectedSpec: PRODUCT.SpecItem | null
    selectedQuantity?: number
    onClose: () => void
    onConfirm: (spec: PRODUCT.SpecItem, quantity: number) => void
}

export default function SkuPopup({
    visible,
    params = {},
    product,
    selectedSpec,
    selectedQuantity = 1,
    onClose,
    onConfirm
}: SkuPopupProps) {
    const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({})
    const [currentSpec, setCurrentSpec] = useState<PRODUCT.SpecItem | null>(selectedSpec)
    const [quantity, setQuantity] = useState(selectedQuantity)

    // 监听外部选中的规格改变
    useEffect(() => {
        if (selectedSpec) {
            setSelectedAttrs(selectedSpec.attributes)
            setCurrentSpec(selectedSpec)
        } else {
            setSelectedAttrs({})
            setCurrentSpec(null)
        }
    }, [selectedSpec])

    // 监听外部传入的购买数量改变
    useEffect(() => {
        setQuantity(selectedQuantity)
    }, [selectedQuantity])

    // 每次选中的属性改变时，自动匹配对应的具体 SKU
    useEffect(() => {
        const { specAttributes, specs } = product
        const isAllSelected = specAttributes.every(attr => selectedAttrs[attr.name])

        if (isAllSelected) {
            const matchedSpec = specs.find(spec => {
                return specAttributes.every(attr => spec.attributes[attr.name] === selectedAttrs[attr.name])
            })
            setCurrentSpec(matchedSpec || null)
        } else {
            setCurrentSpec(null)
        }
    }, [selectedAttrs, product])

    if (!visible) return null

    // 处理多维规格点击事件
    const handleAttrSelect = (attrName: string, value: string) => {
        setSelectedAttrs(prev => ({
            ...prev,
            [attrName]: prev[attrName] === value ? '' : value
        }))
    }

    // 数量加
    const increase = () => {
        if (!currentSpec) {
            Taro.showToast({ title: '请先选择完整规格', icon: 'none' })
            return
        }
        if (quantity >= currentSpec.stock) {
            Taro.showToast({ title: '库存不足', icon: 'none' })
            return
        }
        setQuantity(quantity + 1)
    }

    // 数量减
    const decrease = () => {
        if (quantity > 1) setQuantity(quantity - 1)
    }

    // 点击确定按钮
    const handleConfirm = () => {
        if (product.specAttributes.length > 0 && !currentSpec) {
            Taro.showToast({ title: '请选择完整规格', icon: 'none' })
            return
        }

        if (product.action === 'confirm' && currentSpec && quantity > currentSpec.stock) {
            Taro.showToast({ title: '数量超过库存', icon: 'none' })
            return
        }

        const finalQuantity = product.action === 'upload' ? 1 : quantity

        const orderParams = {
            productId: product.id,
            specId: currentSpec?.id || '',
            skuKey: currentSpec?.skuKey || '',
            quantity: finalQuantity,
            price: currentSpec ? currentSpec.price : 0
        }

        if (currentSpec) {
            onConfirm(currentSpec, finalQuantity)
        }

        onClose()

        if (product.action === 'upload') {
            Taro.navigateTo({
                url: `/pages/order/upload/index?params=${encodeURIComponent(JSON.stringify({ ...orderParams, ...params }))}`
            })
        } else {
            Taro.navigateTo({
                url: `/pages/order/confirm/index?params=${encodeURIComponent(JSON.stringify({ ...orderParams, ...params }))}`
            })
        }
    }

    // 动态展示当前价格与库存
    const displayPrice = currentSpec ? currentSpec.price : (product.specs[0]?.price || 0)
    const displayStock = currentSpec ? currentSpec.stock : 0

    // 已选规格拼接文本展示
    const selectedText = product.specAttributes
        .map(attr => selectedAttrs[attr.name] || `请选择${attr.name}`)
        .join(' ')

    // 【核心新增】核心判空与库存校验逻辑：
    // 当选齐了 SKU 节点时，若整个 SKU 库存为 0，或当前选择的 quantity 大于该 SKU 的实际库存，则判定为库存不足
    const isStockInsufficient = !!currentSpec && (currentSpec.stock <= 0 || quantity > currentSpec.stock)

    return (
        <>
            {/* 遮罩层 */}
            <View catchMove className='fixed inset-0 bg-black bg-opacity-50 z-40' onClick={onClose} />

            {/* 弹出内容区 */}
            <View catchMove className='fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 p-4 pb-6 animate-slide-up min-h-[40vh] flex flex-col justify-between'>

                {/* 上半部分内容区域 */}
                <View>
                    {/* 1. 商品头部缩略信息 */}
                    <View className='flex mb-5'>
                        <Image
                            preview
                            src={currentSpec?.image || product.coverImage}
                            className='w-24 h-24 rounded-lg mr-3 bg-gray-100'
                            mode='aspectFill'
                        />
                        <View className='flex-1 flex flex-col justify-end'>
                            <View className='text-red-500 text-2xl font-bold'>¥{displayPrice.toFixed(2)}</View>
                            <View className='text-gray-400 text-xs mt-1'>库存 {displayStock} 件</View>
                            <View className='text-gray-700 text-sm mt-1 font-medium'>已选：{selectedText}</View>
                        </View>
                    </View>

                    {/* 2. 多维规格选择区域区域 */}
                    <View className='max-h-60 overflow-y-auto mb-4'>
                        {product.specAttributes.map(attr => (
                            <View key={attr.id} className='mb-4'>
                                <View className='text-gray-800 text-sm font-bold mb-2'>{attr.name}</View>
                                <View className='flex flex-wrap gap-2'>
                                    {attr.values.map(val => {
                                        const isSelected = selectedAttrs[attr.name] === val
                                        return (
                                            <View
                                                key={val}
                                                className={`px-4 py-1.5 rounded-full text-xs border ${isSelected
                                                    ? 'border-red-500 bg-red-50 text-red-500 font-medium'
                                                    : 'border-gray-200 bg-gray-50 text-gray-700'
                                                    }`}
                                                onClick={() => handleAttrSelect(attr.name, val)}
                                            >
                                                {val}
                                            </View>
                                        )
                                    })}
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 下半部分：购买数量及确认按钮组件 */}
                <View>
                    {/* 3. 数量选择器 - 条件渲染 */}
                    {product.action !== 'upload' && (
                        <View className='flex justify-between items-center mb-6 pt-2 border-t border-gray-100'>
                            <View className='text-gray-800 text-sm font-bold'>购买数量</View>
                            <View className='flex items-center border border-gray-200 rounded'>
                                <View
                                    className={`w-8 h-8 flex justify-center items-center text-lg ${quantity <= 1 ? 'text-gray-300' : 'text-gray-600 active:bg-gray-100'}`}
                                    onClick={decrease}
                                >
                                    -
                                </View>
                                <View className='w-12 h-8 flex justify-center items-center text-sm border-l border-r border-gray-200 text-gray-800'>
                                    {quantity}
                                </View>
                                <View
                                    className='w-8 h-8 flex justify-center items-center text-lg text-gray-600 active:bg-gray-100'
                                    onClick={increase}
                                >
                                    +
                                </View>
                            </View>
                        </View>
                    )}

                    {/* 4. 底部提交按钮 - 【修改】动态控制置灰态、禁用状态与按钮文案 */}
                    <Button
                        disabled={isStockInsufficient}
                        className={`rounded-full w-full py-2 text-base font-medium border-none transition-all ${isStockInsufficient
                                ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                                : 'bg-red-500 text-white active:opacity-90'
                            }`}
                        onClick={handleConfirm}
                    >
                        {isStockInsufficient
                            ? '库存不足'
                            : (product.action === 'upload' ? '去上传照片' : '立即购买')}
                    </Button>
                </View>
            </View>
        </>
    )
}