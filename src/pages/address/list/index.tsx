import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getAddressList, setAddressDefault, addressDelete } from '@/api/address'
import { ScrollLoadList, ScrollLoadListRef } from '@/components'
import { useRef } from 'react'

export default function AddressList() {
  const listRef = useRef<ScrollLoadListRef>(null)
  const setDefault = async (id: string) => {
    try {
      await setAddressDefault(id)
      Taro.showToast({ title: '已设为默认', icon: 'success' })
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

  const copyAddress = (addr: ADDRESS.Items) => {
    // 复制地址跳转到编辑页，不带id表示新增，但预填数据
    Taro.navigateTo({ url: `/pages/address/edit/index?copy=${JSON.stringify(addr)}` })
  }

  const addAddress = () => {
    Taro.navigateTo({ url: '/pages/address/edit/index' })
  }

  return (
    <View className='min-h-screen bg-gray-100 p-4'>
      <ScrollLoadList
        ref={listRef}
        request={getAddressList}
        renderItem={(addr: any) => (
          <View key={addr.id} className='bg-white rounded-lg p-4 mb-3 shadow-sm'>
            <View className='flex justify-between mb-2'>
              <Text className='font-bold'>{addr.receiverName}</Text>
              <Text>{addr.mobile}</Text>
            </View>
            <Text className='text-gray-600 mb-1'>
              {addr.provinceId} {addr.cityId} {addr.districtId} {addr.detail}
            </Text>
            <Text className='text-gray-400 text-sm mb-3'>{addr.doorplate}</Text>
            <View className='flex justify-between items-center border-t pt-2'>
              {addr.isDefault ? (
                <Text className='text-red-500'>默认地址</Text>
              ) : (
                <Button size='mini' type='default' onClick={() => setDefault(addr.id)}>设为默认</Button>
              )}
              <View className='flex gap-2'>
                <Button size='mini' type='default' onClick={() => editAddress(addr.id)}>编辑</Button>
                <Button size='mini' type='default' onClick={() => deleteAddress(addr.id)}>删除</Button>
                <Button size='mini' type='default' onClick={() => copyAddress(addr)}>复制</Button>
              </View>
            </View>
          </View>
        )}
      />

      <View className='fixed bottom-4 left-0 right-0 px-4'>
        <Button className='bg-red-500 text-white rounded-full' onClick={addAddress}>新增地址</Button>
      </View>
    </View>
  )
}