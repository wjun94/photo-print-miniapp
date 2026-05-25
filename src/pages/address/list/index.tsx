import { View, Text, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { getAddressList, setAddressDefault, addressDelete } from '@/api/address'
import { ScrollLoadList, ScrollLoadListRef } from '@/components'
import { useRef } from 'react'

export default function AddressList() {
  const listRef = useRef<ScrollLoadListRef>(null)

  const setDefault = async (id: string) => {
    try {
      await setAddressDefault(id)
      Taro.showToast({ title: '已设为默认', icon: 'success' })
      listRef.current?.refresh()
    } catch (err) {
      Taro.showToast({ title: '设置失败', icon: 'none' })
    }
  }

  const deleteAddress = (id: string) => {
    Taro.showModal({
      title: '提示',
      content: '确定删除该地址吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await addressDelete(id)
            Taro.showToast({ title: '删除成功', icon: 'success' })
            listRef.current?.refresh()
          } catch (err) {
            Taro.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }

  const editAddress = (id: string) => {
    Taro.navigateTo({ url: `/pages/address/edit/index?id=${id}` })
  }

  const copyAddress = (addr: any) => {
    Taro.setClipboardData({
      data: `${addr.provinceName}${addr.cityName}${addr.districtName}${addr.detail}${addr.doorplate}`
    })
  }

  const addAddress = () => {
    Taro.navigateTo({ url: '/pages/address/edit/index' })
  }

  useDidShow(() => {
    listRef?.current?.refresh?.()
  })

  return (
    <View className='min-h-screen bg-[#F7F8FA] p-4 pb-24'>
      <ScrollLoadList
        ref={listRef}
        request={getAddressList}
        renderItem={(addr: any) => (
          <View key={addr.id} className='relative bg-white rounded-20px pb-2 p-4 mb-3 shadow-sm overflow-hidden'>

            {/* 1. 左上角默认地址标签 */}
            {addr.isDefault && (
              <View className='absolute top-0 left-0 bg-[#2F77F1] text-white text-24px px-2.5 py-1 rounded-br-20px tracking-wider'>
                默认地址
              </View>
            )}

            {/* 2. 用户基本信息栏（针对默认标签下移间距） */}
            <View className={`flex items-baseline gap-4 text-32px mb-2 ${addr.isDefault ? 'mt-4' : 'mt-1'}`}>
              <Text className='font-bold text-gray-900'>{addr.receiverName}</Text>
              <Text className='text-gray-500 tracking-wide'>{addr.mobile}</Text>
            </View>

            {/* 3. 详细地址完整拼接区域 */}
            <View className='text-gray-600 leading-relaxed mb-3 pr-2'>
              {/* 兼容名或者ID字段，优先展示名字 */}
              {addr.provinceName || addr.provinceId}{addr.cityName || addr.cityId}{addr.districtName || addr.districtId}
              {addr.detail}
              {addr.doorplate && <Text className='text-gray-400'></Text>}
            </View>

            {/* 4. 底部极细分割线 & 工具栏 */}
            <View className='flex justify-between items-center pt-2 bt'>
              {/* 左侧：设为默认 按钮（仅非默认时展示） */}
              <View>
                {!addr.isDefault ? (
                  <View
                    className='flex items-center gap-1.5 text-gray-600 active:opacity-70'
                    onClick={() => setDefault(addr.id)}
                  >
                    <Text className='text-26px'>设为默认</Text>
                  </View>
                ) : (
                  <View /> /* 保持 flex 占位平衡 */
                )}
              </View>

              {/* 右侧：动作按钮组 */}
              <View className='flex items-center gap-5'>
                {/* 编辑 */}
                <View
                  className='flex items-center gap-1.5 text-gray-600 active:opacity-70'
                  onClick={() => editAddress(addr.id)}
                >
                  <Text className='iconfont icon-edit' />
                  <Text>编辑</Text>
                </View>

                {/* 删除 */}
                <View
                  className='flex items-center gap-1.5 text-gray-600 active:opacity-70'
                  onClick={() => deleteAddress(addr.id)}
                >
                  <Text className='iconfont icon-delete' />
                  <Text>删除</Text>
                </View>

                {/* 复制 */}
                <View
                  className='flex items-center gap-1.5 text-gray-600 active:opacity-70'
                  onClick={() => copyAddress(addr)}
                >
                  <Text className='iconfont icon-copy' />
                  <Text>复制</Text>
                </View>
              </View>

            </View>
          </View>
        )}
      />

      {/* 5. 底部固定新增按钮区域 */}
      <View className='fixed bottom-5 left-0 right-0 px-6 z-10'>
        <Button
          className='w-full h-12 flex items-center justify-center bg-[#2F77F1] text-white text-base font-medium rounded-full active:opacity-90 shadow-lg shadow-blue-100'
          style={{ border: 'none' }}
          onClick={addAddress}
        >
          新增地址
        </Button>
      </View>
    </View>
  )
}