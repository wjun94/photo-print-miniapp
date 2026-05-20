import { View, Image, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getImageCdnUrl } from '@/utils'
import GalleryPng from '@/assets/img/gallery.png'
import './index.less'

export default function Index() {
  const navigate = (url: string) => {
    Taro.navigateTo({ url })
  }

  // 模拟热门产品数据
  const hotProducts = [
    {
      id: 1,
      title: '标准尺寸打印',
      desc: '多种尺寸可选',
      img: 'standard_print.png', // 替换为真实的图片CDN地址
    },
    {
      id: 2,
      title: '拍立得照片',
      desc: '复古边框打印',
      img: 'polaroid.png',
    },
    {
      id: 3,
      title: '海报打印',
      desc: '高清海报定制',
      img: 'poster.png',
    },
    {
      id: 4,
      title: '照片书',
      desc: '记录美好时光',
      img: 'photobook.png',
    },
  ]

  return (
    <View className='min-h-screen bg-[#fafafa] pb-8'>
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
          className='flex items-center justify-between h-24 px-4 rounded-2xl bg-[#5aa6f9] text-white active:opacity-90'
        >
          <View className='flex flex-col justify-center'>
            <Text className='text-lg font-bold tracking-wide'>上传照片</Text>
            <Text className='text-xs opacity-80 mt-0.5'>快速上传照片</Text>
          </View>
          {/* 此处可用 iconfont 或真实图片替换 */}
          <Text className='iconfont icon-camera text-4xl opacity-90' />
        </View>

        {/* 右侧：打印照片商品 */}
        <View
          onClick={() => navigate('/pages/products/index')}
          className='flex items-center justify-between h-24 px-4 rounded-2xl bg-[#f2f7fd] text-black active:opacity-90'
        >
          <View className='flex flex-col justify-center'>
            <Text className='text-lg font-bold tracking-wide'>打印照片商品</Text>
            <Text className='text-xs opacity-80 text-[#666] mt-0.5'>冲印精美照片</Text>
          </View>
          <Text className='iconfont icon-album text-4xl opacity-90' />
        </View>
      </View>

      {/* 3. 热门冲印产品模块 */}
      <View className='px-4 mt-7'>
        {/* 模块标题 */}
        <View className='text-lg font-bold text-[#333333] mb-4 tracking-wide'>
          热门冲印产品
        </View>

        {/* 2x2 产品网格布局 */}
        <View className='grid grid-cols-2 gap-3'>
          {hotProducts.map((item) => (
            <View
              key={item.id}
              onClick={() => navigate(`/pages/product/detail?id=${item.id}`)}
              className='bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col active:opacity-95'
            >
              {/* 产品大图区域 */}
              <View className='w-full h-32 bg-[#f5f5f5] flex items-center justify-center overflow-hidden'>
                <Image
                  src={getImageCdnUrl(item.img)}
                  className='w-full h-full object-cover'
                />
              </View>

              {/* 产品文字信息 */}
              <View className='p-3 flex flex-col bg-white'>
                <Text className='text-sm font-medium text-[#222222]'>{item.title}</Text>
                <Text className='text-xs text-[#999999] mt-1'>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 4. 底部轻量提示 */}
      <View className='mt-8 flex items-center justify-center gap-1.5 text-gray-300 text-xs'>
        <View className='w-1 h-1 rounded-full bg-gray-200' />
        <Text>未登录将自动为您创建临时账号</Text>
        <View className='w-1 h-1 rounded-full bg-gray-200' />
      </View>
    </View>
  )
}