/**
 * 个人相册项目 - 主入口文件
 * 版本：2.0.1 (模块化版本)
 * 描述：整合所有功能模块，初始化页面
 */

// 导入所有模块
import { loadSiteInfo, loadTags, loadAlbumDetail, searchMedia, siteData, loadSiteConfig } from './modules/api.js';
import { showLoading, hideLoading, showError, getCurrentPage, updateSiteInfo, getAlbumPassword } from './modules/utils.js';
import { renderBanners, renderAlbums, renderTagCloud, initSearch, generateYearFilter, renderSearchResults } from './modules/ui.js';
import { initCarousel, initAlbumCarousels } from './modules/carousel.js';
import { openBannerLightbox, closeBannerLightbox } from './modules/lightbox.js';

// 暴露全局函数，供HTML调用
window.openBannerLightbox = openBannerLightbox;
window.closeBannerLightbox = closeBannerLightbox;
window.hideError = () => {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.remove();
    }
};

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 根据当前页面类型初始化
    const currentPage = getCurrentPage();
    
    if (currentPage === 'index') {
        initIndexPage();
    } else if (currentPage === 'tags') {
        initTagsPage();
    } else if (currentPage === 'album') {
        initAlbumPage();
    }
});

/**
 * 初始化首页
 */
async function initIndexPage() {
    try {
        // 显示加载状态
        showLoading('加载中...');
        
        // 加载站点信息（包含 Banner 和相册列表）
        await loadSiteInfo();
        
        // 更新页面标题和描述
        updateSiteInfo(siteData);
        
        // 渲染 Banner
        await renderBanners();
        
        // 渲染相册列表
        renderAlbums();
        
        // 生成年份筛选按钮
        generateYearFilter();
        
        // 隐藏加载状态
        hideLoading();
    } catch (error) {
        console.error('初始化首页失败:', error);
        showError('加载失败，请稍后重试');
    }
}

/**
 * 初始化标签页
 */
async function initTagsPage() {
    try {
        // 显示加载状态
        showLoading('加载中...');
        
        // 加载站点配置信息并更新头部
        await loadSiteConfig();

        // 加载标签列表
        await loadTags();
        
        // 渲染标签云
        renderTagCloud();
        
        // 初始化搜索功能
        initSearch();
        
        // 隐藏加载状态
        hideLoading();
    } catch (error) {
        console.error('初始化标签页失败:', error);
        showError('加载失败，请稍后重试');
    }
}

/**
 * 初始化相册详情页
 */
async function initAlbumPage() {
    try {
        // 显示加载状态
        showLoading('加载中...');
        
        // 加载站点配置信息
        await loadSiteConfig();
        
        // 从 URL 获取相册 ID
        const urlParams = new URLSearchParams(window.location.search);
        const albumId = urlParams.get('id');
        
        if (!albumId) {
            console.error('缺少相册 ID');
            // 显示无法关闭的提醒弹窗，引导用户回首页
            const alertContainer = document.createElement('div');
            alertContainer.id = 'non-closable-alert';
            alertContainer.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50';
            
            // 创建弹窗内容
            alertContainer.innerHTML = `
                <div class="bg-white rounded-lg p-6 shadow-2xl max-w-md w-full">
                    <div class="flex flex-col items-center">
                        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-2">提示</h3>
                        <p class="text-gray-600 text-center mb-6">相册不存在</p>
                        <a href="index.html" class="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                            返回首页
                        </a>
                    </div>
                </div>
            `;
            
            document.body.appendChild(alertContainer);
            hideLoading();
            return;
        }
        
        // 检查是否有缓存的密码
        const cachedPassword = getAlbumPassword(albumId);
        
        // 加载相册详情
        await loadAlbumDetail(albumId, cachedPassword);
        
        // 隐藏加载状态
        hideLoading();
    } catch (error) {
        console.error('初始化相册详情页失败:', error);
        showError('加载失败，请稍后重试');
    }
}
