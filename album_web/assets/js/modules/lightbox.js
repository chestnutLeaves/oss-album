/**
 * 灯箱相关功能模块
 * 负责实现图片大图查看功能
 */

import { siteData } from './api.js';

/**
 * 打开banner大图查看
 */
export function openBannerLightbox(index) {
    console.log('openBannerLightbox被调用，索引:', index);
    // 检查siteData和banners是否存在
    if (!siteData) {
        console.error('siteData不存在');
        return;
    }
    if (!siteData.banners) {
        console.error('siteData.banners不存在');
        return;
    }
    if (siteData.banners.length === 0) {
        console.error('banner数据为空');
        return;
    }
    console.log('banner数据:', siteData.banners);

    // 创建lightbox元素
    const lightbox = document.createElement('div');
    lightbox.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50';
    lightbox.id = 'banner-lightbox';

    // 构建lightbox内容
    const banners = siteData.banners;
    const currentBanner = banners[index];

    // 检查currentBanner是否存在
    if (!currentBanner) {
        console.error('当前banner不存在，索引:', index);
        return;
    }
    if (!currentBanner.imageUrl) {
        console.error('当前banner没有imageUrl');
        return;
    }
    console.log('当前banner:', currentBanner);

    const imageUrl = currentBanner.imageUrl.replace(/[`']/g, '');
    console.log('处理后的imageUrl:', imageUrl);

    lightbox.innerHTML = `
        <div class="relative w-full max-h-[90vh] px-4 flex items-center justify-center">
            <button class="fixed top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all z-50" onclick="closeBannerLightbox()">
                <i class="fas fa-times text-xl"></i>
            </button>
            <div class="relative flex items-center justify-center">
                <img src="${imageUrl}" alt="${currentBanner.title}" class="lightbox-image max-w-[95vw] max-h-[90vh] object-contain rounded-lg">
            </div>
        </div>
    `;

    // 添加到页面
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';

    // 点击背景关闭
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeBannerLightbox();
        }
    });

    // 按ESC键关闭
    function handleEscKey(e) {
        if (e.key === 'Escape') {
            closeBannerLightbox();
        }
    }

    document.addEventListener('keydown', handleEscKey);

    // 为图片添加鼠标滚轮缩放功能和拖拽功能
    // 为图片添加鼠标滚轮缩放功能和拖拽功能
    const lightboxImg = lightbox.querySelector('.lightbox-image');
    if (lightboxImg) {
        console.log('找到lightbox-image元素，添加鼠标滚轮缩放和拖拽功能');

        let scale = 1;
        const scaleStep = 0.1;
        const maxScale = 3;
        const minScale = 0.5;

        // 拖拽相关变量
        let isDragging = false;
        let startX, startY;
        let translateX = 0;
        let translateY = 0;

        // --- 核心修复：定义全局处理函数，确保 removeEventListener 能正确匹配 ---

        const handleMouseMove = (e) => {
            if (!isDragging) return;
            e.preventDefault(); // 防止选中文字等默认行为

            translateX = e.clientX - startX;
            translateY = e.clientY - startY;

            // 更新变换：先位移后缩放，避免位移距离被缩放倍数放大
            lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        };

        const handleMouseUp = () => {
            if (!isDragging) return;

            isDragging = false;
            lightboxImg.style.cursor = 'grab';

            // 立即移除监听器，防止内存泄漏或状态错乱
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mouseleave', handleMouseLeaveGlobal);
        };

        const handleMouseLeaveGlobal = () => {
            // 如果鼠标直接离开了文档区域（例如拖拽出浏览器窗口），也视为释放
            if (isDragging) {
                handleMouseUp();
            }
        };

        // --- 初始化样式 ---
        lightboxImg.style.pointerEvents = 'auto';
        lightboxImg.style.cursor = 'grab';
        // 禁止浏览器原生的拖拽行为（解决红色禁止符和幽灵图问题）
        lightboxImg.addEventListener('dragstart', (e) => e.preventDefault());

        // 鼠标滚轮缩放功能
        lightboxImg.addEventListener('wheel', (e) => {
            e.preventDefault();

            if (e.deltaY < 0) {
                scale = Math.min(scale + scaleStep, maxScale);
            } else {
                scale = Math.max(scale - scaleStep, minScale);
            }

            // 缩放时保持当前的位移
            lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        }, { passive: false });

        // 鼠标按下事件 - 开始拖拽
        lightboxImg.addEventListener('mousedown', (e) => {
            // 只响应左键
            if (e.button !== 0) return;

            e.preventDefault(); // 【关键】阻止浏览器默认拖拽行为，消除红色禁止符

            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;

            lightboxImg.style.cursor = 'grabbing';

            // 绑定到 document，确保鼠标移出图片范围也能继续拖拽
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            // 额外监听：防止鼠标拖拽出浏览器窗口后无法释放
            document.addEventListener('mouseleave', handleMouseLeaveGlobal);
        });

        // 注意：不再需要单独给 lightboxImg 绑定 mouseleave 来停止拖拽，
        // 因为只要鼠标还在 document 上移动，拖拽就应该继续。
        // 只有当鼠标完全离开浏览器窗口或松开时才停止。
    } else {
        console.error('未找到lightbox-image元素');
    }

    // 存储事件监听器的引用，以便在关闭时移除
    lightbox._escHandler = handleEscKey;
}

/**
 * 关闭banner大图查看
 */
export function closeBannerLightbox() {
    const lightbox = document.getElementById('banner-lightbox');
    if (lightbox) {
        // 移除ESC键事件监听器
        if (lightbox._escHandler) {
            document.removeEventListener('keydown', lightbox._escHandler);
        }
        lightbox.remove();
        document.body.style.overflow = '';
    }
}
