import { Image } from '@tarojs/components';
import type { ImageProps } from '@tarojs/components/types/Image';
import { previewImage } from '@tarojs/taro'
import { getImageUrl, getImageCdnUrl } from '@/utils'

type P = {
  /** 预览 */
  preview?: boolean
  cdn?: boolean
  /** 图片预览多张 */
  urls?: string[]
  current?: string
  // 尺寸参数
  imageView2?: number
}

export default ({ src, cdn, preview, imageView2 = 750, current, urls, mode = 'aspectFill', ...props }: Omit<ImageProps, 'preview'> & P) => {
  let finallySrc = src || '';
  if (cdn) {
    finallySrc = getImageCdnUrl(src)
  } else {
    finallySrc = getImageUrl(src)
  }
  finallySrc += `?imageView2/1/w/${imageView2}`
  return <Image
    onClick={() => preview && previewImage({ urls: urls ? urls?.map(item => getImageUrl(item)) : [finallySrc], current: getImageUrl(current || '') || finallySrc })}
    src={finallySrc}
    mode={mode}
    {...props}
  />;
};
