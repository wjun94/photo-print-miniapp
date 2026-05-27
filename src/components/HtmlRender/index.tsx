import { useEffect } from 'react';
import { View, ViewProps } from '@tarojs/components';
import Taro from '@tarojs/taro';

// 处理image标签
(Taro as any).options.html.transformElement = el => {
  if (el.nodeName === 'image') {
    el.setAttribute('mode', 'widthFix');
    el.setAttribute('data-src', el.props.src);
  } else if (el.nodeName === 'text') {
    el.setAttribute('data-user-select', 'true');
    el.setAttribute('user-select', 'true');
  }
  return el;
};

export const HtmlRender = ({ className, ...props }: ViewProps) => {
  useEffect(() => {
    // 绑定tap预览事件
    const imgs = [...document.getElementsByClassName('h5-img')];
    if (!imgs.length) return;
    const urls = imgs.map((img: any) => img.props.src).filter(Boolean);

    function testOnTap(event) {
      Taro.previewImage({ urls, current: event.currentTarget.dataset.src });
    }

    imgs.forEach(img => {
      img.addEventListener('tap', testOnTap);
    });

    return () => {
      imgs.forEach(img => {
        img.removeEventListener('tap', testOnTap);
      });
    };
  }, [JSON.stringify(props)]);
  return <View className={`overflow-hidden ${className}`} {...props} />;
};
