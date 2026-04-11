import { MEDIA_TYPES } from './config.js';

// 媒体处理器
class MediaHandler {
  // 判断媒体类型
  getMediaType(file) {
    if (file.type.startsWith('image/')) {
      return MEDIA_TYPES.PHOTO;
    } else if (file.type.startsWith('video/')) {
      return MEDIA_TYPES.VIDEO;
    }
    return null;
  }
  
  // 压缩图片（只压缩质量，不压缩尺寸）
  async compressImage(file, quality = 0.7) {
    // 小于1M的图片不需要压缩
    if (file.size < 1 * 1024 * 1024) {
      return file;
    }
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // 根据文件大小调整质量参数
      // 文件超过10M：质量参数 0.5
      // 文件不超过10M：质量参数 0.7
      const adjustedQuality = file.size > 10 * 1024 * 1024 ? 0.5 : 0.7;

      img.onload = () => {
        // 不压缩尺寸，保持原尺寸
        const width = img.width;
        const height = img.height;
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        console.log('开始压缩图片:', file.name, '原始大小:', (file.size / 1024 / 1024).toFixed(2) + 'MB', '质量:', adjustedQuality);
        
        // 优先使用WebP格式压缩
        canvas.toBlob((blob) => {
          if (blob) {
            // WebP压缩成功
            console.log('WebP压缩成功:', blob.type, '压缩后大小:', (blob.size / 1024 / 1024).toFixed(2) + 'MB');
            const fileName = file.name.replace(/\.[^/.]+$/, '.webp');
            resolve(new File([blob], fileName, {
              type: 'image/webp',
              lastModified: Date.now()
            }));
          } else {
            // WebP不支持，降级为JPEG
            console.log('WebP不支持，降级为JPEG');
            canvas.toBlob((fallbackBlob) => {
              const fileName = file.name.replace(/\.[^/.]+$/, '.jpg');
              resolve(new File([fallbackBlob], fileName, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }));
            }, 'image/jpeg', adjustedQuality);
          }
        }, 'image/webp', adjustedQuality);
      };
      
      img.onerror = () => {
        resolve(file); // 如果压缩失败，返回原文件
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
  
  // 提取图片 EXIF 信息
  async extractEXIF(file) {
    return new Promise((resolve, reject) => {
      // 检查 EXIF.js 是否加载
      if (typeof EXIF === 'undefined') {

        resolve(null);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            EXIF.getData(img, function() {
              const exifData = {
                ISO: EXIF.getTag(this, 'ISOSpeedRatings'),
                aperture: EXIF.getTag(this, 'FNumber') ? (Array.isArray(EXIF.getTag(this, 'FNumber')) && EXIF.getTag(this, 'FNumber')[1] !== 0 ? `f/${(EXIF.getTag(this, 'FNumber')[0] / EXIF.getTag(this, 'FNumber')[1]).toFixed(1)}` : `f/${EXIF.getTag(this, 'FNumber')}`) : null,
                shutterSpeed: EXIF.getTag(this, 'ExposureTime') ? `1/${Math.round(1 / EXIF.getTag(this, 'ExposureTime'))}` : null,
                camera: EXIF.getTag(this, 'Make') && EXIF.getTag(this, 'Model') ? `${EXIF.getTag(this, 'Make')} ${EXIF.getTag(this, 'Model')}` : null,
                focalLength: EXIF.getTag(this, 'FocalLength') ? (Array.isArray(EXIF.getTag(this, 'FocalLength')) && EXIF.getTag(this, 'FocalLength')[1] !== 0 ? `${(EXIF.getTag(this, 'FocalLength')[0] / EXIF.getTag(this, 'FocalLength')[1]).toFixed(1)}mm` : `${EXIF.getTag(this, 'FocalLength')}mm`) : null,
                shootTime: EXIF.getTag(this, 'DateTimeOriginal') || EXIF.getTag(this, 'DateTime')
              };
              
              // 过滤掉 null 值
              const filteredExif = Object.fromEntries(
                Object.entries(exifData).filter(([_, value]) => value !== null && value !== undefined)
              );
              
              resolve(filteredExif);
            });
          } catch (error) {
            console.error('提取 EXIF 信息失败:', error);
            resolve(null);
          }
        };
        img.onerror = () => {
          resolve(null);
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  }
  
  // 截取视频封面
  async captureVideoThumbnail(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.crossOrigin = 'anonymous';
      
      // 尝试的时间点数组（秒）
      const timePoints = [0.1, 1, 2, 3, 5];
      let currentIndex = 0;
      
      video.addEventListener('loadeddata', () => {
        // 开始尝试第一个时间点
        tryNextTimePoint();
      });
      
      video.addEventListener('seeked', () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // 检查画布是否为黑屏（通过获取像素数据）
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let isBlackFrame = true;
          
          // 抽样检查像素，判断是否为黑屏
          const step = Math.floor(data.length / 1000); // 每1000个像素检查一个
          for (let i = 0; i < data.length; i += step) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // 如果有任何像素不是接近黑色，就不是黑屏
            if (r > 10 || g > 10 || b > 10) {
              isBlackFrame = false;
              break;
            }
          }
          
          if (!isBlackFrame || currentIndex >= timePoints.length - 1) {
            // 将 canvas 转换为 Blob
            canvas.toBlob((blob) => {
              URL.revokeObjectURL(video.src);
              resolve(blob);
            }, 'image/jpeg', 0.8);
          } else {
            // 尝试下一个时间点
            currentIndex++;
            tryNextTimePoint();
          }
        } catch (error) {
          console.error('截取视频封面失败:', error);
          URL.revokeObjectURL(video.src);
          resolve(null);
        }
      });
      
      video.addEventListener('error', () => {
        URL.revokeObjectURL(video.src);
        resolve(null);
      });
      
      // 尝试下一个时间点
      function tryNextTimePoint() {
        if (currentIndex < timePoints.length) {
          // 确保时间点不超过视频总时长
          const duration = video.duration || 10; // 默认10秒
          const timePoint = Math.min(timePoints[currentIndex], duration - 0.1);
          video.currentTime = timePoint;
        } else {
          // 所有时间点都尝试失败，返回第一帧
          video.currentTime = 0.1;
        }
      }
    });
  }
  
  // 处理媒体文件
  async processMedia(file) {
    const type = this.getMediaType(file);
    if (!type) {
      throw new Error('不支持的文件类型');
    }
    
    const result = {
      type,
      originalFilename: file.name,
      exifInfo: null,
      shootTime: null,
      thumbnail: null,
      compressedFile: null
    };
    
    if (type === MEDIA_TYPES.PHOTO) {
      // 处理图片
      const exifInfo = await this.extractEXIF(file);
      result.exifInfo = exifInfo;
      
      // 从 EXIF 中提取拍摄时间
      if (exifInfo && exifInfo.shootTime) {
        // 格式化 EXIF 时间字符串 (YYYY:MM:DD HH:MM:SS)
        const shootTimeStr = exifInfo.shootTime;
        try {
          // 正确处理 EXIF 时间格式
          const parts = shootTimeStr.split(' ');
          const datePart = parts[0].replace(/:/g, '-');
          const timePart = parts[1] || '00:00:00';
          const formattedTime = `${datePart} ${timePart}`;
          
          // EXIF 时间通常存储为本地时间，需要正确转换为 ISO 格式
          // 使用 Date 构造函数解析为本地时间，然后转换为 ISO 字符串
          const date = new Date(formattedTime);
          if (!isNaN(date.getTime())) {
            // 保持本地时间不变，转换为 ISO 格式存储
            // 这样后端接收后可以正确解析为本地时间
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            result.shootTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
          } else {
            result.shootTime = new Date().toISOString();
          }
        } catch (error) {
          console.error('日期转换失败:', error);
          result.shootTime = new Date().toISOString();
        }
      } else {
        result.shootTime = new Date().toISOString();
      }
      
      // 压缩图片
      result.compressedFile = await this.compressImage(file, 0.7, 1920);
    } else if (type === MEDIA_TYPES.VIDEO) {
      // 处理视频
      const thumbnailBlob = await this.captureVideoThumbnail(file);
      result.thumbnail = thumbnailBlob;
      result.shootTime = new Date().toISOString();
    }
    
    return result;
  }
  
  // 生成随机文件名
  generateFileName(type, originalFilename, siteId, ossPrefix = null) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}`;
    const randomStr = Math.random().toString(36).substring(2, 10);
    const ext = originalFilename.split('.').pop();
    
    // 清理路径中的多余斜杠
    const cleanPath = (path) => {
      return path.replace(/^\/|\/$/g, '').replace(/\/+/g, '/');
    };
    
    // 根据类型生成不同的路径格式
    if (type === 'banner') {
      // Banner图片路径：site/站点id/banner/具体文件
      return `site/${siteId}/banner/${randomStr}.${ext}`;
    } else {
      // 相册图片路径：site/站点id/相册设置的ossPrefix/具体文件
      const prefix = ossPrefix || type;
      const cleanPrefix = cleanPath(prefix);
      return `site/${siteId}/${cleanPrefix}/${randomStr}.${ext}`;
    }
  }
  
  // 生成 OSS 路径（旧方法，保留兼容性）
  generateOSSPath(file, albumId, type) {
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}_${randomStr}.${extension}`;
    
    return `album/${albumId}/${type.toLowerCase()}/${filename}`;
  }
  
  // 生成视频封面 OSS 路径（旧方法，保留兼容性）
  generateCoverOSSPath(albumId) {
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `album/${albumId}/covers/cover_${timestamp}_${randomStr}.jpg`;
  }
}

// 导出单例
export const mediaHandler = new MediaHandler();