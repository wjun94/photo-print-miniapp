import { View, Text, Button } from '@tarojs/components'
import Taro, { eventCenter, useDidShow, useRouter } from '@tarojs/taro'
import { getAddressList } from '@/api/address'
import { ScrollLoadList, ScrollLoadListRef } from '@/components'
import { useRef, useState } from 'react'

export default function AddressList() {
    const { params: { id = '' } } = useRouter()
    const listRef = useRef<ScrollLoadListRef>(null)
    // 假设当前选中的地址ID，用于控制左侧单选状态
    const [selected, setSelected] = useState<ADDRESS.Items | null>(null)

    // 右上角管理/编辑跳转
    const handleManage = () => {
        Taro.navigateTo({ url: `../edit/index?id=${selected?.id}` })
    }

    useDidShow(() => {
        listRef?.current?.refresh?.()
    })

    return (
        <View className='min-h-screen px-4 pt-3 pb-6 text-[#1A1A1A]'>

            {/* 头部标题与编辑操作栏 */}
            <View className='flex justify-between items-center py-3 px-1'>
                <Text className='text-34px font-bold text-[#111111]'>常用地址</Text>
                <Text className='text-30px text-[#2F77F1] font-medium' onClick={handleManage}>编辑</Text>
            </View>

            {/* 地址列表包裹器 */}
            <ScrollLoadList
                ref={listRef}
                request={getAddressList}
                renderItem={(addr: any) => {
                    // 初始化时让默认地址保持选中态
                    if (addr.isDefault && !selected) {
                        // setSelected(addr)
                        setSelected({ id: id || addr.id } as any)
                    }
                    const isCurrentSelected = selected?.id === addr.id

                    return (
                        <View
                            key={addr.id}
                            className='flex items-center bg-white rounded-32px p-5 mb-3'
                            onClick={() => setSelected(addr)}
                        >
                            {/* 左侧单选框 */}
                            <View className='flex-shrink-0 mr-4 flex items-center justify-center'>
                                {isCurrentSelected ? (
                                    // 选中状态：蓝色对勾圆圈
                                    <Text className="iconfont icon-radio-selected text-44px text-primary-400" />
                                ) : (
                                    // 未选中状态：灰色空心圆圈
                                    <Text className="iconfont icon-radio text-44px" />
                                )}
                            </View>

                            {/* 右侧地址主信息 */}
                            <View className='flex-1 min-w-0 relative pr-4'>
                                {/* 姓名 + 手机号 + 默认标签 */}
                                <View className='flex items-center flex-wrap gap-x-3 gap-y-1 mb-1.5'>
                                    <Text className='text-32px font-bold text-[#111111] max-w-[160px] truncate'>
                                        {addr.receiverName}
                                    </Text>
                                    <Text className='text-32px text-[#333333] font-medium tracking-wide'>
                                        {addr.mobile}
                                    </Text>

                                    {/* 设计稿同款：右上/右侧胶囊默认标签 */}
                                    {addr.isDefault && (
                                        <View className='bg-[#2F77F1] text-white text-20px px-2 py-1 rounded-full font-normal transform scale-90 origin-left'>
                                            默认地址
                                        </View>
                                    )}
                                </View>

                                {/* 详细地址文本 */}
                                <View className='text-28px text-[#666666] leading-relaxed break-all pr-2'>
                                    {addr.provinceName || addr.provinceId}
                                    {addr.cityName || addr.cityId}
                                    {addr.districtName || addr.districtId}
                                    {addr.detail}
                                    {addr.doorplate}
                                </View>
                            </View>
                        </View>
                    )
                }}
            />
            <View className='fixed bottom-5 px-4 left-0 right-0 z-10'>
                <Button
                    className='w-full h-12 flex items-center justify-center bg-[#2F77F1] text-white text-base font-medium rounded-full active:opacity-90 shadow-lg shadow-blue-100'
                    style={{ border: 'none' }}
                    onClick={() => {
                        eventCenter.trigger('addres/select', selected)
                        Taro.navigateBack()
                    }}
                >
                    使用该地址
                </Button>
            </View>
        </View>
    )
}