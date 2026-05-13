import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'
import './index.less'

export default function Index () {
  useLoad(() => {
    console.log('Page loaded.')
  })

  return (
    <View className='index'>
      <Text className="text-32px bg-red-400">Hello world!</Text>
    </View>
  )
}
