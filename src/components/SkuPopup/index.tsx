import { View, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Image } from '@/components'
import Taro from '@tarojs/taro'

// 修正：补全 Props 接口定义，保证与 detail.tsx 的调用完全匹配
interface SkuPopupProps {
    visible: boolean
    product: PRODUCT.Detail
    selectedSpec: PRODUCT.SpecItem | null // 支持外部传入默认选中的规格节点
    onClose: () => void
    onConfirm: (spec: PRODUCT.SpecItem, quantity: number) => void // 补全确认回调
}

export default function SkuPopup({ visible, product, selectedSpec, onClose, onConfirm }: SkuPopupProps) {
    // 存储每一维规格选中的值。格式如：{ "颜色": "红色", "尺寸": "5寸" }
    const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({})
    // 匹配到的最终单一 SKU 规格对象
    const [currentSpec, setCurrentSpec] = useState<PRODUCT.SpecItem | null>(selectedSpec)
    // 购买数量
    const [quantity, setQuantity] = useState(1)

    // 当弹窗打开或外部选中的商品/规格改变时，执行状态联动与初始化
    useEffect(() => {
        if (visible) {
            if (selectedSpec) {
                // 如果外部已经有选中的规格（例如详情页默认选中的那项），则反向高亮规格按钮
                setSelectedAttrs(selectedSpec.attributes)
                setCurrentSpec(selectedSpec)
            } else {
                // 如果没有，清空所有选择状态
                setSelectedAttrs({})
                setCurrentSpec(null)
            }
            setQuantity(1)
        }
    }, [visible, product, selectedSpec])

    // 每次选中的属性改变时，自动匹配对应的具体 SKU
    useEffect(() => {
        const { specAttributes, specs } = product

        // 只有当用户把所有维度的规格都选齐了，才去匹配 specs
        const isAllSelected = specAttributes.every(attr => selectedAttrs[attr.name])

        if (isAllSelected) {
            // 在 specs 数组中寻找 attributes 完全匹配的那个 SKU
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
            [attrName]: prev[attrName] === value ? '' : value // 反选逻辑：如果点的是已选中的，则取消选中
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
        // 1. 校验是否选齐了规格
        if (product.specAttributes.length > 0 && !currentSpec) {
            Taro.showToast({ title: '请选择完整规格', icon: 'none' })
            return
        }

        // 2. 如果是 confirm 模式，校验库存
        if (product.action === 'confirm' && currentSpec && quantity > currentSpec.stock) {
            Taro.showToast({ title: '数量超过库存', icon: 'none' })
            return
        }

        const finalQuantity = product.action === 'upload' ? 1 : quantity

        // 3. 构建传递给下一个页面的业务数据
        const orderParams = {
            productId: product.id,
            specId: currentSpec?.id || '',
            skuKey: currentSpec?.skuKey || '',
            quantity: finalQuantity,
            price: currentSpec ? currentSpec.price : 0
        }

        // 执行父组件传递过来的状态更新回调
        if (currentSpec) {
            onConfirm(currentSpec, finalQuantity)
        }

        // 关闭当前弹窗
        onClose()

        // 4. 根据后端 action 字段执行不同的跳转策略
        if (product.action === 'upload') {
            Taro.navigateTo({
                url: `/pages/order/upload/index?params=${encodeURIComponent(JSON.stringify(orderParams))}`
            })
        } else {
            Taro.navigateTo({
                url: `/pages/order/confirm/index?params=${encodeURIComponent(JSON.stringify(orderParams))}`
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

    return (
        <>
            {/* 遮罩层 */}
            <View catchMove className='fixed inset-0 bg-black bg-opacity-50 z-40' onClick={onClose} />

            {/* 弹出内容区 - 添加了 min-h-[40vh] 确保容器最低占屏幕 40% 的高度，并使用 flex 布局撑开底部按钮 */}
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

                    {/* 4. 底部提交按钮 - 保持动态文案判断 */}
                    <Button
                        className='bg-red-500 text-white rounded-full w-full py-2 text-base font-medium border-none'
                        onClick={handleConfirm}
                    >
                        {product.action === 'upload' ? '去上传照片' : '立即购买'}
                    </Button>
                </View>
            </View>
        </>
    )
}