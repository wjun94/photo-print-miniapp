import { View, Text } from '@tarojs/components'
import { memo } from 'react'
import { getFriendsList } from '@/api/commission'
import { ScrollLoadList, Image } from '@/components'

// 使用 React.memo 防止长列表不必要的重渲染
const FriendItem = memo(({ item }: { item: COMMISSION.FriendItem }) => {
  return (
    // 1. mb-5: 底部间距 20px
    <View className='bg-white flex items-center px-5 py-4 rounded-20px mb-5'>
      {/* 头像 */}
      <Image
        src={item.avatarUrl}
        mode='aspectFill'
        className='w-12 h-12 rounded-full mr-3 shrink-0'
      />

      {/* 文本信息区域 */}
      <View className='flex-1 overflow-hidden'>
        {/* 昵称 */}
        <Text className='text-base font-medium text-gray-800 truncate block'>
          {item.nickname || '暂无昵称'}
        </Text>

        {/* 累计消费与时间 */}
        <Text className='text-xs text-gray-400 mt-1 block'>
          累计消费：¥{item.totalSpent.toFixed(2)} | {item.createdAt}
        </Text>
      </View>
    </View>
  )
})

export default () => {
  return (
    <>
      <View className='flex items-center text-primary-400 bg-primary-200 px-5 py-2'>
        <Text className='iconfont icon-hint mr-2' />
        <Text>累计消费只统计已完成订单</Text>
      </View>
      {/* 3. px-5: 保证整个列表区域的左右边距也是 20px */}
      <View className='px-5 pt-4'>
        <ScrollLoadList
          request={getFriendsList}
          renderItem={(item: COMMISSION.FriendItem) => {
            return <FriendItem key={item.id} item={item} />
          }}
        />
      </View >
    </>
  )
}