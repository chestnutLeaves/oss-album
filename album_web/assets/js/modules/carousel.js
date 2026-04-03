/**
 * 轮播相关功能模块
 * 负责实现页面轮播效果
 */

// 导入依赖函数
import { openBannerLightbox } from './lightbox.js';

// 导入配置文件
import { UI_CONFIG } from '../config.js';

/**
 * 初始化轮播图
 */
export function initCarousel() {
    const carousel = document.querySelector('.carousel-enhanced');
    if (!carousel) return;
    
    const inner = carousel.querySelector('.carousel-inner');
    if (!inner) return;
    
    // 重新获取items和indicators，确保使用最新的元素
    const items = carousel.querySelectorAll('.carousel-item');
    const prevBtn = carousel.querySelector('.carousel-control.prev');
    const nextBtn = carousel.querySelector('.carousel-control.next');
    const indicators = carousel.querySelectorAll('.carousel-indicator');
    
    if (!items.length) return;
    
    // 清除之前可能存在的定时器和事件监听器
    if (carousel._interval) {
        clearInterval(carousel._interval);
        carousel._interval = null;
    }
    
    // 存储轮播图状态到carousel元素上
    carousel._carouselState = {
        currentIndex: 0,
        items: items,
        indicators: indicators,
        inner: inner
    };
    
    // 设置初始状态
    updateCarousel();
    
    // 自动播放
    startAutoPlay();
    
    // 鼠标悬停时暂停，离开时继续
    // 先移除可能存在的旧事件监听器
    carousel.removeEventListener('mouseenter', handleMouseEnter);
    carousel.removeEventListener('mouseleave', handleMouseLeave);
    // 添加新的事件监听器
    carousel.addEventListener('mouseenter', handleMouseEnter);
    carousel.addEventListener('mouseleave', handleMouseLeave);
    
    // 点击箭头切换
    if (prevBtn) {
        // 先移除可能存在的旧事件监听器
        prevBtn.onclick = null;
        prevBtn.addEventListener('click', handlePrevClick);
    }
    
    if (nextBtn) {
        // 先移除可能存在的旧事件监听器
        nextBtn.onclick = null;
        nextBtn.addEventListener('click', handleNextClick);
    }
    
    // 点击指示器切换
    if (indicators.length) {
        indicators.forEach((indicator, index) => {
            // 先移除可能存在的旧事件监听器
            indicator.onclick = null;
            indicator.addEventListener('click', () => handleIndicatorClick(index));
        });
    }
    
    // 为banner图片和蒙层添加点击事件，实现大图查看
    console.log('开始为banner添加点击事件，items数量:', items.length);
    items.forEach((item, index) => {
        // 为图片添加点击事件
        const img = item.querySelector('img');
        if (img) {
            console.log('找到banner图片，索引:', index);
            // 先移除可能存在的旧事件监听器
            img.onclick = null;
            // 添加新的点击事件监听器
            img.addEventListener('click', () => {
                console.log('banner图片被点击，索引:', index);
                openBannerLightbox(index);
            });
        } else {
            console.log('未找到banner图片，索引:', index);
        }
        
        // 为蒙层添加点击事件
        const caption = item.querySelector('.carousel-caption-bg');
        if (caption) {
            console.log('找到banner蒙层，索引:', index);
            // 先移除可能存在的旧事件监听器
            caption.onclick = null;
            // 添加新的点击事件监听器
            caption.addEventListener('click', () => {
                console.log('banner蒙层被点击，索引:', index);
                openBannerLightbox(index);
            });
        } else {
            console.log('未找到banner蒙层，索引:', index);
        }
    });
    
    function updateCarousel() {
        const state = carousel._carouselState;
        if (!state) return;
        
        // 更新轮播位置
        state.inner.style.transform = `translateX(-${state.currentIndex * 100}%)`;
        
        // 更新指示器状态
        if (state.indicators.length) {
            state.indicators.forEach((indicator, index) => {
                if (index === state.currentIndex) {
                    indicator.classList.add('active');
                    indicator.style.backgroundColor = 'white';
                } else {
                    indicator.classList.remove('active');
                    indicator.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                }
            });
        }
    }
    
    function startAutoPlay() {
        // 确保只启动一个定时器
        if (carousel._interval) {
            clearInterval(carousel._interval);
        }
        
        carousel._interval = setInterval(() => {
            const state = carousel._carouselState;
            if (!state) return;
            
            state.currentIndex = (state.currentIndex + 1) % state.items.length;
            updateCarousel();
        }, UI_CONFIG.CAROUSEL.BANNER_AUTOPLAY_INTERVAL); // 使用配置的自动播放间隔
    }
    
    function stopAutoPlay() {
        if (carousel._interval) {
            clearInterval(carousel._interval);
            carousel._interval = null;
        }
    }
    
    function restartAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
    }
    
    // 事件处理函数
    function handleMouseEnter() {
        stopAutoPlay();
    }
    
    function handleMouseLeave() {
        startAutoPlay();
    }
    
    function handlePrevClick() {
        const state = carousel._carouselState;
        if (!state) return;
        
        state.currentIndex = (state.currentIndex - 1 + state.items.length) % state.items.length;
        updateCarousel();
        restartAutoPlay();
    }
    
    function handleNextClick() {
        const state = carousel._carouselState;
        if (!state) return;
        
        state.currentIndex = (state.currentIndex + 1) % state.items.length;
        updateCarousel();
        restartAutoPlay();
    }
    
    function handleIndicatorClick(index) {
        const state = carousel._carouselState;
        if (!state) return;
        
        state.currentIndex = index;
        updateCarousel();
        restartAutoPlay();
    }
}

/**
 * 初始化相册封面轮播
 */
export function initAlbumCarousels() {
    const carousels = document.querySelectorAll('.album-carousel');
    
    carousels.forEach(carousel => {
        const inner = carousel.querySelector('.carousel-inner');
        const items = carousel.querySelectorAll('.carousel-item');
        const indicators = carousel.querySelectorAll('.carousel-indicator');
        
        if (!inner || !items.length || items.length === 1) return;
        
        let currentIndex = 0;
        let interval;
        
        // 设置初始状态
        updateCarousel();
        
        // 自动播放
        startAutoPlay();
        
        // 鼠标悬停时暂停，离开时继续
        carousel.addEventListener('mouseenter', stopAutoPlay);
        carousel.addEventListener('mouseleave', startAutoPlay);
        
        // 点击指示器切换
        if (indicators.length) {
            indicators.forEach((indicator, index) => {
                indicator.addEventListener('click', () => {
                    currentIndex = index;
                    updateCarousel();
                    restartAutoPlay();
                });
            });
        }
        
        function updateCarousel() {
            // 更新轮播位置
            inner.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            // 更新指示器状态
            if (indicators.length) {
                indicators.forEach((indicator, index) => {
                    if (index === currentIndex) {
                        indicator.classList.add('active');
                        indicator.style.backgroundColor = 'white';
                    } else {
                        indicator.classList.remove('active');
                        indicator.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                    }
                });
            }
        }
        
        function startAutoPlay() {
            interval = setInterval(() => {
                currentIndex = (currentIndex + 1) % items.length;
                updateCarousel();
            }, UI_CONFIG.CAROUSEL.ALBUM_AUTOPLAY_INTERVAL); // 使用配置的自动播放间隔
        }
        
        function stopAutoPlay() {
            clearInterval(interval);
        }
        
        function restartAutoPlay() {
            stopAutoPlay();
            startAutoPlay();
        }
    });
}


