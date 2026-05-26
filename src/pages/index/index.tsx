import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getImageCdnUrl } from '@/utils'
import GalleryPng from '@/assets/img/gallery.png'
import { ScrollLoadList, Image } from '@/components'
import { products } from '@/api/product'
import './index.less'

export default function Index() {
  const navigate = (url: string) => {
    Taro.navigateTo({ url })
  }

  return (
    <View className='min-h-screen bg-[#fafafa] pb-2'>
      {/* 主视觉卡片 - 优化视觉重心与文字可读性 */}
      <View className='px-4'>
        <View
          className='relative w-full max-w-md rounded-2xl shadow-xl mb-6 overflow-hidden'
          style={{
            background: `url(${getImageCdnUrl("home.jpg")})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* 半透明遮罩层 - 提升文字对比度 */}
          <View className='absolute inset-0 bg-black/40 backdrop-blur-[2px]' />

          {/* 内容区 - 垂直居中 + 柔和动画 */}
          <View className='relative z-10 flex flex-col items-center justify-center h-64 text-center animate-fade-in'>
            <View className='text-3xl font-bold text-white mb-2 drop-shadow-lg tracking-wide flex items-center'>
              <Image className='h-60px w-60px mr-12px' src={GalleryPng} /> <Text>照片打印商城</Text>
            </View>
            <View className='text-white/90 text-base mb-1 drop-shadow'>
              上传照片 · 在线下单 · 极速送达
            </View>
          </View>
        </View>
      </View>

      {/* 2. 中部核心功能双入口 (并排卡片) */}
      <View className='grid grid-cols-2 gap-3 px-4 mt-5'>
        {/* 左侧：上传照片 */}
        <View
          onClick={() => navigate('/pages/upload/index')}
          className='flex items-center flex-col justify-between p-4 rounded-2xl bg-[#5aa6f9] text-white active:opacity-90'
        >
          <Text className='iconfont icon-camera !text-60px opacity-90' />
          <View className='flex flex-col items-center justify-center'>
            <Text className='text-30px font-bold tracking-wide my-2'>上传照片</Text>
            <Text className='text-24px opacity-80 mt-0.5'>快速上传照片</Text>
          </View>
          {/* 此处可用 iconfont 或真实图片替换 */}
        </View>

        {/* 右侧：打印照片商品 */}
        <View
          onClick={() => navigate('/pages/products/index')}
          className='flex items-center flex-col justify-between p-4 rounded-2xl bg-[#f2f7fd] text-black active:opacity-90'
        >
          <Text className='iconfont icon-photo text-primary-400 text-55px opacity-90' />
          <View className='flex flex-col items-center justify-center'>
            <Text className='text-30px font-bold tracking-wide my-2'>打印照片商品</Text>
            <Text className='text-24px opacity-80 text-[#666] mt-0.5'>冲印精美照片</Text>
          </View>
        </View>
      </View>

      {/* 3. 热门冲印产品模块 */}
      <View className='px-4 mt-4'>
        {/* 模块标题 */}
        <View className='text-lg font-bold text-[#333333] mb-4 tracking-wide'>
          热门冲印产品
        </View>

        {/* 2x2 产品网格布局 */}

        <ScrollLoadList
          request={products}
          numColumns={2}
          columnGap={12}   // 列间距 12px
          rowGap={16}      // 行间距 16px
          masonry
          renderItem={
            (item) => (
              <View
                key={item.id}
                onClick={() => navigate(`/pages/detail/index?id=${item.id}`)}
                className='bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col active:opacity-95'
              >
                {/* 产品大图区域 */}
                <View className='w-full h-36 bg-[#f5f5f5] flex items-center justify-center overflow-hidden'>
                  <Image
                    src={item.coverImage}
                    className='w-full h-full object-cover'
                  />
                </View>

                {/* 产品文字信息 */}
                <View className='p-2 flex flex-col bg-white'>
                  <Text className='text-[#222222] line-clamp-2 overflow-hidden'>{item.name}</Text>
                  <Text className='text-30px font-bold text-red-400 mt-1'><Text className="text-22px">￥</Text>{item.price}<Text className="text-22px ml-1 font-400 text-gray-400">{item.priceSuffix}</Text></Text>
                </View>
              </View>
            )
          }
        />
      </View>
    </View>
  )
}