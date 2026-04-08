/**
 * UI 相关功能模块
 * 负责所有页面的渲染和交互
 */

import { siteData, tagsData, currentMediaList, searchMedia } from './api.js';
import { getAlbumPassword, saveAlbumPassword } from './utils.js';
import { initCarousel, initAlbumCarousels } from './carousel.js';
import { openBannerLightbox } from './lightbox.js';

// 导入配置文件
import { UI_CONFIG } from '../config.js';

let exploreSelectedTagIds = [];
let exploreSelectedTagNames = [];
let exploreKeyword = '';
let exploreMediaType = 'ALL';
let exploreLastMediaList = [];
let exploreLastTitle = '随便看看';

function shuffleExploreMedia(mediaList) {
    const list = Array.isArray(mediaList) ? [...mediaList] : [];
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

function filterExploreMediaByType(mediaList) {
    if (exploreMediaType === 'PHOTO') return mediaList.filter(media => media && media.type === 'PHOTO');
    if (exploreMediaType === 'VIDEO') return mediaList.filter(media => media && media.type === 'VIDEO');
    return mediaList;
}

function clearExploreResults() {
    const resultsHeader = document.querySelector('.results-header');
    const photoGrid = document.querySelector('.photo-grid');

    if (resultsHeader) {
        resultsHeader.innerHTML = `
            <h2 class="text-xl font-semibold">随便看看</h2>
            <div class="type-filters" style="display:none;"></div>
        `;
    }

    if (photoGrid) {
        photoGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-compass"></i>
                </div>
                <p>点击“随便看看”刷新内容</p>
            </div>
        `;
    }
}

async function loadRandomExplore() {
    exploreMediaType = 'ALL';
    const mediaList = await searchMedia();
    const randomList = shuffleExploreMedia(mediaList).slice(0, 20);
    exploreLastMediaList = randomList;
    renderSearchResults(exploreLastMediaList, '随便看看');
}

async function performExploreSearch() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        exploreKeyword = searchInput.value.trim();
    }

    if (!exploreKeyword && exploreSelectedTagIds.length === 0) {
        exploreLastMediaList = [];
        exploreMediaType = 'ALL';
        renderTagCloud();
        await loadRandomExplore();
        return;
    }

    const mediaList = await searchMedia(exploreKeyword, exploreSelectedTagIds);
    exploreLastMediaList = Array.isArray(mediaList) ? mediaList : [];
    renderSearchResults(exploreLastMediaList, '搜索结果');
}

/**
 * 预加载图片
 */
function preloadImages(imageUrls) {
    return Promise.all(
        imageUrls.map(url => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = url;
                img.onload = resolve;
                img.onerror = resolve; // 即使加载失败也继续
            });
        })
    );
}

/**
 * 渲染 Banner
 */
export async function renderBanners() {
    console.log('renderBanners被调用');
    const carouselInner = document.querySelector('.carousel-inner');
    const indicatorsContainer = document.querySelector('.carousel-indicators');
    
    console.log('carouselInner:', carouselInner);
    console.log('siteData.banners:', siteData.banners);
    
    if (!carouselInner) {
        console.error('carouselInner不存在');
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
    console.log('banner数据长度:', siteData.banners.length);
    
    // 提取所有banner图片URL并预加载
    const imageUrls = siteData.banners.map(banner => banner.imageUrl.replace(/[`']/g, ''));
    console.log('开始预加载图片:', imageUrls);
    
    try {
        await preloadImages(imageUrls);
        console.log('图片预加载完成');
    } catch (error) {
        console.error('图片预加载失败:', error);
    }
    
    // 清空现有内容
    carouselInner.innerHTML = '';
    if (indicatorsContainer) {
        indicatorsContainer.innerHTML = '';
    }
    
    // 生成 Banner HTML
    siteData.banners.forEach((banner, index) => {
        const imageUrl = banner.imageUrl.replace(/[`']/g, ''); // 移除可能的引号
        const bannerHtml = `
            <div class="carousel-item min-w-full relative">
                <img src="${imageUrl}" alt="${banner.title}" class="carousel-img w-full h-[450px] md:h-[550px] object-cover cursor-pointer transition-transform duration-300 hover:scale-105">
                <div class="carousel-caption-bg absolute flex items-end justify-start pb-16 px-12">
                    <div class="text-left text-white max-w-2xl">
                        <h3 class="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg tracking-tight">${banner.title}</h3>
                        <p class="text-xl opacity-95 drop-shadow-md font-light">${banner.description || ''}</p>
                    </div>
                </div>
            </div>
        `;
        carouselInner.insertAdjacentHTML('beforeend', bannerHtml);
        
        // 生成指示器
        if (indicatorsContainer) {
            const indicatorHtml = `
                <button class="carousel-indicator w-3 h-3 rounded-full ${index === 0 ? 'active' : 'bg-white/50 hover:bg-white/75'} transition-all shadow-md" data-index="${index}"></button>
            `;
            indicatorsContainer.insertAdjacentHTML('beforeend', indicatorHtml);
        }
    });
    
    // 重新初始化轮播图逻辑
    initCarousel();
}

/**
 * 渲染相册列表
 */
export function renderAlbums() {
    const albumsContainer = document.querySelector('.albums-container');
    
    if (!albumsContainer || !siteData.albums || siteData.albums.length === 0) {
        return;
    }
    
    // 清空现有内容
    albumsContainer.innerHTML = '';
    
    // 按 sortOrder 排序相册
    const sortedAlbums = siteData.albums.sort((a, b) => a.sortOrder - b.sortOrder);
    
    // 创建单个相册容器，实现连续排列
    const albumsGrid = document.createElement('div');
    albumsGrid.className = 'albums-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8 w-full';
    
    sortedAlbums.forEach(album => {
        const albumHtml = `
            <div class="album-card-modern bg-white interactive" data-album-id="${album.id}" data-need-password="${album.needPassword}" data-year="${album.year}">
                <div class="album relative aspect-video overflow-hidden">
                    <div class="absolute top-3 left-3 z-10">
                        <div class="year-badge px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 shadow-md">
                            ${album.year}年
                        </div>
                    </div>
                    <div class="absolute top-3 right-3 z-10">
                        <div class="lock-icon w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                            <i class="fas fa-${album.needPassword ? 'lock' : 'unlock'} text-gray-700"></i>
                        </div>
                    </div>
                    ${album.coverImages && album.coverImages.length > 0 ? `
                    <div class="album-carousel relative w-full h-full">
                        <div class="carousel-inner flex transition-transform duration-500">
                            ${album.coverImages.map(img => {
                                const imageUrl = img.replace(/[`']/g, '');
                                return `
                                <div class="carousel-item min-w-full">
                                    <img src="${imageUrl}" alt="${album.title}" class="photo-img w-full h-full object-cover">
                                </div>
                                `;
                            }).join('')}
                        </div>
                        ${album.coverImages.length > 1 ? `
                        <div class="carousel-indicators absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                            ${album.coverImages.map((_, index) => `
                            <button class="carousel-indicator w-2 h-2 rounded-full ${index === 0 ? 'bg-white' : 'bg-white/50'}"></button>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                    ` : `
                    <img src="https://via.placeholder.com/400x300?text=No+Cover" alt="${album.title}" class="photo-img w-full h-full object-cover">
                    `}
                </div>
                <div class="p-4">
                    <h3 class="album-title mb-2">${album.title}</h3>
                    <div class="album-desc-container mb-3">
                        <p class="album-desc line-clamp-2">${album.description || ''}</p>
                    </div>
                    <button class="view-album-btn w-full text-center">
                        查看相册
                    </button>
                </div>
            </div>
        `;
        albumsGrid.insertAdjacentHTML('beforeend', albumHtml);
    });
    
    albumsContainer.appendChild(albumsGrid);
    
    // 绑定相册点击事件
    document.querySelectorAll('.album-card-modern').forEach(card => {
        card.addEventListener('click', () => {
            const albumId = card.getAttribute('data-album-id');
            // 直接跳转，不在首页输入密码
            window.location.href = `album.html?id=${albumId}`;
        });
    });
    
    // 初始化相册封面轮播
    initAlbumCarousels();
}

/**
 * 渲染标签云
 */
export function renderTagCloud() {
    const tagCloud = document.querySelector('.tag-cloud');
    
    if (!tagCloud || !tagsData || tagsData.length === 0) {
        return;
    }
    
    // 清空现有内容
    tagCloud.innerHTML = '';
    
    // 生成标签
    tagsData.forEach((tag, index) => {
        const colorIndex = (index % 15) + 1;
        const isActive = exploreSelectedTagIds.includes(String(tag.id));
        const tagHtml = `
            <span class="tag-item color-${colorIndex}${isActive ? ' active' : ''}" data-tag-id="${tag.id}" data-tag-name="${tag.name}">
                ${tag.name}
            </span>
        `;
        tagCloud.insertAdjacentHTML('beforeend', tagHtml);
    });
    
    // 绑定点击事件
    document.querySelectorAll('.tag-item').forEach(tag => {
        tag.addEventListener('click', async () => {
            const tagId = tag.getAttribute('data-tag-id');
            const tagName = tag.getAttribute('data-tag-name');

            const index = exploreSelectedTagIds.indexOf(tagId);
            if (index >= 0) {
                exploreSelectedTagIds.splice(index, 1);
                exploreSelectedTagNames.splice(index, 1);
                tag.classList.remove('active');
            } else {
                exploreSelectedTagIds.push(tagId);
                exploreSelectedTagNames.push(tagName);
                tag.classList.add('active');
            }

            await performExploreSearch();
        });
    });
}

/**
 * 初始化搜索功能
 */
export function initSearch() {
    const searchInput = document.querySelector('.search-input');
    
    if (!searchInput) {
        return;
    }
    
    let debounceTimer;
    loadRandomExplore();
    
    searchInput.addEventListener('input', async (e) => {
        const keyword = e.target.value.trim();
        exploreKeyword = keyword;
        
        clearTimeout(debounceTimer);
        
        debounceTimer = setTimeout(async () => {
            await performExploreSearch();
        }, UI_CONFIG.SEARCH.DEBOUNCE_DELAY); // 使用配置的防抖延迟
    });
}

/**
 * 渲染搜索结果
 */
export function renderSearchResults(mediaList, title) {
    let resultsHeader = document.querySelector('.results-header');
    let photoGrid = document.querySelector('.photo-grid');
    
    // 创建或更新搜索结果标题
    if (!resultsHeader) {
        resultsHeader = document.createElement('div');
        resultsHeader.className = 'results-header';
        document.querySelector('.tag-cloud')?.insertAdjacentElement('afterend', resultsHeader);
    }

    const totalCount = mediaList.length;
    const videoCount = mediaList.filter(media => media && media.type === 'VIDEO').length;
    const photoCount = totalCount - videoCount;
    const filteredList = filterExploreMediaByType(mediaList);
    exploreLastTitle = title;
    const titleText = title === '随便看看' ? title : `${title}（共${totalCount}项）`;
    
    resultsHeader.innerHTML = `
        <div class="results-header-left">
            <h2 class="text-xl font-semibold">${titleText}</h2>
        </div>
        <div class="results-header-actions">
            <div class="type-filters">
                <button class="type-filter-btn${exploreMediaType === 'ALL' ? ' active' : ''}" data-media-type="ALL">全部 (${totalCount})</button>
                <button class="type-filter-btn${exploreMediaType === 'PHOTO' ? ' active' : ''}" data-media-type="PHOTO">照片 (${photoCount})</button>
                <button class="type-filter-btn${exploreMediaType === 'VIDEO' ? ' active' : ''}" data-media-type="VIDEO">视频 (${videoCount})</button>
            </div>
            <button class="btn-reset" data-action="reset">重置</button>
        </div>
    `;

    resultsHeader.querySelectorAll('.type-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-media-type');
            exploreMediaType = type || 'ALL';
            renderSearchResults(exploreLastMediaList, exploreLastTitle);
        });
    });

    const titleEl = resultsHeader.querySelector('h2');
    if (titleEl && title === '随便看看') {
        titleEl.style.cursor = 'pointer';
        titleEl.setAttribute('title', '换一批');
        titleEl.addEventListener('click', () => {
            loadRandomExplore();
        });
    } else if (titleEl) {
        titleEl.removeAttribute('title');
    }

    const resetBtn = resultsHeader.querySelector('[data-action="reset"]');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            exploreSelectedTagIds = [];
            exploreSelectedTagNames = [];
            exploreKeyword = '';
            exploreMediaType = 'ALL';
            exploreLastMediaList = [];
            exploreLastTitle = '随便看看';

            const searchInput = document.querySelector('.search-input');
            if (searchInput) searchInput.value = '';

            renderTagCloud();
            loadRandomExplore();
        });
    }
    
    // 创建或更新照片网格
    if (!photoGrid) {
        photoGrid = document.createElement('div');
        photoGrid.className = 'photo-grid';
        resultsHeader.insertAdjacentElement('afterend', photoGrid);
    }
    
    photoGrid.innerHTML = '';
    
    if (filteredList.length === 0) {
        photoGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-search"></i>
                </div>
                <p>未找到相关内容</p>
            </div>
        `;
        return;
    }
    
    // 渲染照片卡片
    filteredList.forEach(media => {
        const allTags = Array.isArray(media.tags) ? media.tags : [];
        const maxDisplayTags = UI_CONFIG.TAGS.MAX_DISPLAY_TAGS;
        const displayTags = allTags.slice(0, maxDisplayTags);
        const moreTagsCount = allTags.length > maxDisplayTags ? allTags.length - maxDisplayTags : 0;
        const hasMoreTags = moreTagsCount > 0;

        let tagsHtml = displayTags.map(tag =>
            `<span class="media-tag">${tag.name}</span>`
        ).join('');

        if (hasMoreTags) {
            const remainingTags = allTags.slice(maxDisplayTags);
            const remainingTagsJson = JSON.stringify(remainingTags.map(t => t.name)).replace(/"/g, '&quot;');
            tagsHtml += `<span class="media-tag more-tags" data-tags="${remainingTagsJson}">+${moreTagsCount}</span>`;
        }

        let exifData = null;
        if (media.exifInfo && media.exifInfo !== '{}') {
            try {
                exifData = JSON.parse(media.exifInfo);
            } catch (e) {
                console.warn('解析 EXIF 信息失败:', e);
            }
        }

        let shootDate = '未知';
        let fullShootTime = '';
        if (media.shootTime) {
            const dateMatch = String(media.shootTime).match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
            if (dateMatch) {
                shootDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                fullShootTime = `拍摄日期 ${dateMatch[1]}年${dateMatch[2]}月${dateMatch[3]}日  ${dateMatch[4]}:${dateMatch[5]}:${dateMatch[6]}`;
            }
        } else if (exifData && exifData.shootTime) {
            const dateMatch = String(exifData.shootTime).match(/(\d{4}):(\d{2}):(\d{2})/);
            if (dateMatch) {
                shootDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                fullShootTime = `拍摄日期 ${dateMatch[1]}年${dateMatch[2]}月${dateMatch[3]}日`;
            }
        }

        let exifInfo = '';
        if (exifData) {
            const parts = [];
            if (exifData.camera) parts.push(exifData.camera);
            if (exifData.aperture) parts.push(exifData.aperture);
            if (exifData.shutterSpeed) parts.push(exifData.shutterSpeed);
            exifInfo = parts.join(' | ');
        }

        const description = media.description || media.originalFilename || '';
        const safeDescription = description.replace(/"/g, '&quot;');
        const isVideo = media.type === 'VIDEO';
        const cleanThumbUrl = (media.thumbnailUrl || '').replace(/[`']/g, '').trim();
        
        const cardHtml = `
            <article class="media-card" role="button" tabindex="0" data-media-id="${media.id}">
                <div class="media-card-image-wrapper">
                    <img src="${cleanThumbUrl}" alt="${media.originalFilename || ''}" class="media-card-image" loading="lazy">

                    ${isVideo ? `
                    <div class="media-type-video">
                        <i class="fa fa-video-camera mr-1"></i>视频
                    </div>
                    <div class="video-play-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"></path>
                        </svg>
                    </div>
                    ` : `
                    <div class="media-type-photo">
                        <i class="fa fa-camera mr-1"></i>照片
                    </div>
                    `}
                </div>

                <div class="media-card-info">
                    <div class="media-card-row">
                        <span class="media-date" ${fullShootTime ? `title="${fullShootTime}"` : ''}>${shootDate}</span>
                        ${exifInfo ? `<span class="media-exif">${exifInfo}</span>` : ''}
                    </div>

                    ${description ? `
                    <div class="media-card-row">
                        <p class="media-description" title="${safeDescription}">${description}</p>
                    </div>
                    ` : ''}

                    ${allTags.length > 0 ? `
                    <div class="media-card-row">
                        <div class="media-tags-container">
                            ${tagsHtml}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </article>
        `;
        photoGrid.insertAdjacentHTML('beforeend', cardHtml);
    });

    bindMoreTagsEvents();
    bindPreviewModalEvents(filteredList, '.media-card');
}

/**
 * 生成年份筛选按钮
 */
export function generateYearFilter() {
    const yearTabsContainer = document.querySelector('.year-tabs');
    if (!yearTabsContainer) return;
    
    // 清空现有按钮
    yearTabsContainer.innerHTML = '';
    
    // 从相册数据中提取年份并计数
    const yearCounts = {};
    siteData.albums.forEach(album => {
        if (!yearCounts[album.year]) {
            yearCounts[album.year] = 0;
        }
        yearCounts[album.year]++;
    });
    
    // 转换为数组并按年份降序排序
    const years = Object.keys(yearCounts).sort((a, b) => b - a);
    
    // 添加"全部"按钮
    const allButton = document.createElement('button');
    allButton.className = 'year-tab-modern active px-6 py-2.5';
    allButton.setAttribute('data-year', '全部');
    allButton.textContent = `全部 (${siteData.albums.length})`;
    yearTabsContainer.appendChild(allButton);
    
    // 添加年份按钮
    years.forEach(year => {
        const button = document.createElement('button');
        button.className = 'year-tab-modern px-6 py-2.5';
        button.setAttribute('data-year', year);
        button.textContent = `${year} (${yearCounts[year]})`;
        yearTabsContainer.appendChild(button);
    });
    
    // 绑定点击事件
    initYearFilter();
}

/**
 * 初始化年份筛选
 */
export function initYearFilter() {
    const yearTabs = document.querySelectorAll('.year-tab-modern');
    
    yearTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有激活状态
            yearTabs.forEach(t => t.classList.remove('active'));
            
            // 激活当前按钮
            tab.classList.add('active');
            
            // 筛选相册
            const year = tab.getAttribute('data-year');
            filterAlbumsByYear(year);
        });
    });
}

/**
 * 按年份筛选相册
 */
export function filterAlbumsByYear(year) {
    const albumCards = document.querySelectorAll('.album-card-modern');
    
    albumCards.forEach(card => {
        const cardYear = card.getAttribute('data-year');
        
        if (year === '全部' || cardYear === year) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * 渲染相册详情
 */
export function renderAlbumDetail(albumData) {
    const mediaList = Array.isArray(albumData.mediaList) ? albumData.mediaList : [];
    const totalCount = mediaList.length;
    const videoCount = mediaList.filter(media => media && media.type === 'VIDEO').length;
    const photoCount = totalCount - videoCount;

    // 渲染相册头部信息
    const albumHeader = document.querySelector('.album-header');
    if (albumHeader) {
        albumHeader.innerHTML = `
            <div class="container">
                <h1 class="album-title text-4xl font-bold mb-2">${albumData.title}</h1>
                <div class="album-meta flex items-center gap-4 text-gray-500 mb-4">
                    <span><i class="fas fa-calendar mr-2"></i>${albumData.year}年</span>
                    <span><i class="fas fa-image mr-2"></i>共${totalCount}张照片和视频</span>
                </div>
                <p class="album-desc text-lg text-gray-600 mb-6 mt-6">${albumData.description || ''}</p>
                
                <!-- 标签区域 -->
                ${albumData.tags && albumData.tags.length > 0 ? `
                <div class="album-tags mt-6">
                    <div class="tags-container flex flex-wrap gap-2 justify-center">
                        <!-- 类型筛选按钮 -->
                        <span class="tag-badge cursor-pointer hover:bg-gray-700 active" data-type="all">全部 (${totalCount})</span>
                        <span class="tag-badge cursor-pointer hover:bg-gray-700" data-type="photo">照片 (${photoCount})</span>
                        <span class="tag-badge cursor-pointer hover:bg-gray-700" data-type="video">视频 (${videoCount})</span>
                        
                        <!-- 相册标签 -->
                        ${albumData.tags.map(tag => `
                            <span class="tag-badge cursor-pointer hover:bg-gray-700" data-tag-id="${tag.id}" data-tag-name="${tag.name}">
                                ${tag.name} (${tag.mediaCount})
                            </span>
                        `).join('')}
                    </div>
                </div>
                ` : `
                <!-- 如果没有标签，仅显示类型筛选 -->
                <div class="album-tags mt-6">
                    <div class="tags-container flex flex-wrap gap-2 justify-center">
                        <span class="tag-badge cursor-pointer hover:bg-gray-700 active" data-type="all">全部 (${totalCount})</span>
                        <span class="tag-badge cursor-pointer hover:bg-gray-700" data-type="photo">照片 (${photoCount})</span>
                        <span class="tag-badge cursor-pointer hover:bg-gray-700" data-type="video">视频 (${videoCount})</span>
                    </div>
                </div>
                `}
            </div>
        `;
        
        // 绑定类型筛选事件
        bindTypeFilterEvents(mediaList);
        
        // 标签点击事件已在 api.js 中处理
    }
    
    // 渲染照片网格
    const photoGrid = document.getElementById('photoGrid');
    if (photoGrid && albumData.mediaList) {
        photoGrid.innerHTML = '';
        
        albumData.mediaList.forEach((media, index) => {
            // 处理标签显示：最多显示配置的数量，超出显示+N
        const allTags = media.tags || [];
        const maxDisplayTags = UI_CONFIG.TAGS.MAX_DISPLAY_TAGS;
        const displayTags = allTags.slice(0, maxDisplayTags);
        const moreTagsCount = allTags.length > maxDisplayTags ? allTags.length - maxDisplayTags : 0;
            const hasMoreTags = moreTagsCount > 0;
            
            // 构建标签 HTML
            let tagsHtml = displayTags.map(tag => 
                `<span class="media-tag">${tag.name}</span>`
            ).join('');
            
            // 添加+N按钮（如果有更多标签）
            if (hasMoreTags) {
                const remainingTags = allTags.slice(maxDisplayTags);
                const remainingTagsJson = JSON.stringify(remainingTags.map(t => t.name)).replace(/"/g, '&quot;');
                tagsHtml += `<span class="media-tag more-tags" data-tags="${remainingTagsJson}" data-index="${index}">+${moreTagsCount}</span>`;
            }
            
            // 判断是否为视频
            const isVideo = media.type === 'VIDEO';
            
            // 解析EXIF信息
            let exifData = null;
            if (media.exifInfo && media.exifInfo !== '{}') {
                try {
                    exifData = JSON.parse(media.exifInfo);
                } catch (e) {
                    console.warn('解析EXIF信息失败:', e);
                }
            }
            
            // 提取拍摄时间（从shootTime字段解析，优先于EXIF）
            let shootDate = '2024-02-20';
            let fullShootTime = '';
            if (media.shootTime) {
                const dateMatch = String(media.shootTime).match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
                if (dateMatch) {
                    shootDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                    fullShootTime = `拍摄日期 ${dateMatch[1]}年${dateMatch[2]}月${dateMatch[3]}日  ${dateMatch[4]}:${dateMatch[5]}:${dateMatch[6]}`;
                }
            } else if (exifData && exifData.shootTime) {
                const dateMatch = exifData.shootTime.match(/(\d{4}):(\d{2}):(\d{2})/);
                if (dateMatch) {
                    shootDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                    fullShootTime = `拍摄日期 ${dateMatch[1]}年${dateMatch[2]}月${dateMatch[3]}日`;
                }
            }
            
            // 构建EXIF信息字符串（相机品牌 | 光圈 | 快门）
            let exifInfo = '';
            if (exifData) {
                const parts = [];
                if (exifData.camera) parts.push(exifData.camera);
                if (exifData.aperture) parts.push(exifData.aperture);
                if (exifData.shutterSpeed) parts.push(exifData.shutterSpeed);
                exifInfo = parts.join(' | ');
            }
            
            // 构建描述文本（使用文件名作为描述，或从media.description获取）
            const description = media.description || media.originalFilename || '';
            
            // 视频时长（暂时固定，后续可从接口获取）
            const videoDuration = isVideo ? '00:15' : '';
            
            const cardHtml = `
                <article class="media-card" role="button" tabindex="0" data-media-id="${media.id}">
                    <!-- 图片展示区 - 4:3比例 -->
                    <div class="media-card-image-wrapper">
                        <img src="${media.thumbnailUrl}" alt="${media.originalFilename}" class="media-card-image" loading="lazy">
                        
                        <!-- 类型标识 -->
                        ${isVideo ? `
                        <div class="media-type-video">
                            <i class="fa fa-video-camera mr-1"></i>视频
                        </div>
                        ` : `
                        <div class="media-type-photo">
                            <i class="fa fa-camera mr-1"></i>照片
                        </div>
                        `}
                        
                        <!-- 视频播放图标 -->
                        ${isVideo ? `
                        <div class="video-play-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </div>
                        ` : ''}
                        
                        <!-- 视频时长标签 -->
                        ${isVideo && videoDuration ? `
                        <div class="video-duration">
                            ${videoDuration}
                        </div>
                        ` : ''}
                        
                        <!-- 快捷操作按钮 -->
                        <div class="media-card-actions">
                            <!-- 下载按钮 -->
                            <button class="media-action-btn" title="下载" data-original-url="${media.originalUrl}">
                                <i class="fa fa-download"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- 信息区 -->
                    <div class="media-card-info">
                        <!-- 第一行：拍摄时间和EXIF -->
                        <div class="media-card-row">
                            <span class="media-date" ${fullShootTime ? `title="${fullShootTime}"` : ''}>${shootDate}</span>
                            ${exifInfo ? `<span class="media-exif">${exifInfo}</span>` : ''}
                        </div>
                        
                        <!-- 第二行：描述文本 -->
                        ${description ? `
                        <div class="media-card-row">
                            <p class="media-description" title="${description.replace(/"/g, '&quot;')}">${description}</p>
                        </div>
                        ` : ''}
                        
                        <!-- 第三行：标签列表 -->
                        ${allTags.length > 0 ? `
                        <div class="media-card-row">
                            <div class="media-tags-container">
                                ${tagsHtml}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </article>
            `;
            photoGrid.insertAdjacentHTML('beforeend', cardHtml);
        });
        
        // 绑定更多标签的事件（悬停/点击展示剩余标签）
        bindMoreTagsEvents();
        
        // 绑定下载按钮点击事件
        bindDownloadEvents();
        
        // 绑定卡片点击事件，打开预览模态框
        bindPreviewModalEvents(albumData.mediaList);
    }
}

/**
 * 绑定类型筛选事件
 */
function bindTypeFilterEvents(mediaList) {
    const typeFilterBtns = Array.from(document.querySelectorAll('.tag-badge[data-type]'));
    const tagFilterBtns = Array.from(document.querySelectorAll('.tag-badge[data-tag-id]'));
    const allBtn = typeFilterBtns.find(b => b.getAttribute('data-type') === 'all') || null;
    const photoVideoBtns = typeFilterBtns.filter(b => ['photo', 'video'].includes(b.getAttribute('data-type')));

    function getSelectedType() {
        const selected = photoVideoBtns.find(b => b.classList.contains('active'));
        return selected ? selected.getAttribute('data-type') : null;
    }

    function getSelectedTagIds() {
        return tagFilterBtns.filter(b => b.classList.contains('active')).map(b => b.getAttribute('data-tag-id'));
    }

    function setAllActive(active) {
        if (!allBtn) return;
        if (active) {
            allBtn.classList.add('active');
        } else {
            allBtn.classList.remove('active');
        }
    }

    function clearTypeSelection() {
        photoVideoBtns.forEach(b => b.classList.remove('active'));
    }

    function clearTagSelection() {
        tagFilterBtns.forEach(b => b.classList.remove('active'));
    }

    function applyFilters() {
        const type = getSelectedType();
        const tagIds = getSelectedTagIds();

        if (!type && tagIds.length === 0) {
            setAllActive(true);
        } else {
            setAllActive(false);
        }

        let filteredMedia = mediaList;

        if (type === 'photo') {
            filteredMedia = filteredMedia.filter(media => media.type !== 'VIDEO');
        } else if (type === 'video') {
            filteredMedia = filteredMedia.filter(media => media.type === 'VIDEO');
        }

        if (tagIds.length > 0) {
            filteredMedia = filteredMedia.filter(media => {
                if (!media.tags || media.tags.length === 0) return false;
                return tagIds.every(tagId => media.tags.some(tag => String(tag.id) === String(tagId)));
            });
        }

        renderMediaGrid(filteredMedia);
    }

    if (allBtn) {
        allBtn.addEventListener('click', () => {
            setAllActive(true);
            clearTypeSelection();
            clearTagSelection();
            renderMediaGrid(mediaList);
        });
    }

    photoVideoBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const wasActive = btn.classList.contains('active');
            const type = btn.getAttribute('data-type');

            setAllActive(false);
            clearTypeSelection();

            if (!wasActive) {
                const target = photoVideoBtns.find(b => b.getAttribute('data-type') === type);
                if (target) target.classList.add('active');
            }

            applyFilters();
        });
    });

    tagFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const isActive = btn.classList.contains('active');
            setAllActive(false);

            if (isActive) {
                btn.classList.remove('active');
            } else {
                btn.classList.add('active');
            }

            applyFilters();
        });
    });
}

/**
 * 渲染媒体网格
 */
function renderMediaGrid(mediaList) {
    const photoGrid = document.getElementById('photoGrid');
    if (!photoGrid) return;
    
    photoGrid.innerHTML = '';
    
    mediaList.forEach((media, index) => {
        // 处理标签显示：最多显示配置的数量，超出显示+N
        const allTags = media.tags || [];
        const maxDisplayTags = UI_CONFIG.TAGS.MAX_DISPLAY_TAGS;
        const displayTags = allTags.slice(0, maxDisplayTags);
        const moreTagsCount = allTags.length > maxDisplayTags ? allTags.length - maxDisplayTags : 0;
        const hasMoreTags = moreTagsCount > 0;
        
        // 构建标签 HTML
        let tagsHtml = displayTags.map(tag => 
            `<span class="media-tag">${tag.name}</span>`
        ).join('');
        
        // 添加+N按钮（如果有更多标签）
        if (hasMoreTags) {
            const remainingTags = allTags.slice(maxDisplayTags);
            const remainingTagsJson = JSON.stringify(remainingTags.map(t => t.name)).replace(/"/g, '&quot;');
            tagsHtml += `<span class="media-tag more-tags" data-tags="${remainingTagsJson}" data-index="${index}">+${moreTagsCount}</span>`;
        }
        
        // 判断是否为视频
        const isVideo = media.type === 'VIDEO';
        
        // 解析 EXIF 信息
        let exifData = null;
        if (media.exifInfo && media.exifInfo !== '{}') {
            try {
                exifData = JSON.parse(media.exifInfo);
            } catch (e) {
                console.warn('解析 EXIF 信息失败:', e);
            }
        }
        
        // 提取拍摄时间（从shootTime字段解析，优先于EXIF）
        let shootDate = '2024-02-20';
        let fullShootTime = '';
        if (media.shootTime) {
            const dateMatch = String(media.shootTime).match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
            if (dateMatch) {
                shootDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                fullShootTime = `拍摄日期 ${dateMatch[1]}年${dateMatch[2]}月${dateMatch[3]}日  ${dateMatch[4]}:${dateMatch[5]}:${dateMatch[6]}`;
            }
        } else if (exifData && exifData.shootTime) {
            const dateMatch = exifData.shootTime.match(/(\d{4}):(\d{2}):(\d{2})/);
            if (dateMatch) {
                shootDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                fullShootTime = `拍摄日期 ${dateMatch[1]}年${dateMatch[2]}月${dateMatch[3]}日`;
            }
        }
        
        // 构建 EXIF 信息字符串（相机品牌 | 光圈 | 快门）
        let exifInfo = '';
        if (exifData) {
            const parts = [];
            if (exifData.camera) parts.push(exifData.camera);
            if (exifData.aperture) parts.push(exifData.aperture);
            if (exifData.shutterSpeed) parts.push(exifData.shutterSpeed);
            exifInfo = parts.join(' | ');
        }
        
        // 构建描述文本（使用文件名作为描述，或从 media.description 获取）
        const description = media.description || media.originalFilename || '';
        
        // 视频时长（暂时固定，后续可从接口获取）
        const videoDuration = isVideo ? '00:15' : '';
        
        const cardHtml = `
            <article class="media-card" role="button" tabindex="0" data-media-id="${media.id}">
                <!-- 图片展示区 - 4:3 比例 -->
                <div class="media-card-image-wrapper">
                    <img src="${media.thumbnailUrl}" alt="${media.originalFilename}" class="media-card-image" loading="lazy">
                    
                    <!-- 类型标识 -->
                    ${isVideo ? `
                    <div class="media-type-video">
                        <i class="fa fa-video-camera mr-1"></i>视频
                    </div>
                    ` : `
                    <div class="media-type-photo">
                        <i class="fa fa-camera mr-1"></i>照片
                    </div>
                    `}
                    
                    <!-- 视频播放图标 -->
                    ${isVideo ? `
                    <div class="video-play-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                    ` : ''}
                    
                    <!-- 视频时长标签 -->
                    ${isVideo && videoDuration ? `
                    <div class="video-duration">
                        ${videoDuration}
                    </div>
                    ` : ''}
                    
                    <!-- 快捷操作按钮 -->
                    <div class="media-card-actions">
                        <!-- 下载按钮 -->
                        <button class="media-action-btn" title="下载" data-original-url="${media.originalUrl}">
                            <i class="fa fa-download"></i>
                        </button>
                    </div>
                </div>
                
                <!-- 信息区 -->
                <div class="media-card-info">
                    <!-- 第一行：拍摄时间和 EXIF -->
                    <div class="media-card-row">
                        <span class="media-date" ${fullShootTime ? `title="${fullShootTime}"` : ''}>${shootDate}</span>
                        ${exifInfo ? `<span class="media-exif">${exifInfo}</span>` : ''}
                    </div>
                    
                    <!-- 第二行：描述文本 -->
                    ${description ? `
                    <div class="media-card-row">
                        <p class="media-description" title="${description.replace(/"/g, '&quot;')}">${description}</p>
                    </div>
                    ` : ''}
                    
                    <!-- 第三行：标签列表 -->
                    ${allTags.length > 0 ? `
                    <div class="media-card-row">
                        <div class="media-tags-container">
                            ${tagsHtml}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </article>
        `;
        photoGrid.insertAdjacentHTML('beforeend', cardHtml);
    });
    
    // 重新绑定事件
    bindMoreTagsEvents();
    bindDownloadEvents();
    bindPreviewModalEvents(mediaList);
}

/**
 * 绑定更多标签的事件（悬停/点击展示剩余标签）
 */
function bindMoreTagsEvents() {
    const moreTagsElements = document.querySelectorAll('.more-tags');
    
    moreTagsElements.forEach(el => {
        // 点击事件
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            showMoreTagsTooltip(el);
        });
        
        // 悬停事件
        el.addEventListener('mouseenter', () => {
            showMoreTagsTooltip(el);
        });
    });
}

/**
 * 绑定下载按钮点击事件
 */
function bindDownloadEvents() {
    const downloadButtons = document.querySelectorAll('.media-action-btn');
    
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡，避免触发卡片点击
            
            const originalUrl = btn.getAttribute('data-original-url');
            
            if (originalUrl && originalUrl !== 'null' && originalUrl !== 'undefined') {
                // 处理URL中的空格和引号
                const cleanUrl = originalUrl.replace(/[`']/g, '').trim();
                
                // 创建下载链接
                const link = document.createElement('a');
                link.href = cleanUrl;
                link.download = ''; // 让浏览器自动处理文件名
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // 没有原始文件链接时的提示
                alert('抱歉，暂无下载链接');
            }
        });
    });
}

/**
 * 显示更多标签的提示框
 */
function showMoreTagsTooltip(element) {
    // 移除已存在的提示框
    const existingTooltip = document.querySelector('.tags-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    const tagsData = JSON.parse(element.getAttribute('data-tags') || '[]');
    if (tagsData.length === 0) return;
    
    const rect = element.getBoundingClientRect();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tags-tooltip';
    tooltip.innerHTML = tagsData.map(tag => `<span class="media-tag">${tag}</span>`).join('');
    
    document.body.appendChild(tooltip);
    
    // 定位提示框
    const tooltipRect = tooltip.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
    tooltip.style.top = `${rect.top - tooltipRect.height - 8}px`;
    
    // 鼠标离开提示框时移除
    tooltip.addEventListener('mouseleave', () => {
        tooltip.remove();
    });
    
    // 鼠标离开触发元素时移除
    element.addEventListener('mouseleave', () => {
        // 延迟一点时间，让鼠标有时间移动到提示框上
        setTimeout(() => {
            if (!tooltip.matches(':hover')) {
                tooltip.remove();
            }
        }, 200);
    });
    
    // 点击其他地方时移除
    const removeTooltip = (e) => {
        if (!tooltip.contains(e.target) && e.target !== element) {
            tooltip.remove();
            document.removeEventListener('click', removeTooltip);
        }
    };
    
    document.addEventListener('click', removeTooltip);
}

let previewModalMediaList = [];
let previewModalCurrentIndex = 0;

/**
 * 绑定预览模态框事件
 */
function bindPreviewModalEvents(mediaList, cardSelector = '.media-card') {
    previewModalMediaList = Array.isArray(mediaList) ? mediaList : [];
    previewModalCurrentIndex = 0;
    const mediaCards = document.querySelectorAll(cardSelector);
    const modal = document.getElementById('previewModal');
    const overlay = document.getElementById('previewModalOverlay');
    const closeBtn = document.getElementById('previewClose');
    const prevBtn = document.getElementById('previewPrev');
    const nextBtn = document.getElementById('previewNext');
    const downloadBtn = document.getElementById('previewDownload');
    const viewAlbumBtn = document.getElementById('previewViewAlbum');
    const controls = document.getElementById('previewControls');
    const topRight = document.querySelector('.preview-modal-top-right');
    
    let hideTimer;
    
    // 绑定卡片点击事件
    mediaCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            previewModalCurrentIndex = index;
            openPreviewModal(previewModalMediaList[index]);
        });
    });

    if (modal && modal.dataset.previewBound !== '1') {
        closeBtn.addEventListener('click', closePreviewModal);
        overlay.addEventListener('click', closePreviewModal);
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closePreviewModal();
            }
        });
        
        prevBtn.addEventListener('click', () => {
            if (!previewModalMediaList.length) return;
            previewModalCurrentIndex = (previewModalCurrentIndex - 1 + previewModalMediaList.length) % previewModalMediaList.length;
            updatePreviewModal(previewModalMediaList[previewModalCurrentIndex]);
            resetHideTimer();
        });
        
        nextBtn.addEventListener('click', () => {
            if (!previewModalMediaList.length) return;
            previewModalCurrentIndex = (previewModalCurrentIndex + 1) % previewModalMediaList.length;
            updatePreviewModal(previewModalMediaList[previewModalCurrentIndex]);
            resetHideTimer();
        });
        
        downloadBtn.addEventListener('click', () => {
            const media = previewModalMediaList[previewModalCurrentIndex];
            if (media?.originalUrl && media.originalUrl !== 'null' && media.originalUrl !== 'undefined') {
                const cleanUrl = media.originalUrl.replace(/[`']/g, '').trim();
                const link = document.createElement('a');
                link.href = cleanUrl;
                link.download = '';
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert('抱歉，暂无下载链接');
            }
            resetHideTimer();
        });

        modal.addEventListener('mousemove', resetHideTimer);
        modal.dataset.previewBound = '1';
    }

    if (viewAlbumBtn) {
            viewAlbumBtn.onclick = () => {
                const media = previewModalMediaList[previewModalCurrentIndex];
                const albumId = media?.albumId;
                if (albumId) {
                    window.open(`album.html?id=${albumId}`, '_blank', 'noopener');
                }
            };
        }
    
    // 打开预览模态框
    function openPreviewModal(media) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        updatePreviewModal(media);
        resetHideTimer();
    }
    
    // 关闭预览模态框
    function closePreviewModal() {
        // 暂停视频播放并销毁 Video.js 实例
        if (window.videoPlayer) {
            window.videoPlayer.pause();
            window.videoPlayer.dispose();
            window.videoPlayer = null;
        }

        if (zoomListenersAbortController) {
            zoomListenersAbortController.abort();
            zoomListenersAbortController = null;
        }
        
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        clearHideTimer();
    }
    
    // 图片缩放和拖拽相关变量
    let currentScale = 1;
    let isDragging = false;
    let startX, startY, translateX = 0, translateY = 0;
    let zoomListenersAbortController = null;
    
    // 更新预览模态框内容
    function updatePreviewModal(media) {
        // 显示/隐藏照片和视频预览
        const photoPreview = document.getElementById('previewPhoto');
        const videoPreview = document.getElementById('previewVideo');
        const previewImg = document.getElementById('previewImg');
        const previewVideoPlayer = document.getElementById('previewVideoPlayer');
        const previewMedia = document.getElementById('previewMedia');
        
        // 重置缩放和拖拽状态
        currentScale = 1;
        translateX = 0;
        translateY = 0;
        
        if (media.type === 'VIDEO') {
            photoPreview.style.display = 'none';
            videoPreview.style.display = 'flex';
            if (zoomListenersAbortController) {
                zoomListenersAbortController.abort();
                zoomListenersAbortController = null;
            }
            // 初始化 Video.js 播放器
            initVideoPlayButton(media);
        } else {
            photoPreview.style.display = 'flex';
            videoPreview.style.display = 'none';
            previewImg.src = media.originalUrl.replace(/[`']/g, '').trim();
            previewImg.alt = media.originalFilename;
            
            // 暂停并销毁视频播放器（如果存在）
            if (window.videoPlayer) {
                window.videoPlayer.pause();
                window.videoPlayer.dispose();
                window.videoPlayer = null;
            }
            
            // 初始化图片缩放和拖拽
            setTimeout(() => {
                initImageZoomAndDrag();
            }, 100);
        }
        
        // 更新信息区
        document.getElementById('previewFilename').textContent = media.originalFilename;

        const viewAlbumBtnEl = document.getElementById('previewViewAlbum');
        if (viewAlbumBtnEl) {
            const titleText = `查看相册 “${media.albumTitle || ''}”`;
            viewAlbumBtnEl.setAttribute('title', titleText);
            const tooltip = viewAlbumBtnEl.querySelector('.download-tooltip');
            if (tooltip) tooltip.textContent = titleText;
        }
        
        // 解析拍摄时间
        let shootTime = '未知';
        if (media.exifInfo && media.exifInfo !== '{}') {
            try {
                const exifData = JSON.parse(media.exifInfo);
                if (exifData.shootTime) {
                    // 格式：2025:10:25 19:33:53 -> 2025年10月25日 19:33:53
                    const dateMatch = exifData.shootTime.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
                    if (dateMatch) {
                        shootTime = `${dateMatch[1]}年${dateMatch[2]}月${dateMatch[3]}日 ${dateMatch[4]}:${dateMatch[5]}:${dateMatch[6]}`;
                    } else {
                        shootTime = exifData.shootTime;
                    }
                }
            } catch (e) {
                console.warn('解析EXIF信息失败:', e);
            }
        }
        document.getElementById('previewTime').textContent = shootTime;
        
        // 更新描述
        const descriptionEl = document.getElementById('previewDescription');
        const descriptionSection = document.getElementById('descriptionSection');
        const hasDescription = media.description && media.description.trim();
        
        if (hasDescription) {
            descriptionEl.textContent = media.description;
            if (descriptionSection) {
                descriptionSection.style.display = 'block';
            }
        } else {
            if (descriptionSection) {
                descriptionSection.style.display = 'none';
            }
        }
        
        // 更新 EXIF 参数
        const exifEl = document.getElementById('previewExif');
        const exifSection = document.getElementById('exifSection');
        exifEl.innerHTML = '';
        let hasExif = false;
        
        if (media.exifInfo && media.exifInfo !== '{}') {
            try {
                const exifData = JSON.parse(media.exifInfo);
                const exifLabels = {
                    camera: '相机',
                    aperture: '光圈',
                    shutterSpeed: '快门速度',
                    iso: 'ISO',
                    ISO: 'ISO',
                    focalLength: '焦距',
                    resolution: '分辨率',
                    duration: '时长'
                };
                for (const [key, value] of Object.entries(exifData)) {
                    if (key === 'shootTime') continue; // 跳过拍摄时间，因为已经在基础信息部分显示
                    if (value && value !== 'null' && value !== 'undefined') {
                        hasExif = true;
                        const label = exifLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        const exifItem = document.createElement('div');
                        exifItem.className = 'preview-info-exif-item';
                        exifItem.innerHTML = `
                            <span class="preview-info-exif-label">${label}：</span>
                            <span class="preview-info-exif-value">${value}</span>
                        `;
                        exifEl.appendChild(exifItem);
                    }
                }
            } catch (e) {
                console.warn('解析 EXIF 信息失败:', e);
            }
        }
        
        // 如果没有 EXIF 信息，隐藏拍摄参数标题
        if (exifSection) {
            exifSection.style.display = hasExif ? 'block' : 'none';
        }
        
        // 更新标签
        const tagsSection = document.getElementById('tagsSection');
        const tagsEl = document.getElementById('previewTags');
        if (media.tags && media.tags.length > 0) {
            tagsEl.innerHTML = '';
            media.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'preview-info-tag';
                tagEl.textContent = tag.name;
                tagsEl.appendChild(tagEl);
            });
            if (tagsSection) {
                tagsSection.style.display = 'block';
            }
        } else {
            if (tagsSection) {
                tagsSection.style.display = 'none';
            }
        }
    }
    
    // 初始化图片缩放和拖拽功能
    function initImageZoomAndDrag() {
        const previewImg = document.getElementById('previewImg');
        const photoPreview = document.getElementById('previewPhoto');
        
        if (!previewImg || !photoPreview) return;

        if (zoomListenersAbortController) {
            zoomListenersAbortController.abort();
        }
        zoomListenersAbortController = new AbortController();
        
        // 重置变换
        currentScale = 1;
        translateX = 0;
        translateY = 0;
        previewImg.style.transform = 'scale(1) translate(0, 0)';
        previewImg.style.cursor = 'grab';
        previewImg.style.transition = 'transform 0.3s ease';
        previewImg.draggable = false;
        
        // 滚轮缩放（支持更精细的控制）
        function handleWheel(e) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.2 : 0.2;
            const newScale = Math.min(Math.max(currentScale + delta, 0.3), 5);
            
            if (newScale !== currentScale) {
                currentScale = newScale;
                // 限制拖拽范围：只有在放大超过 1 倍时才允许拖拽
                if (currentScale <= 1) {
                    translateX = 0;
                    translateY = 0;
                }
                updateImageTransform();
            }
        }
        
        // 鼠标进入图片区域
        function handleMouseEnter() {
            previewImg.style.transition = 'none';
        }
        
        // 鼠标离开图片区域
        function handleMouseLeave() {
            previewImg.style.transition = 'transform 0.3s ease';
        }
        
        // 鼠标按下开始拖拽
        function handleMouseDown(e) {
            // 当图片放大超过 1 倍时允许拖拽
            if (currentScale > 1) {
                e.preventDefault();
                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
                previewImg.style.cursor = 'grabbing';
                previewImg.style.transition = 'none';
            }
        }
        
        // 鼠标移动
        function handleMouseMove(e) {
            if (isDragging) {
                e.preventDefault();
                translateX = e.clientX - startX;
                translateY = e.clientY - startY;
                
                // 限制拖拽边界
                const maxX = (previewImg.offsetWidth * (currentScale - 1)) / 2;
                const maxY = (previewImg.offsetHeight * (currentScale - 1)) / 2;
                translateX = Math.max(-maxX, Math.min(maxX, translateX));
                translateY = Math.max(-maxY, Math.min(maxY, translateY));
                
                updateImageTransform();
            }
        }
        
        // 鼠标释放
        function handleMouseUp() {
            isDragging = false;
            previewImg.style.cursor = 'grab';
            previewImg.style.transition = 'transform 0.3s ease';
        }
        
        // 双击还原
        function handleDblClick(e) {
            e.stopPropagation();
            currentScale = 1;
            translateX = 0;
            translateY = 0;
            previewImg.style.transition = 'transform 0.5s ease';
            updateImageTransform();
        }
        
        // 触摸开始（移动端支持）
        let lastTouchDistance = 0;
        function handleTouchStart(e) {
            if (e.touches.length === 2) {
                lastTouchDistance = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
            } else if (e.touches.length === 1 && currentScale > 1) {
                isDragging = true;
                startX = e.touches[0].clientX - translateX;
                startY = e.touches[0].clientY - translateY;
            }
        }
        
        // 触摸移动（移动端支持）
        function handleTouchMove(e) {
            if (e.touches.length === 2 && lastTouchDistance > 0) {
                e.preventDefault();
                const newDistance = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                const delta = (newDistance - lastTouchDistance) * 0.01;
                const newScale = Math.min(Math.max(currentScale + delta, 0.3), 5);
                
                if (newScale !== currentScale) {
                    currentScale = newScale;
                    if (currentScale <= 1) {
                        translateX = 0;
                        translateY = 0;
                    }
                    updateImageTransform();
                }
                lastTouchDistance = newDistance;
            } else if (e.touches.length === 1 && isDragging) {
                e.preventDefault();
                translateX = e.touches[0].clientX - startX;
                translateY = e.touches[0].clientY - startY;
                updateImageTransform();
            }
        }
        
        // 触摸结束（移动端支持）
        function handleTouchEnd() {
            isDragging = false;
            lastTouchDistance = 0;
        }
        
        // 更新变换
        function updateImageTransform() {
            previewImg.style.transform = `scale(${currentScale}) translate(${translateX / currentScale}px, ${translateY / currentScale}px)`;
        }
        
        // 添加事件监听器
        photoPreview.addEventListener('wheel', handleWheel, { passive: false, signal: zoomListenersAbortController.signal });
        previewImg.addEventListener('mousedown', handleMouseDown, { signal: zoomListenersAbortController.signal });
        previewImg.addEventListener('mouseenter', handleMouseEnter, { signal: zoomListenersAbortController.signal });
        previewImg.addEventListener('mouseleave', handleMouseLeave, { signal: zoomListenersAbortController.signal });
        document.addEventListener('mousemove', handleMouseMove, { signal: zoomListenersAbortController.signal });
        document.addEventListener('mouseup', handleMouseUp, { signal: zoomListenersAbortController.signal });
        previewImg.addEventListener('dblclick', handleDblClick, { signal: zoomListenersAbortController.signal });
        // 移动端触摸事件
        previewImg.addEventListener('touchstart', handleTouchStart, { passive: false, signal: zoomListenersAbortController.signal });
        previewImg.addEventListener('touchmove', handleTouchMove, { passive: false, signal: zoomListenersAbortController.signal });
        previewImg.addEventListener('touchend', handleTouchEnd, { signal: zoomListenersAbortController.signal });
    }
    
    // 初始化视频播放
    function initVideoPlayButton(media) {
        const videoPreview = document.getElementById('previewVideo');
        
        if (!videoPreview) return;
        
        // 如果已有 Video.js 实例，先销毁
        if (window.videoPlayer) {
            try {
                window.videoPlayer.pause();
                window.videoPlayer.dispose();
            } catch (e) {
                console.warn('销毁 Video.js 实例失败:', e);
            }
            window.videoPlayer = null;
        }
        
        // 设置视频源和封面
        const cleanUrl = media.originalUrl.replace(/[`']/g, '').trim();
        const posterUrl = media.thumbnailUrl ? media.thumbnailUrl.replace(/[`']/g, '').trim() : '';

        videoPreview.innerHTML = `
            <video class="video-js vjs-default-skin vjs-big-play-centered preview-modal-video-player" id="previewVideoPlayer" preload="metadata" playsinline>
                <source src="${cleanUrl}" type="video/mp4">
            </video>
        `;
        const previewVideoPlayer = document.getElementById('previewVideoPlayer');
        if (!previewVideoPlayer) return;
        if (posterUrl) previewVideoPlayer.setAttribute('poster', posterUrl);
        
        // 初始化 Video.js
        try {
            window.videoPlayer = videojs(previewVideoPlayer, {
                controls: true,
                autoplay: false,
                preload: 'auto',
                fluid: false,
                responsive: true,
                inactivityTimeout: 0,
                playbackRates: [0.5, 1, 1.5, 2],
                sources: [{ src: cleanUrl, type: 'video/mp4' }]
            });
            
            // 监听视频加载错误
            window.videoPlayer.ready(() => {
                window.videoPlayer.on('error', () => {
                    const error = window.videoPlayer.error();
                    console.error('视频播放错误:', error);
                    if (error) {
                        // 显示友好提示
                        const videoContainer = videoPreview.querySelector('.video-js');
                        if (videoContainer) {
                            videoContainer.insertAdjacentHTML('beforeend', `
                                <div class="video-error-message" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;text-align:center;z-index:10;">
                                    <i class="fa fa-exclamation-triangle" style="font-size:48px;margin-bottom:16px;"></i>
                                    <p>视频加载失败，请稍后重试</p>
                                </div>
                            `);
                        }
                    }
                });
                
                // 监听视频播放状态，优化控制栏隐藏逻辑
                window.videoPlayer.on('play', () => {
                    // 视频开始播放时，显示控制栏并暂停自动隐藏
                    resetHideTimer();
                });
                
                window.videoPlayer.on('pause', () => {
                    // 视频暂停时，恢复自动隐藏功能
                    clearHideTimer();
                    controls.classList.remove('hidden');
                    topRight.classList.remove('hidden');
                });
                
                window.videoPlayer.on('ended', () => {
                    // 视频播放结束时，显示控制栏
                    clearHideTimer();
                    controls.classList.remove('hidden');
                    topRight.classList.remove('hidden');
                });
                
                // 鼠标移入控制栏区域时重置计时器
                controls.addEventListener('mouseenter', () => {
                    resetHideTimer();
                });
                
                topRight.addEventListener('mouseenter', () => {
                    resetHideTimer();
                });
            });
        } catch (e) {
            console.error('初始化 Video.js 失败:', e);
            alert('视频播放器初始化失败，请刷新页面重试');
        }
    }
    
    // 重置隐藏计时器
    function resetHideTimer() {
        clearHideTimer();
        controls.classList.remove('hidden');
        topRight.classList.remove('hidden');
        
        // 如果正在播放视频，则延迟隐藏控制栏（视频播放时不自动隐藏）
        if (window.videoPlayer && !window.videoPlayer.paused()) {
            // 视频播放期间不隐藏控制栏
            return;
        }
        
        hideTimer = setTimeout(() => {
            controls.classList.add('hidden');
            topRight.classList.add('hidden');
        }, 3000);
    }
    
    // 清除隐藏计时器
    function clearHideTimer() {
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
    }
}
