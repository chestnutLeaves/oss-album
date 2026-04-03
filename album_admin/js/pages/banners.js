import { api, dateFormatter, showError, showSuccess, showConfirm } from '../utils.js';
import { ossClient } from '../oss-client.js';
import { mediaHandler } from '../media-handler.js';

// 轮播图管理页面
let banners = [];
let editingBanner = null;
let currentSiteId = null;
let sites = [];

// 初始化页面
export async function init(contentBody) {
  // 渲染页面结构
  contentBody.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>轮播图管理</h3>
        <div>
          <select id="site-select" class="form-control" style="display: inline-block; width: 220px; height: 36px; font-size: 14px; padding: 0 12px; border: 1px solid #ddd; border-radius: 4px; margin-right: 10px; transition: all 0.3s ease;">
            <option value="">选择站点</option>
          </select>
          <button id="add-banner-btn" class="btn btn-primary">添加轮播图</button>
        </div>
      </div>
      <div id="banner-list">
        <div style="text-align: center; padding: 40px;">请选择站点</div>
      </div>
    </div>
  `;
  
  // 创建模态框并添加到body
  createModal();
  
  // 加载站点列表
  await loadSites();
  
  // 绑定事件
  bindEvents();
}

// 创建模态框
function createModal() {
  // 检查模态框是否已存在
  if (document.getElementById('banner-modal')) {
    return;
  }
  
  const modalHTML = `
    <div id="banner-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h4 id="modal-title">添加轮播图</h4>
          <button id="close-modal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form id="banner-form" class="form">
            <input type="hidden" id="banner-id" name="id">
            <input type="hidden" id="banner-site-id" name="siteId">
            <div class="form-row">
              <label for="banner-title">标题</label>
              <input type="text" id="banner-title" name="title" required>
            </div>
            <div class="form-row">
              <label for="banner-description">描述</label>
              <textarea id="banner-description" name="description"></textarea>
            </div>
            <div class="form-row">
              <label for="banner-image-file">Banner 图片</label>
              <div id="banner-upload-area" style="border: 2px dashed #ddd; border-radius: 8px; padding: 30px; text-align: center; background-color: #f9f9f9; cursor: pointer; min-height: 200px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <input type="file" id="banner-image-file" accept="image/*" required style="display: none;">
                <div id="banner-upload-placeholder" style="display: block; text-align: center; width: 100%;">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <p style="margin-top: 15px; color: #666; font-size: 16px; font-weight: 500;">点击或拖拽文件到此处上传</p>
                  <p style="margin-top: 8px; color: #999; font-size: 14px;">支持图片文件</p>
                </div>
                <!-- 文件预览 -->
                <div id="banner-image-preview" style="display: none; width: 100%; height: 100%;">
                  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%;">
                    <img id="banner-preview-img" src="" style="max-width: 100%; max-height: 180px; border-radius: 4px;">
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button id="cancel-btn" class="btn btn-secondary">取消</button>
          <button id="save-btn" class="btn btn-primary">保存</button>
        </div>
      </div>
    </div>
  `;
  
  // 创建模态框元素
  const modalDiv = document.createElement('div');
  modalDiv.innerHTML = modalHTML;
  const modal = modalDiv.firstElementChild;
  
  // 添加到body
  if (modal) {
    document.body.appendChild(modal);
    
    // 绑定上传区域事件（只绑定一次）
    const uploadArea = modal.querySelector('#banner-upload-area');
    const imageFileInput = modal.querySelector('#banner-image-file');
    const imagePreview = modal.querySelector('#banner-image-preview');
    const previewImg = modal.querySelector('#banner-preview-img');
    const uploadPlaceholder = modal.querySelector('#banner-upload-placeholder');
    
    if (uploadArea && imageFileInput) {
      // 绑定上传区域点击事件
      uploadArea.addEventListener('click', (e) => {
        // 防止点击预览图时也触发文件选择
        if (!e.target.closest('#banner-image-preview')) {
          imageFileInput.click();
        }
      });
      
      // 绑定拖拽事件
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#667eea';
        uploadArea.style.backgroundColor = '#f0f4ff';
      });
      
      uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.backgroundColor = '#f9f9f9';
      });
      
      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.backgroundColor = '#f9f9f9';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          imageFileInput.files = files;
          // 触发change事件
          imageFileInput.dispatchEvent(new Event('change'));
        }
      });
      
      // 绑定文件选择事件
      imageFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (previewImg) {
              previewImg.src = e.target.result;
            }
            if (imagePreview) {
              imagePreview.style.display = 'block';
            }
            if (uploadPlaceholder) {
              uploadPlaceholder.style.display = 'none';
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  } else {
    console.error('模态框创建失败');
  }
}

// 加载站点列表
async function loadSites() {
  try {
    sites = await api.get('/admin/sites');
    const siteSelect = document.getElementById('site-select');
    
    // 清空选项
    siteSelect.innerHTML = '<option value="">选择站点</option>';
    
    // 添加站点选项
    sites.forEach(site => {
      const option = document.createElement('option');
      option.value = site.id;
      option.textContent = site.title;
      siteSelect.appendChild(option);
    });
    
    // 默认选择第一个站点（如果有站点）
    if (sites.length > 0) {
      siteSelect.value = sites[0].id;
      currentSiteId = sites[0].id;
      loadBanners(currentSiteId);
    }
  } catch (error) {
    console.error('获取站点列表失败:', error);
  }
}

// 加载轮播图列表
async function loadBanners(siteId) {
  const bannerList = document.getElementById('banner-list');
  
  if (!siteId) {
    bannerList.innerHTML = '<div style="text-align: center; padding: 40px;">请选择站点</div>';
    return;
  }
  
  bannerList.innerHTML = '<div style="text-align: center; padding: 40px;">加载中...</div>';
  
  try {
    const bannersData = await api.get('/admin/banners', { siteId });
    // 处理可能的空数据
    if (!bannersData) {
      banners = [];
      renderBannerList(banners);
      return;
    }
    // 将每个banner的id转换为字符串，避免数字精度问题
    banners = bannersData.map(banner => ({
      ...banner,
      id: String(banner.id)
    }));
    renderBannerList(banners);
  } catch (error) {
    console.error('获取轮播图列表失败:', error);
    bannerList.innerHTML = '<div style="text-align: center; padding: 40px; color: red;">获取轮播图列表失败，请刷新重试</div>';
  }
}

// 渲染轮播图列表
function renderBannerList(bannerList) {
  const container = document.getElementById('banner-list');
  
  if (!bannerList || bannerList.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">暂无轮播图，请添加</div>';
    return;
  }
  
  const html = `
    <table class="table">
      <thead>
        <tr>
          <th>标题</th>
          <th>描述</th>
          <th>图片</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${bannerList.map(banner => `
          <tr draggable="true" data-id="${String(banner.id)}" data-sort-order="${banner.sortOrder}">
            <td>${banner.title}</td>
            <td>${banner.description || '-'}</td>
            <td><img src="${banner.imageUrl}" style="width: 100px; height: auto; cursor: pointer;" onclick="previewBannerImage('${banner.imageUrl}', '${banner.title}')"></td>
            <td>
              <button class="btn btn-secondary edit-btn" data-id="${String(banner.id)}">编辑</button>
              <button class="btn btn-danger delete-btn" data-id="${String(banner.id)}">删除</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
  
  // 绑定编辑和删除按钮事件
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editBanner(btn.getAttribute('data-id')));
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteBanner(btn.getAttribute('data-id')));
  });
  
  // 绑定拖拽排序事件
  bindDragAndDropEvents();
}

// 绑定事件
function bindEvents() {
  // 站点选择变化
  const siteSelect = document.getElementById('site-select');
  if (siteSelect) {
    siteSelect.addEventListener('change', (e) => {
      currentSiteId = e.target.value;
      loadBanners(currentSiteId);
    });
  }
  
  // 添加轮播图按钮
  const addBannerBtn = document.getElementById('add-banner-btn');
  if (addBannerBtn) {
    addBannerBtn.addEventListener('click', () => {
      // 检查是否选择了站点
      if (!currentSiteId) {
        showError('请先选择站点');
        return;
      }
      openModal();
    });
  }
  
  // 点击模态框外部关闭 - 使用mousedown和mouseup事件组合避免误关闭
  let clickStartTarget = null;
  window.addEventListener('mousedown', (e) => {
    clickStartTarget = e.target;
  });
  window.addEventListener('mouseup', (e) => {
    const modal = document.getElementById('banner-modal');
    if (modal && clickStartTarget === modal && e.target === modal) {
      closeModal();
    }
    clickStartTarget = null;
  });
  
  // 使用事件委托处理模态框内的按钮点击
  const modal = document.getElementById('banner-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'close-modal' || e.target.id === 'cancel-btn') {
        closeModal();
      } else if (e.target.id === 'save-btn') {
        saveBanner();
      }
    });
  }
}

// 打开模态框
function openModal(banner = null) {
  const modal = document.getElementById('banner-modal');
  const modalTitle = document.getElementById('modal-title');
  const bannerForm = document.getElementById('banner-form');
  const imageFileInput = document.getElementById('banner-image-file');
  const imagePreview = document.getElementById('banner-image-preview');
  const previewImg = document.getElementById('banner-preview-img');
  
  // 检查模态框是否存在
  if (!modal) {
    console.error('模态框不存在');
    return;
  }
  
  // 清空文件选择和预览
  imageFileInput.value = '';
  imagePreview.style.display = 'none';
  previewImg.src = '';
  
  // 显示上传占位符
  const uploadPlaceholder = document.getElementById('banner-upload-placeholder');
  if (uploadPlaceholder) {
    uploadPlaceholder.style.display = 'block';
  }
  
  if (banner) {
    // 编辑模式
    if (modalTitle) {
      modalTitle.textContent = '编辑轮播图';
    }
    editingBanner = banner;
    
    const bannerIdInput = document.getElementById('banner-id');
    if (bannerIdInput) {
      bannerIdInput.value = banner.id;
    }
    
    const siteIdInput = document.getElementById('banner-site-id');
    if (siteIdInput) {
      siteIdInput.value = banner.siteId;
    }
    
    const titleInput = document.getElementById('banner-title');
    if (titleInput) {
      titleInput.value = banner.title;
    }
    
    const descriptionInput = document.getElementById('banner-description');
    if (descriptionInput) {
      descriptionInput.value = banner.description || '';
    }
    
    // 显示当前图片预览
    if (banner.imageUrl) {
      previewImg.src = banner.imageUrl;
      imagePreview.style.display = 'block';
      if (uploadPlaceholder) {
        uploadPlaceholder.style.display = 'none';
      }
    }
  } else {
    // 添加模式
    if (modalTitle) {
      modalTitle.textContent = '添加轮播图';
    }
    editingBanner = null;
    
    if (bannerForm) {
      bannerForm.reset();
    }
    
    const bannerIdInput = document.getElementById('banner-id');
    if (bannerIdInput) {
      bannerIdInput.value = '';
    }
    
    const siteIdInput = document.getElementById('banner-site-id');
    if (siteIdInput) {
      siteIdInput.value = currentSiteId;
    }
  }
  
  // 重置文件输入
  if (imageFileInput) {
    // 重置文件输入值
    imageFileInput.value = '';
  }
  
  // 重置预览
  if (!banner || !banner.imageUrl) {
    previewImg.src = '';
    imagePreview.style.display = 'none';
    if (uploadPlaceholder) {
      uploadPlaceholder.style.display = 'block';
    }
  }
  
  modal.style.display = 'flex';
  // 添加show类以触发动画
  modal.classList.add('show');
}

// 关闭模态框
function closeModal() {
  const modal = document.getElementById('banner-modal');
  if (modal) {
    // 移除show类
    modal.classList.remove('show');
    // 等待动画完成后再隐藏
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
  editingBanner = null;
}

// 保存轮播图
async function saveBanner() {
  const bannerForm = document.getElementById('banner-form');
  if (!bannerForm) {
    console.error('表单不存在');
    return;
  }
  
  const formData = new FormData(bannerForm);
  const imageFileInput = document.getElementById('banner-image-file');
  const imageFile = imageFileInput.files[0];
  
  try {
    let imageUrl = null;
    
    // 如果有选择新图片，先上传到 OSS
    if (imageFile) {
      // 显示上传提示
      const uploadTip = document.createElement('div');
      uploadTip.id = 'upload-tip';
      uploadTip.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #4CAF50; color: white; padding: 15px 20px; border-radius: 4px; z-index: 9999; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);';
      uploadTip.textContent = '正在上传图片...';
      document.body.appendChild(uploadTip);
      
      try {
        // 1. 压缩图片
        uploadTip.textContent = '正在压缩图片...';
        const compressedFile = await mediaHandler.compressImage(imageFile);
        
        // 2. 生成文件名
        const siteId = parseInt(formData.get('siteId'));
        const fileName = mediaHandler.generateFileName('banner', imageFile.name, siteId);
        
        // 3. 上传压缩后的图片
        uploadTip.textContent = '正在上传图片...';
        imageUrl = await ossClient.uploadFile(
          compressedFile,
          fileName,
          siteId
        );
        
        // 移除上传提示
        document.body.removeChild(uploadTip);
      } catch (uploadError) {
        // 移除上传提示
        if (document.getElementById('upload-tip')) {
          document.body.removeChild(document.getElementById('upload-tip'));
        }
        throw uploadError;
      }
    } else if (editingBanner && editingBanner.imageUrl) {
      // 编辑模式下，如果没有选择新图片，使用原有的图片 URL
      imageUrl = editingBanner.imageUrl;
    }
    
    // 如果没有图片 URL，提示错误
    if (!imageUrl) {
      showError('请选择 Banner 图片');
      return;
    }
    
    const bannerId = formData.get('id');
    
    // 计算排序值
    let sortOrder = 1;
    if (!bannerId) { // 新建轮播图
      if (banners && banners.length > 0) {
        // 按排序值降序排列，取第一个元素的排序值+1
        const maxSortOrder = Math.max(...banners.map(b => b.sortOrder));
        sortOrder = maxSortOrder + 1;
      }
    } else { // 编辑轮播图
      // 保持原排序值
      const banner = banners.find(b => String(b.id) === String(bannerId));
      if (banner) {
        sortOrder = banner.sortOrder;
      }
    }
    
    const bannerData = {
      siteId: formData.get('siteId'),
      title: formData.get('title'),
      description: formData.get('description') || null,
      imageUrl: imageUrl,
      sortOrder: sortOrder,
      exifInfo: null
    };
    

    
    if (bannerId) {
      // 更新轮播图

      await api.put('/admin/banners', {
        id: bannerId,
        ...bannerData
      });
    } else {
      // 创建轮播图

      await api.post('/admin/banners', bannerData);
    }
    
    closeModal();
    await loadBanners(currentSiteId);
  } catch (error) {
    console.error('保存失败:', error);
    showError('保存失败：' + (error.message || '未知错误'));
  }
}

// 编辑轮播图
function editBanner(id) {
  // 确保使用字符串比较，避免数字精度问题
  const banner = banners.find(b => String(b.id) === String(id));
  if (banner) {
    openModal(banner);
  }
}

// 删除轮播图
async function deleteBanner(id) {
  try {
    await showConfirm('确认删除', '确定要删除这个轮播图吗？');
    // 确保id作为字符串传递，避免精度丢失
    await api.delete(`/admin/banners/${id}`);
    await loadBanners(currentSiteId);
  } catch (error) {
    if (error !== false) {
      showError('删除失败: ' + (error.message || '未知错误'));
    }
  }
}

// 绑定拖拽排序事件
function bindDragAndDropEvents() {
  const bannerItems = document.querySelectorAll('tr[data-id]');
  let draggedItem = null;
  
  bannerItems.forEach(item => {
    // 开始拖拽
    item.addEventListener('dragstart', function(e) {
      draggedItem = this;
      this.style.opacity = '0.5';
    });
    
    // 结束拖拽
    item.addEventListener('dragend', function(e) {
      this.style.opacity = '1';
      draggedItem = null;
      // 恢复所有行的边框样式
      bannerItems.forEach(row => {
        row.style.border = 'none';
      });
    });
    
    // 拖拽经过
    item.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.style.border = '2px dashed #667eea';
    });
    
    // 拖拽离开
    item.addEventListener('dragleave', function(e) {
      this.style.border = 'none';
    });
    
    // 放置
    item.addEventListener('drop', async function(e) {
      e.preventDefault();
      this.style.border = 'none';
      
      if (draggedItem !== this) {
        const draggedId = draggedItem.getAttribute('data-id');
        const targetId = this.getAttribute('data-id');
        
        // 计算新的排序值
        const newSortOrder = parseInt(this.getAttribute('data-sort-order'));
        
        try {
          // 调用排序接口
          await api.put('/admin/banners/sort', {
            id: draggedId,
            newSortOrder: newSortOrder
          });
          // 重新加载轮播图列表
          await loadBanners(currentSiteId);
        } catch (error) {
          console.error('排序失败:', error);
          showError('排序失败: ' + (error.message || '未知错误'));
        }
      }
    });
  });
}

// 预览轮播图图片
function previewBannerImage(imageUrl, title) {
  // 检查预览模态框是否存在
  let previewModal = document.getElementById('banner-preview-modal');
  
  if (!previewModal) {
    // 创建预览模态框
    const modalHTML = `
      <div id="banner-preview-modal" class="modal" style="display: flex; z-index: 1000;">
        <div class="modal-content" style="width: 90%; max-width: 1000px; max-height: 90vh; overflow: auto;">
          <div class="modal-header">
            <h4 id="banner-preview-title">预览</h4>
            <button id="close-banner-preview" class="close-btn">&times;</button>
          </div>
          <div class="modal-body" style="display: flex; flex-direction: column; align-items: center; padding: 20px;">
            <div id="banner-preview-content"></div>
          </div>
        </div>
      </div>
    `;
    
    // 创建弹窗元素
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    previewModal = modalDiv.firstElementChild;
    
    // 添加到body
    document.body.appendChild(previewModal);
    
    // 绑定关闭按钮事件
    const closeBtn = previewModal.querySelector('#close-banner-preview');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        // 移除show类
        previewModal.classList.remove('show');
        // 等待动画完成后再隐藏
        setTimeout(() => {
          previewModal.style.display = 'none';
        }, 300);
      });
    }
    
    // 点击弹窗外部关闭 - 使用mousedown和mouseup事件组合避免误关闭
    let clickStartTarget = null;
    previewModal.addEventListener('mousedown', (e) => {
      clickStartTarget = e.target;
    });
    previewModal.addEventListener('mouseup', (e) => {
      if (clickStartTarget === previewModal && e.target === previewModal) {
        // 移除show类
        previewModal.classList.remove('show');
        // 等待动画完成后再隐藏
        setTimeout(() => {
          previewModal.style.display = 'none';
        }, 300);
      }
      clickStartTarget = null;
    });
  }
  
  // 填充预览内容
  const previewTitle = previewModal.querySelector('#banner-preview-title');
  const previewContent = previewModal.querySelector('#banner-preview-content');
  
  if (previewTitle) {
    previewTitle.textContent = title || '预览';
  }
  
  if (previewContent) {
    previewContent.innerHTML = `<img src="${imageUrl}" style="max-width: 100%; max-height: 70vh; object-fit: contain;">`;
  }
  
  // 显示模态框
  previewModal.style.display = 'flex';
  // 添加show类以触发动画
  previewModal.classList.add('show');
}

// 全局函数，供图片点击调用
window.previewBannerImage = previewBannerImage;

