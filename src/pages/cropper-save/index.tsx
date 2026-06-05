import React, { useState, useRef } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { ImageCropper } from '@/components';

const CropPage = () => {
  const { params: { url: routerUrl } } = useRouter()
  const [imageSrc, setImageSrc] = useState<string>(decodeURIComponent(routerUrl || ''));
  const cropperRef = useRef<any>(null);

  const handleSelectImage = async () => {
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sizeType: ['original'],
        sourceType: ['album', 'camera'],
      });
      setImageSrc(res.tempFiles[0].tempFilePath);
    } catch (e) {
      console.log('取消选择');
    }
  };

  // 处理保存到相册以及权限遭拒的兜底逻辑
  const savePhoto = async (filePath: string) => {
    try {
      await Taro.saveImageToPhotosAlbum({ filePath });
      Taro.showToast({ title: '已成功保存至相册', icon: 'success' });
    } catch (err: any) {
      // 检查是否是用户拒绝了相册权限
      if (err.errMsg.includes('auth deny') || err.errMsg.includes('auth denied')) {
        Taro.showModal({
          title: '提示',
          content: '需要您同意保存到相册权限，才能保存裁剪后的照片',
          confirmText: '去开启',
          success: (res) => {
            if (res.confirm) {
              // 引导用户打开小程序系统设置页面
              Taro.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting['scope.writePhotosAlbum']) {
                    Taro.showToast({ title: '权限已开启，请重新保存', icon: 'none' });
                  }
                }
              });
            }
          }
        });
      } else {
        Taro.showToast({ title: '保存失败，请重试', icon: 'none' });
      }
    }
  };

  const handleCropConfirm = async () => {
    if (!cropperRef.current) return;

    Taro.showLoading({ title: '高清照片导出中...', mask: true });

    try {
      const croppedPath = await cropperRef.current.drawAndCrop();
      Taro.hideLoading();

      // 调起保存权限流程
      await savePhoto(croppedPath);
    } catch (err) {
      Taro.hideLoading();
      console.error(err);
      Taro.showToast({ title: '裁剪生成失败', icon: 'none' });
    }
  };

  return (
    <View className="flex flex-col h-screen bg-zinc-950 select-none">
      {/* 顶部栏 */}
      <View className="fixed top-0 left-0 w-750px py-20px flex justify-between items-center bg-zinc-900 border-b border-zinc-800 z-50">
        <Text className="text-white text-base font-bold ml-6">智能打印裁剪框</Text>
        <View
          className="bg-blue-600 px-4 py-1.5 rounded-full active:opacity-80 mr-6"
          onClick={handleSelectImage}
        >
          <Text className="text-xs text-white font-medium">选择原图</Text>
        </View>
      </View>

      {/* 裁剪主画布 */}
      <View className="flex-1 flex items-center justify-center relative bg-zinc-950">
        {imageSrc ? (
          <ImageCropper ref={cropperRef} src={imageSrc} aspectRatio={2 / 3} />
        ) : (
          <View className="text-center" onClick={handleSelectImage}>
            <Text className="text-zinc-600 block text-sm mb-2">未注入图片源</Text>
            <Text className="text-blue-400 text-xs font-semibold">→ 点击这里打开相册 ←</Text>
          </View>
        )}
      </View>

      {/* 底部按钮 */}
      {imageSrc && (
        <View className="pb-10 pt-6 px-6 bg-zinc-900 border-t border-zinc-800 flex space-x-4 z-50">
          <View
            className="flex-1 bg-zinc-800 active:opacity-70 py-3.5 rounded-xl flex justify-center items-center"
            onClick={() => cropperRef.current?.rotate(90)}
          >
            <Text className="text-zinc-300 text-sm">旋转90°</Text>
          </View>
          <View
            className="flex-[2] bg-emerald-600 active:opacity-90 py-3.5 rounded-xl flex justify-center items-center"
            onClick={handleCropConfirm}
          >
            <Text className="text-white text-sm font-bold">确认裁剪并保存</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default CropPage;