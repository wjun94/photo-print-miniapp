import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { View, Image, Canvas } from '@tarojs/components';
import Taro from '@tarojs/taro';

interface IProps {
  src: string;
  aspectRatio: number; // 宽 / 高 比例
}

const ImageCropper = forwardRef((props: IProps, ref) => {
  const { src, aspectRatio } = props;

  // 裁剪框尺寸与位置
  const [cropBox, setCropBox] = useState({ width: 300, height: 450, left: 0, top: 0 });
  
  // 图片手势变换状态（实时渲染）
  const [imgState, setImgState] = useState({ x: 0, y: 0, scale: 1, rotate: 0 });

  // 记录图片的原始宽高和初始化基准尺寸
  const imgInfo = useRef({ width: 0, height: 0, baseWidth: 0, baseHeight: 0 });

  // 记录手势持久化变量
  const gesture = useRef({
    startX: 0, startY: 0, startImgX: 0, startImgY: 0,
    startScale: 1, startRotate: 0, startDist: 0, startAngle: 0,
    isMultiTouch: false
  });

  // 屏幕尺寸（用于遮罩计算）
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  // 1. 初始化：获取屏幕尺寸、计算裁剪框，并加载图片真实宽高
  useEffect(() => {
    const sysInfo = Taro.getSystemInfoSync();
    const maxW = sysInfo.windowWidth * 0.85;
    const maxH = sysInfo.windowHeight * 0.55; 
    
    let w = maxW;
    let h = w / aspectRatio;
    if (h > maxH) {
      h = maxH;
      w = h * aspectRatio;
    }

    const offsetTop = (sysInfo.windowHeight - h) / 2 - (sysInfo.windowHeight * 0.12);

    const box = {
      width: w,
      height: h,
      left: (sysInfo.windowWidth - w) / 2,
      top: Math.max(20, offsetTop) 
    };
    setCropBox(box);
    setScreenSize({ width: sysInfo.windowWidth, height: sysInfo.windowHeight });

    // 获取图片真实宽高，计算类似 aspectFill 的初始底图大小
    Taro.getImageInfo({
      src: src,
      success: (res) => {
        imgInfo.current.width = res.width;
        imgInfo.current.height = res.height;

        // 计算以 aspectFill 模式充满裁剪框所需的初始宽高
        let imgW = box.width;
        let imgH = (res.height * box.width) / res.width;
        if (imgH < box.height) {
          imgH = box.height;
          imgW = (res.width * box.height) / res.height;
        }

        imgInfo.current.baseWidth = imgW;
        imgInfo.current.baseHeight = imgH;
        
        // 重置手势状态
        setImgState({ x: 0, y: 0, scale: 1, rotate: 0 });
      }
    });
  }, [src, aspectRatio]);

  // 2. 核心：Canvas 绝对物理映射裁剪
  useImperativeHandle(ref, () => ({
    rotate: (deg: number) => {
      setImgState(prev => ({ ...prev, rotate: prev.rotate + deg }));
    },
    drawAndCrop: () => {
      return new Promise((resolve, reject) => {
        // @ts-ignore
        const componentInstance = process.env.TARO_ENV === 'webapp' ? null : React.Component?.prototype?.$scope || null;
        const ctx = Taro.createCanvasContext('cropCanvas', componentInstance);
        
        if (!ctx) {
          reject(new Error('未能创建Canvas上下文'));
          return;
        }

        // 清空画布
        ctx.clearRect(0, 0, cropBox.width, cropBox.height);
        ctx.save();

        // 【核心算法】将 Canvas 的原点移动到裁剪框的正中心
        const centerX = cropBox.width / 2 + imgState.x;
        const centerY = cropBox.height / 2 + imgState.y;
        ctx.translate(centerX, centerY);

        // 应用手势旋转与手势缩放
        ctx.rotate((imgState.rotate * Math.PI) / 180);
        ctx.scale(imgState.scale, imgState.scale);

        // 绘制图片：基于图片初始计算出的 baseWidth/baseHeight 居中渲染
        const drawW = imgInfo.current.baseWidth;
        const drawH = imgInfo.current.baseHeight;
        
        ctx.drawImage(src, -drawW / 2, -drawH / 2, drawW, drawH);

        ctx.restore();
        
        // 渲染并导出高清图
        ctx.draw(false, () => {
          setTimeout(() => {
            Taro.canvasToTempFilePath({
              canvasId: 'cropCanvas',
              destWidth: cropBox.width * 3, // 保持3倍高清放大导出，适合照片打印
              destHeight: cropBox.height * 3,
              fileType: 'jpg',
              quality: 1,
              success: (res) => {
                if (res.tempFilePath) resolve(res.tempFilePath);
                else reject(new Error('导出路径为空'));
              },
              fail: (err) => reject(err)
            }, componentInstance);
          }, 300);
        });
      });
    }
  }));

  // --- 手势计算函数 ---
  const getDistance = (p1: any, p2: any) => {
    const x = p1.clientX - p2.clientX;
    const y = p1.clientY - p2.clientY;
    return Math.sqrt(x * x + y * y);
  };

  const getAngle = (p1: any, p2: any) => {
    const x = p1.clientX - p2.clientX;
    const y = p1.clientY - p2.clientY;
    return (Math.atan2(y, x) * 180) / Math.PI;
  };

  const onTouchStart = (e: any) => {
    const touches = e.touches;
    if (!touches || touches.length === 0) return;

    const g = gesture.current;
    g.startX = touches[0].clientX;
    g.startY = touches[0].clientY;
    g.startImgX = imgState.x;
    g.startImgY = imgState.y;
    g.startScale = imgState.scale;
    g.startRotate = imgState.rotate;

    if (touches.length >= 2) {
      g.isMultiTouch = true;
      g.startDist = getDistance(touches[0], touches[1]);
      g.startAngle = getAngle(touches[0], touches[1]);
    } else {
      g.isMultiTouch = false;
    }
  };

  const onTouchMove = (e: any) => {
    const touches = e.touches;
    if (!touches || touches.length === 0) return;

    const g = gesture.current;

    // A. 双指手势
    if (touches.length >= 2 && g.isMultiTouch) {
      const newDist = getDistance(touches[0], touches[1]);
      const newAngle = getAngle(touches[0], touches[1]);
      if (g.startDist === 0) return;

      const scaleFactor = newDist / g.startDist;
      const angleDiff = newAngle - g.startAngle;

      setImgState(prev => ({
        ...prev,
        scale: Math.max(0.4, Math.min(g.startScale * scaleFactor, 6)), // 限制缩放
        rotate: g.startRotate + angleDiff
      }));
    } 
    // B. 单指平移
    else if (touches.length === 1 && !g.isMultiTouch) {
      const deltaX = touches[0].clientX - g.startX;
      const deltaY = touches[0].clientY - g.startY;

      setImgState(prev => ({
        ...prev,
        x: g.startImgX + deltaX,
        y: g.startImgY + deltaY
      }));
    }
  };

  // 计算遮罩层尺寸（四个方向）
  const renderMasks = () => {
    if (!cropBox.width || !screenSize.width) return null;
    
    const { left, top, width, height } = cropBox;
    const { width: screenW, height: screenH } = screenSize;
    
    return (
      <>
        {/* 顶部遮罩 */}
        <View 
          className="fixed bg-black/60 pointer-events-none"
          style={{
            left: 0,
            top: 0,
            width: `${screenW}px`,
            height: `${top}px`,
            zIndex: 10
          }}
        />
        {/* 底部遮罩 */}
        <View 
          className="fixed bg-black/60 pointer-events-none"
          style={{
            left: 0,
            top: `${top + height}px`,
            width: `${screenW}px`,
            height: `${screenH - top - height}px`,
            zIndex: 10
          }}
        />
        {/* 左侧遮罩 */}
        <View 
          className="fixed bg-black/60 pointer-events-none"
          style={{
            left: 0,
            top: `${top}px`,
            width: `${left}px`,
            height: `${height}px`,
            zIndex: 10
          }}
        />
        {/* 右侧遮罩 */}
        <View 
          className="fixed bg-black/60 pointer-events-none"
          style={{
            left: `${left + width}px`,
            top: `${top}px`,
            width: `${screenW - left - width}px`,
            height: `${height}px`,
            zIndex: 10
          }}
        />
      </>
    );
  };

  return (
    <View 
      className="fixed w-full h-full left-0 top-0 overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={() => { gesture.current.isMultiTouch = false; }}
    >
      {/* 半透明遮罩层：裁剪框外部区域变暗，突出选中区域 */}
      {renderMasks()}

      {/* 
        图片展示区（核心：overflow-hidden 实现超出部分隐藏）
        增强的蓝色边框 + 外发光效果，突出“选中照片”的视觉反馈
      */}
      <View 
        className="absolute overflow-hidden"
        style={{
          width: `${cropBox.width}px`,
          height: `${cropBox.height}px`,
          left: `${cropBox.left}px`,
          top: `${cropBox.top}px`,
          border: '4px solid #3b82f6', // 加粗蓝色边框
          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3), 0 0 0 6px rgba(59, 130, 246, 0.2), 0 8px 20px rgba(0,0,0,0.3)', // 多层次外发光
          borderRadius: '2px', // 轻微圆角，更精致
          zIndex: 20, // 确保边框显示在遮罩之上
          boxSizing: 'border-box'
        }}
      >
        <View className="relative w-full h-full flex items-center justify-center pointer-events-none">
          {imgInfo.current.baseWidth > 0 && (
            <Image
              src={src}
              className="absolute origin-center will-change-transform"
              style={{
                width: `${imgInfo.current.baseWidth}px`,
                height: `${imgInfo.current.baseHeight}px`,
                transform: `translate3d(${imgState.x}px, ${imgState.y}px, 0) scale(${imgState.scale}) rotate(${imgState.rotate}deg)`,
              }}
              mode="scaleToFill"
            />
          )}
        </View>

        {/* 
          内部辅助虚线框（增强构图的辅助线，保留优化样式）
        */}
        <View 
          className="absolute inset-0 border-[2px] border-dashed border-white/60 pointer-events-none"
          style={{ margin: '-2px' }}
        />
      </View>

      {/* 隐藏的Canvas用于导出裁剪图片 */}
      <Canvas
        canvasId="cropCanvas"
        className="absolute pointer-events-none"
        style={{
          width: `${cropBox.width}px`,
          height: `${cropBox.height}px`,
          position: 'fixed',
          left: '-9999rpx',
          top: '-9999rpx',
        }}
      />
    </View>
  );
});

export default ImageCropper;