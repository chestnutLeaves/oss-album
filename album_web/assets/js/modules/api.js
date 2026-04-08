/**
 * API 相关功能模块
 * 负责处理与服务端的所有通信
 */

// 导入依赖函数
import { showLoading, hideLoading, showError } from './utils.js';
import { renderAlbumDetail } from './ui.js';
import { saveAlbumPassword } from './utils.js';

// 导入配置文件
import { API_CONFIG, ERROR_PAGES } from '../config.js';

// API 基础地址（从配置文件导入）
export const API_BASE_URL = API_CONFIG.BASE_URL;

// 全局数据存储
export let siteData = {
    site: {},
    banners: [],
    albums: []
};
export let tagsData = [];
export let currentMediaList = [];

/**
 * 获取站点配置信息
 */
export async function loadSiteConfig() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/open/site/config`, {
            method: 'GET',
            headers: {
                'Referer': window.location.href
            }
        });

        console.log('Response status:', response.status);

        // 检查响应是否成功
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 先获取响应文本，以便在JSON解析失败时查看
        const responseText = await response.text();
        console.log('Response text:', responseText);

        // 尝试解析JSON
        let result;
        try {
            result = JSON.parse(responseText);
            console.log('Parsed result:', result);
        } catch (jsonError) {
            console.error('JSON parse error:', jsonError);
            console.error('Response text causing error:', responseText);
            // JSON解析失败，显示错误
            showError('数据解析失败，请稍后重试');
            return null;
        }

        if (result.code === 0) {
            const config = result.data;

            // 更新页面标题
            if (config.title) {
                document.title = config.title + ' - 个人相册';
            }

            // 更新品牌标题和描述
            const brandTitle = document.querySelector('.brand-title');
            const brandSubtitle = document.querySelector('.brand-text p');

            if (brandTitle && config.title) {
                brandTitle.textContent = config.title;
            }

            if (brandSubtitle && config.description) {
                brandSubtitle.textContent = config.description;
            }

            // 更新管理按钮链接
            if (config.adminUrl) {
                const adminButtons = document.querySelectorAll('.nav-item i.fa-cog, .nav-item i.fas.fa-cog, .nav-item svg.fa-gear, .nav-item svg.fas.fa-gear');
                adminButtons.forEach(icon => {
                    const button = icon.closest('.nav-item');
                    if (button) {
                        button.href = config.adminUrl;
                        button.target = '_blank';
                        button.rel = 'noopener noreferrer';
                    }
                });
            }

            return config;
        } else if (result.code === 3001) {  // 站点不存在
            console.error('站点不存在:', result.message || result.msg);
            // 跳转到站点不存在错误页（使用配置文件）
            window.location.href = ERROR_PAGES.SITE_NOT_FOUND;
            return null;
        } else {
            console.error('获取站点配置失败:', result.message || result.msg);
            // 显示错误信息
            showError(result.message || result.msg || '获取站点配置失败');
            return null;
        }
    } catch (error) {
        console.error('获取站点配置错误:', error);
        // 网络错误，跳转到错误页（使用配置文件）
        window.location.href = ERROR_PAGES.NETWORK_ERROR;
        return null;
    }
}

/**
 * 获取站点信息
 */
export async function loadSiteInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/open/site/info`, {
            method: 'GET',
            headers: {
                'Referer': window.location.href
            }
        });

        console.log('Response status:', response.status);

        // 检查响应是否成功
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 先获取响应文本，以便在JSON解析失败时查看
        const responseText = await response.text();
        console.log('Response text:', responseText);

        // 尝试解析JSON
        let result;
        try {
            result = JSON.parse(responseText);
            console.log('Parsed result:', result);
        } catch (jsonError) {
            console.error('JSON parse error:', jsonError);
            console.error('Response text causing error:', responseText);
            // JSON解析失败，显示错误
            showError('数据解析失败，请稍后重试');
            return;
        }

        if (result.code === 0) {  // 新的成功响应码
            const data = result.data;

            // 检查数据结构，适配不同的返回格式
            if (data.site) {
                // 标准格式：data.site包含站点信息
                siteData = data;
            } else {
                // 简化格式：data直接包含站点信息
                siteData = {
                    site: {
                        title: data.title || '',
                        description: data.description || ''
                    },
                    banners: data.banners || [],
                    albums: data.albums || []
                };
            }

            // 更新管理按钮链接
            const adminUrl = data.adminUrl || (siteData.site && siteData.site.adminUrl);
            if (adminUrl) {
                const adminIcons = document.querySelectorAll('.nav-item i.fa-cog, .nav-item i.fas.fa-cog, .nav-item svg.fa-gear, .nav-item svg.fas.fa-gear');
                adminIcons.forEach(icon => {
                    const button = icon.closest('.nav-item');
                    if (button) {
                        button.href = adminUrl;
                        button.target = '_blank';
                        button.rel = 'noopener noreferrer';
                    }
                });
            }

            // 为每个相册添加id属性（如果不存在）
            if (siteData.albums && Array.isArray(siteData.albums)) {
                siteData.albums.forEach((album, index) => {
                    if (!album.id) {
                        // 使用索引作为id，或者使用其他唯一标识
                        album.id = index + 1;
                    }
                });
            }

            // 更新页面标题
            if (siteData.site.title) {
                document.title = siteData.site.title + ' - 个人相册';
            }
        } else if (result.code === 3001) {  // 站点不存在
            console.error('站点不存在:', result.message || result.msg);
            // 跳转到站点不存在错误页（使用配置文件）
            window.location.href = ERROR_PAGES.SITE_NOT_FOUND;
        } else {
            console.error('获取站点信息失败:', result.message || result.msg);
            // 显示错误信息
            showError(result.message || result.msg || '获取站点信息失败');
        }
    } catch (error) {
        console.error('获取站点信息错误:', error);
        // 网络错误，跳转到错误页（使用配置文件）
        window.location.href = ERROR_PAGES.NETWORK_ERROR;
    }
}

/**
 * 获取标签列表
 */
export async function loadTags() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/open/tags`, {
            method: 'GET',
            headers: {
                'Referer': window.location.href
            }
        });

        const result = await response.json();

        if (result.code === 0) {
            tagsData = result.data;
        } else {
            console.error('获取标签列表失败:', result.message || result.msg);
            showError(result.message || result.msg || '获取标签列表失败');
        }
    } catch (error) {
        console.error('获取标签列表错误:', error);
        showError('网络错误，请稍后重试');
    }
}

/**
 * 搜索媒体资源（支持关键词和标签组合搜索）
 */
export async function searchMedia(keyword = '', tagIds = []) {
    try {
        showLoading('搜索中...');

        const params = new URLSearchParams();

        if (keyword) {
            params.append('keyword', keyword);
        }

        if (tagIds && tagIds.length > 0) {
            tagIds.forEach(id => params.append('tagIds', id));
        }

        const queryString = params.toString();
        const url = queryString
            ? `${API_BASE_URL}/api/open/search/media?${queryString}`
            : `${API_BASE_URL}/api/open/search/media`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Referer': window.location.href
            }
        });

        const result = await response.json();

        if (result.code === 0) {
            currentMediaList = result.data;
            return currentMediaList;
        } else {
            console.error('搜索媒体失败:', result.message || result.msg);
            showError(result.message || result.msg || '搜索失败');
            return [];
        }
    } catch (error) {
        console.error('搜索媒体错误:', error);
        showError('搜索失败，请检查网络');
        return [];
    } finally {
        hideLoading();
    }
}

/**
 * 显示无法关闭的提醒弹窗
 */
function showNonClosableAlert(message) {
    // 移除已存在的弹窗
    const existingAlert = document.getElementById('non-closable-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // 创建弹窗容器
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
                <p class="text-gray-600 text-center mb-6">${message}</p>
                <a href="index.html" class="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                    返回首页
                </a>
            </div>
        </div>
    `;

    document.body.appendChild(alertContainer);
}

/**
 * 显示密码输入弹窗
 */
function showPasswordModal(albumId, callback) {
    // 移除已存在的弹窗
    const existingModal = document.getElementById('password-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 创建弹窗容器
    const modalContainer = document.createElement('div');
    modalContainer.id = 'password-modal';
    modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        overflow: hidden;
    `;

    // 阻止背景页面滚动
    document.body.style.overflow = 'hidden';

    // 创建弹窗内容
    modalContainer.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            width: 90%;
        ">
            <div style="display: flex; flex-direction: column;">
                <div style="
                    width: 64px;
                    height: 64px;
                    background: #e6f0ff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 16px;
                    align-self: center;
                ">
                    <i class="fas fa-lock" style="color: #3b82f6; font-size: 24px;"></i>
                </div>
                <h3 style="
                    font-size: 20px;
                    font-weight: bold;
                    margin-bottom: 16px;
                    text-align: center;
                ">输入相册密码</h3>
                <div style="margin-bottom: 16px;">
                    <input type="password" id="password-input" placeholder="请输入密码" style="
                        width: 100%;
                        padding: 10px 16px;
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        font-size: 16px;
                    ">
                </div>
                <div style="display: flex; gap: 12px;">
                    <a href="index.html" id="home-btn" style="
                        flex: 1;
                        padding: 10px;
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 500;
                        background: white;
                        cursor: pointer;
                        text-align: center;
                        text-decoration: none;
                        color: #374151;
                    ">
                        回首页
                    </a>
                    <button id="confirm-btn" style="
                        flex: 1;
                        padding: 10px;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 500;
                        background: #3b82f6;
                        color: white;
                        cursor: pointer;
                    ">
                        确认
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modalContainer);

    // 绑定事件
    const passwordInput = document.getElementById('password-input');
    const confirmBtn = document.getElementById('confirm-btn');

    // 确认按钮
    confirmBtn.addEventListener('click', () => {
        const password = passwordInput.value.trim();
        if (password) {
            // 不立即关闭弹窗，等待验证结果
            // 显示加载状态
            confirmBtn.disabled = true;
            confirmBtn.textContent = '验证中...';

            // 调用回调，传入密码和关闭弹窗的函数
            callback(password, () => {
                modalContainer.remove();
                // 恢复背景页面滚动
                document.body.style.overflow = '';
            });
        } else {
            showError('请输入密码');
        }
    });

    // 按Enter键确认
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmBtn.click();
        }
    });

    // 自动聚焦到密码输入框
    passwordInput.focus();
}

/**
 * 获取相册详情
 */
export async function loadAlbumDetail(albumId, password = null) {
    try {
        // 构建请求 URL
        const params = new URLSearchParams({ id: albumId });
        if (password) {
            params.append('password', password);
        }

        const response = await fetch(`${API_BASE_URL}/api/open/albums/detail?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Referer': window.location.href
            }
        });

        const result = await response.json();

        if (result.code === 0) {
            const albumData = result.data;

            // 缓存密码（如果提供了密码）
            if (password) {
                saveAlbumPassword(albumId, password);
            }

            // 更新页面标题
            document.title = albumData.title + ' - 个人相册';

            // 渲染标签筛选器
            if (albumData.tags && albumData.tags.length > 0) {
                const filterContainer = document.getElementById('filterContainer');
                if (filterContainer) {
                    // 清空现有内容
                    filterContainer.innerHTML = '';

                    // 添加全部按钮
                    const allButton = document.createElement('button');
                    allButton.className = 'filter-btn active';
                    allButton.setAttribute('data-filter', '全部');
                    allButton.textContent = '全部';
                    filterContainer.appendChild(allButton);

                    // 添加标签按钮
                    albumData.tags.forEach(tag => {
                        const button = document.createElement('button');
                        button.className = 'filter-btn';
                        button.setAttribute('data-filter', tag.name);
                        button.textContent = `${tag.name} (${tag.mediaCount})`;
                        // 随机颜色
                        const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-yellow-100 text-yellow-800', 'bg-purple-100 text-purple-800', 'bg-pink-100 text-pink-800', 'bg-orange-100 text-orange-800'];
                        const randomColor = colors[Math.floor(Math.random() * colors.length)];
                        button.classList.add(...randomColor.split(' '));
                        filterContainer.appendChild(button);
                    });

                    // 保存原始媒体数据
                    const originalMedia = [...albumData.mediaList];

                    // 绑定筛选事件
                    const filterBtns = filterContainer.querySelectorAll('.filter-btn');
                    const selectedFilters = new Set(['全部']);

                    filterBtns.forEach(btn => {
                        btn.addEventListener('click', function() {
                            const filter = this.getAttribute('data-filter');

                            if (filter === '全部') {
                                // 点击全部按钮，清除其他选中状态
                                selectedFilters.clear();
                                selectedFilters.add('全部');
                                filterBtns.forEach(b => {
                                    if (b.getAttribute('data-filter') === '全部') {
                                        b.classList.add('active');
                                    } else {
                                        b.classList.remove('active');
                                    }
                                });
                            } else {
                                // 移除全部按钮的选中状态
                                selectedFilters.delete('全部');
                                filterBtns.forEach(b => {
                                    if (b.getAttribute('data-filter') === '全部') {
                                        b.classList.remove('active');
                                    }
                                });

                                // 切换当前标签的选中状态
                                if (selectedFilters.has(filter)) {
                                    selectedFilters.delete(filter);
                                    this.classList.remove('active');
                                } else {
                                    selectedFilters.add(filter);
                                    this.classList.add('active');
                                }

                                // 如果没有选中任何标签，自动选中全部
                                if (selectedFilters.size === 0) {
                                    selectedFilters.add('全部');
                                    filterBtns.forEach(b => {
                                        if (b.getAttribute('data-filter') === '全部') {
                                            b.classList.add('active');
                                        }
                                    });
                                }
                            }

                            // 实现筛选逻辑
                            let filteredMedia;
                            if (selectedFilters.has('全部') || selectedFilters.size === 0) {
                                // 显示所有媒体
                                filteredMedia = originalMedia;
                            } else {
                                // 筛选出同时包含所有选中标签的媒体
                                filteredMedia = originalMedia.filter(media => {
                                    return media.tags && [...selectedFilters].every(filter => {
                                        return media.tags.some(tag => tag.name === filter);
                                    });
                                });
                            }

                            // 创建筛选后的相册数据，确保保留完整的 tags 数组
                            const filteredAlbumData = {
                                ...albumData,
                                mediaList: filteredMedia,
                                tags: albumData.tags // 确保保留完整的标签列表
                            };

                            // 重新渲染相册详情
                            renderAlbumDetail(filteredAlbumData);
                        });
                    });
                }
            }

            // 渲染相册详情
            renderAlbumDetail(albumData);
        } else if (result.code === 4001) {  // 相册不存在
            console.error('相册不存在:', result.message || result.msg);
            // 显示无法关闭的提醒弹窗
            showNonClosableAlert('相册不存在');
            return;
        } else if (result.code === 4002 || result.code === 4003) {  // 需要密码或密码错误
            console.error('需要密码或密码错误:', result.message || result.msg);

            // 区分首次请求和用户输入后的请求
            // 如果是首次请求（没有提供密码），不显示错误提示
            // 如果是用户输入密码后请求，显示错误提示
            if (password) {
                showError(result.message || result.msg || '密码错误');
            }

            // 显示自定义密码输入弹窗
            return new Promise((resolve) => {
                showPasswordModal(albumId, async (newPassword, closeModal) => {
                    if (newPassword) {
                        try {
                            // 重新请求，不立即缓存密码
                            await loadAlbumDetail(albumId, newPassword);
                            // 只有在请求成功后才缓存密码
                            // 密码验证成功，关闭弹窗
                            if (closeModal) {
                                closeModal();
                            }
                        } catch (error) {
                            console.error('重新请求相册详情失败:', error);
                            // 密码验证失败，保持弹窗打开
                            const confirmBtn = document.getElementById('confirm-btn');
                            if (confirmBtn) {
                                confirmBtn.disabled = false;
                                confirmBtn.textContent = '确认';
                            }
                        }
                    }
                    resolve();
                });
            });
        } else {
            console.error('获取相册详情失败:', result.message || result.msg);
            showError(result.message || result.msg || '获取相册详情失败');
        }
    } catch (error) {
        console.error('获取相册详情错误:', error);
        showError('网络错误，请稍后重试');
    }
}
