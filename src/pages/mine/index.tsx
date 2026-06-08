import { useAuthStore } from '@/store'
import { getImageCdnUrl } from '@/utils'
import { View, Text, Button } from '@tarojs/components'
import { Image } from '@/components'
import Taro from '@tarojs/taro'
import { getQrcodes } from '@/api/qrcode'
import { useRequest } from 'ahooks'
import Modal from '@/components/Modal' // 假设存在此组件
import { useState } from 'react'

export default function My() {
  const { userInfo } = useAuthStore()
  const { data } = useRequest(getQrcodes)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const navigate = (url: string) => {
    Taro.navigateTo({ url })
  }

  const qrcodes = data

  // 显示商务合作二维码弹窗
  const showBusinessQrcode = () => {
    if (qrcodes?.businessQrcode) {
      setCurrentImageUrl(qrcodes.businessQrcode)
      setModalVisible(true)
    } else {
      Taro.showToast({ title: '暂无二维码', icon: 'none' })
    }
  }

  // 订单状态分类数据
  const orderStates = [
    { id: 'unpaid', label: '待付款', icon: 'icon-unpaid' },
    { id: 'printing', label: '待发货', icon: 'icon-printing' },
    { id: 'shipped', label: '已发货', icon: 'icon-shipped' },
    { id: 'completed', label: '已完成', icon: 'icon-completed' },
  ]

  // 功能列表数据
  const menuItems = [
    {
      id: 'shoyi',
      label: '收益管理',
      icon: 'icon-shoyiguanli',
      fn: () => navigate('/pages/income/index')
    },
    {
      id: 'address',
      label: '地址管理',
      icon: 'icon-address',
      fn: () => navigate('/pages/address/list/index')
    },
    {
      id: 'friend',
      label: '好友列表',
      icon: 'icon-haoyouleibiao',
      fn: () => navigate('/pages/friend/index')
    },
    {
      id: 'invite',
      label: '邀请好友',
      icon: 'icon-share',
      openType: 'share' // 使用微信分享
    },
    qrcodes?.businessQrcode ? {
      id: 'business',
      label: '商务合作',
      icon: 'icon-shangwuhezuo',
      fn: () => showBusinessQrcode()
    } : null,
    {
      id: 'service',
      label: '联系客服',
      icon: 'icon-lianxikefu',
      openType: 'contact'
    },
  ]

  return (
    <View className='min-h-screen px-4 pt-6 pb-10 flex flex-col justify-between box-border'>
      <View className='w-full'>
        {/* 用户信息头部 */}
        <View
          className='flex items-center justify-between mb-6 px-1 active:opacity-90'
          onClick={() => navigate('/pages/profile/index')}
        >
          <View className='flex items-center gap-4'>
            <Image
              src={userInfo?.avatar_url || getImageCdnUrl('avatar_002.png')}
              className='w-14 h-14 rounded-full border-2 border-solid border-white bg-blue-50 shadow-sm'
            />
            <View className='flex flex-col gap-2'>
              <Text className='text-32px font-bold text-[#222222] tracking-wide'>{userInfo?.nickname || '暂无昵称'}</Text>
              <Text className='text-24px text-[#999999]'>ID：{userInfo?.id}</Text>
            </View>
          </View>
          <Text className='iconfont icon-next text-[#999999] text-base font-light' />
        </View>

        {/* 我的订单卡片 */}
        <View className='bg-white rounded-20px p-4 shadow-sm mb-4 border border-solid border-white'>
          <View className='flex justify-between items-center mb-3'>
            <Text className='text-32px font-bold'>我的订单</Text>
            <View
              className='flex items-center gap-0.5 text-gray-500 active:opacity-70'
              onClick={() => navigate('/pages/order/list/index?status=all')}
            >
              <Text className='text-24px'>全部订单</Text>
              <Text className='iconfont icon-next text-24px' />
            </View>
          </View>
          <View className='flex justify-between px-12px'>
            {orderStates.map((item) => (
              <View
                key={item.id}
                className='flex flex-col items-center gap-1 active:opacity-70'
                onClick={() => navigate(`/pages/order/list/index?status=${item.id}`)}
              >
                <Text className={`iconfont ${item.icon} text-64px`} />
                <Text>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 我的服务 */}
        <View className='bg-white rounded-20px pb-2'>
          <Text className='text-32px font-bold p-4 pb-2 block'>我的服务</Text>
          <View className='grid grid-cols-4 gap-0'>
            {menuItems.map((item) => item ? (
              <Button
                key={item.id}
                openType={item.openType as any}
                onClick={() => item.fn?.()}
                className='flex items-center flex-col px-0 text-28px bg-transparent border-0 text-[#333333] py-2 transition-colors duration-150'
              >
                <Text className={`iconfont ${item.icon} mb-12px text-60px`} />
                <Text>{item.label}</Text>
              </Button>
            ) : null)}
          </View>
        </View>
      </View>

      {/* 二维码弹窗 */}
      <Modal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={() => setModalVisible(false)}
        title="商务合作"
        maskClosable
        showCancel={false}
        confirmText="我知道了"
      >
        <View className='flex flex-col items-center justify-center'>
          <Image
            src={currentImageUrl}
            className='w-60 h-60 rounded-lg bg-gray-100 border'
            mode='aspectFit'
            showMenuByLongpress
          />
          <Text
            className='mt-2 text-gray-500'
          >
            长按图片保存二维码
          </Text>
        </View>
      </Modal>
    </View>
  )
}