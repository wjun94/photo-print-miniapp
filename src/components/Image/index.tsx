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
}

export default ({ src, cdn, preview, current, urls, mode = 'aspectFill', ...props }: Omit<ImageProps, 'preview'> & P) => {
  let finallySrc = src || '';
  if (cdn) {
    finallySrc = getImageCdnUrl(src)
  } else {
    finallySrc = getImageUrl(src)
  }
  return <Image
    onClick={() => preview && previewImage({ urls: urls ? urls?.map(item => getImageUrl(item)) : [finallySrc], current: getImageUrl(current || '') || finallySrc })}
    src={finallySrc}
    mode={mode}
    {...props}
  />;
};
