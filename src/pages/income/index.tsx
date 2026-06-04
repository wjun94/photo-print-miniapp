import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useRequest } from 'ahooks'
import { getCommissionTotal } from '@/api/commission'

export default function CommissionPage() {
  const { data, loading, error } = useRequest(getCommissionTotal)

  if (loading) {
    return (
      <View className="flex justify-center items-center h-screen">
        <Text>加载中...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View className="p-4 bg-red-50 text-red-500 rounded-lg m-4">
        <Text>数据加载失败，请重试</Text>
      </View>
    )
  }

  return (
    <View className="bg-gray-50 min-h-screen pb-8">
      {/* 1. 总收益卡片 */}
      <View className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-2xl m-4 shadow-lg">
        <Text className="text-white text-lg opacity-90">累计总收益(元)</Text>
        <Text className="text-white text-4xl font-bold mt-2">
          {data?.totalCommission || '0.00'}
        </Text>
      </View>

      {/* 2. 提现操作按钮 */}
      <View className="px-4 mt-6">
        <View
          className="bg-white text-blue-600 border-2 border-blue-600 rounded-xl py-3 text-center font-medium"
          onClick={() => Taro.navigateTo({ url: '/pages/withdraw/index' })}
        >
          申请提现
        </View>
      </View>
    </View>
  )
}