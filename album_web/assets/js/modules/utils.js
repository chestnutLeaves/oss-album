/**
 * 工具函数和全局变量模块
 * 包含加载状态管理、错误处理、密码缓存等通用功能
 */

// 导入配置文件
import { UI_CONFIG, CACHE_CONFIG, SITE_CONFIG } from '../config.js';

// 加载状态管理
export function showLoading(message = '加载中...') {
    // 移除已存在的加载状态
    hideLoading();
    
    // 创建加载容器
    const loadingContainer = document.createElement('div');
    loadingContainer.id = 'loading-container';
    loadingContainer.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
    
    // 创建加载内容
    loadingContainer.innerHTML = `
        <div class="bg-white rounded-lg p-6 shadow-2xl flex flex-col items-center">
            <div class="spinner border-4 border-gray-200 border-t-blue-500 rounded-full w-12 h-12 animate-spin mb-4"></div>
            <p class="text-gray-700 font-medium">${message}</p>
        </div>
    `;
    
    document.body.appendChild(loadingContainer);
}

export function hideLoading() {
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) {
        loadingContainer.remove();
    }
    
    // 显示相册内容
    const albumHeader = document.querySelector('.album-header');
    const mainContent = document.querySelector('main.container');
    if (albumHeader) {
        albumHeader.style.display = '';
    }
    if (mainContent) {
        mainContent.style.display = '';
    }
}

export function showError(message = '操作失败') {
    // 移除已存在的错误提示
    hideError();
    
    // 创建错误容器
    const errorContainer = document.createElement('div');
    errorContainer.id = 'error-container';
    errorContainer.style.cssText = `
        position: fixed;
        top: 20px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        z-index: 1001;
        pointer-events: none;
        animation: slideDown 0.3s ease-out;
    `;
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // 创建错误内容
    errorContainer.innerHTML = `
        <div style="
            background: #ef4444;
            color: white;
            padding: 14px 28px;
            border-radius: 8px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 80%;
            text-align: center;
            pointer-events: auto;
            font-size: 16px;
            font-weight: 500;
        ">
            <i class="fas fa-exclamation-circle text-xl"></i>
            <span>${message}</span>
            <button style="
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                margin-left: 12px;
                padding: 4px;
                border-radius: 50%;
                transition: background-color 0.2s;
            " onclick="hideError()" onmouseover="this.style.backgroundColor='rgba(255,255,255,0.2)'" onmouseout="this.style.backgroundColor='transparent'">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(errorContainer);
    
    // 根据配置自动隐藏错误提示
    setTimeout(hideError, UI_CONFIG.FEEDBACK.ERROR_AUTO_HIDE_DELAY);
}

export function hideError() {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.remove();
    }
}

// 相册密码缓存管理
export function saveAlbumPassword(albumId, password) {
    try {
        const passwords = JSON.parse(localStorage.getItem(CACHE_CONFIG.PASSWORD_STORAGE_KEY) || '{}');
        passwords[albumId] = {
            password: password,
            expires: Date.now() + CACHE_CONFIG.PASSWORD_EXPIRES // 使用配置的过期时间
        };
        localStorage.setItem(CACHE_CONFIG.PASSWORD_STORAGE_KEY, JSON.stringify(passwords));
    } catch (error) {
        console.error('保存相册密码失败:', error);
    }
}

export function getAlbumPassword(albumId) {
    try {
        const passwords = JSON.parse(localStorage.getItem(CACHE_CONFIG.PASSWORD_STORAGE_KEY) || '{}');
        const albumData = passwords[albumId];
        
        if (!albumData) {
            return null;
        }
        
        // 检查密码是否过期
        if (Date.now() > albumData.expires) {
            // 密码已过期，删除并返回null
            delete passwords[albumId];
            localStorage.setItem(CACHE_CONFIG.PASSWORD_STORAGE_KEY, JSON.stringify(passwords));
            return null;
        }
        
        return albumData.password;
    } catch (error) {
        console.error('获取相册密码失败:', error);
        return null;
    }
}

export function removeAlbumPassword(albumId) {
    try {
        const passwords = JSON.parse(localStorage.getItem(CACHE_CONFIG.PASSWORD_STORAGE_KEY) || '{}');
        delete passwords[albumId];
        localStorage.setItem(CACHE_CONFIG.PASSWORD_STORAGE_KEY, JSON.stringify(passwords));
    } catch (error) {
        console.error('删除相册密码失败:', error);
    }
}

/**
 * 获取当前页面类型
 */
export function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('index.html') || path.endsWith('/') || path === '') {
        return 'index';
    } else if (path.includes('tags.html')) {
        return 'tags';
    } else if (path.includes('album.html')) {
        return 'album';
    }
    return 'index';
}

/**
 * 更新页面站点信息
 */
export function updateSiteInfo(siteData) {
    if (siteData.site) {
        // 更新页面标题（使用配置的标题后缀）
        if (siteData.site.title) {
            document.title = siteData.site.title + SITE_CONFIG.TITLE_SUFFIX;
        }
        
        // 更新页面描述（如果存在）
        const descriptionMeta = document.querySelector('meta[name="description"]');
        if (descriptionMeta && siteData.site.description) {
            descriptionMeta.setAttribute('content', siteData.site.description);
        }
        
        // 更新品牌标题
        const brandTitle = document.querySelector('.brand-title');
        if (brandTitle && siteData.site.title) {
            brandTitle.textContent = siteData.site.title;
        }
        
        // 更新品牌描述
        const brandDesc = document.querySelector('.brand-text p');
        if (brandDesc) {
            if (siteData.site.description) {
                brandDesc.textContent = siteData.site.description;
            } else {
                // 使用配置的默认描述作为兜底
                brandDesc.textContent = SITE_CONFIG.DEFAULT_DESCRIPTION;
            }
        }
    }
}
