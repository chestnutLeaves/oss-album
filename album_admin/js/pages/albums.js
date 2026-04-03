import { api, dateFormatter, showError, showSuccess, showConfirm } from '../utils.js';
import { loadMediaManagement, openUploadModal, closeUploadModal, loadMediaList, handleMediaUpload, editMedia, deleteMedia, setCurrentSiteId } from './media.js';

// 相册管理页面
let albums = [];
let editingAlbum = null;
let currentSiteId = null;
let sites = [];

// 初始化页面
export async function init(contentBody) {
  // 渲染页面结构
  contentBody.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>相册管理</h3>
        <div>
          <select id="site-select" class="form-control" style="display: inline-block; width: 220px; height: 36px; font-size: 14px; padding: 0 12px; border: 1px solid #ddd; border-radius: 4px; margin-right: 10px; transition: all 0.3s ease;">
            <option value="">选择站点</option>
          </select>
          <button id="add-album-btn" class="btn btn-primary">添加相册</button>
        </div>
      </div>
      <div id="album-list">
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
  // 只移除相册相关的模态框，避免影响其他功能
  const existingModal = document.getElementById('album-modal');
  if (existingModal && existingModal.parentNode) {
    existingModal.parentNode.removeChild(existingModal);
  }
  
  const modalHTML = `
    <div id="album-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h4 id="modal-title">添加相册</h4>
          <button id="close-modal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form id="album-form" class="form">
            <input type="hidden" id="album-id" name="id">
            <input type="hidden" id="album-site-id" name="siteId">
            <div class="form-row">
              <label for="album-title">标题</label>
              <input type="text" id="album-title" name="title" required>
            </div>
            <div class="form-row">
              <label for="album-year">年份</label>
              <input type="number" id="album-year" name="year" min="2000" max="2100">
            </div>
            <div class="form-row">
              <label for="album-description">描述</label>
              <textarea id="album-description" name="description"></textarea>
            </div>
            <div class="form-row">
              <label for="album-oss-prefix">OSS路径前缀</label>
              <input type="text" id="album-oss-prefix" name="ossPrefix">
            </div>
            <div class="form-row">
              <label for="album-need-password">需要密码</label>
              <select id="album-need-password" name="needPassword">
                <option value="0">否</option>
                <option value="1">是</option>
              </select>
            </div>
            <div class="form-row" id="password-row">
              <label for="album-password">密码</label>
              <input type="text" id="album-password" name="password">
            </div>

          </form>
        </div>
        <div class="modal-footer">
          <button id="cancel-btn" class="btn btn-secondary">取消</button>
          <button id="save-btn" class="btn btn-primary">保存</button>
        </div>
      </div>
    </div>
  `
  
  // 创建模态框元素
  const modalDiv = document.createElement('div');
  modalDiv.innerHTML = modalHTML;
  const modal = modalDiv.firstElementChild;
  
  // 添加到body
  if (modal) {
    document.body.appendChild(modal);
    // 绑定模态框事件
    bindModalEvents(modal);
  } else {
    console.error('模态框创建失败');
  }
}

// 绑定模态框事件
function bindModalEvents(modalInstance) {
  // 绑定关闭按钮事件
  const closeBtn = modalInstance.querySelector('#close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  
  // 绑定取消按钮事件
  const cancelBtn = modalInstance.querySelector('#cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }
  
  // 绑定保存按钮事件
  const saveBtn = modalInstance.querySelector('#save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveAlbum);
  }
  
  // 绑定密码选择变化事件
  const needPasswordSelect = modalInstance.querySelector('#album-need-password');
  if (needPasswordSelect) {
    needPasswordSelect.addEventListener('change', (e) => {
      const passwordRow = modalInstance.querySelector('#password-row');
      if (passwordRow) {
        passwordRow.style.display = e.target.value === '1' ? 'block' : 'none';
      }
    });
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
      loadAlbums(currentSiteId);
    }
  } catch (error) {
    console.error('获取站点列表失败:', error);
  }
}

// 加载相册列表
async function loadAlbums(siteId) {
  const albumList = document.getElementById('album-list');
  
  if (!siteId) {
    albumList.innerHTML = '<div style="text-align: center; padding: 40px;">请选择站点</div>';
    return;
  }
  
  albumList.innerHTML = '<div style="text-align: center; padding: 40px;">加载中...</div>';
  
  try {
    albums = await api.get('/admin/albums', { siteId });
    renderAlbumList(albums);
  } catch (error) {
    console.error('获取相册列表失败:', error);
    albumList.innerHTML = '<div style="text-align: center; padding: 40px; color: red;">获取相册列表失败，请刷新重试</div>';
  }
}

// 渲染相册列表
function renderAlbumList(albumList) {
  const container = document.getElementById('album-list');
  
  if (!albumList || albumList.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">暂无相册，请添加</div>';
    return;
  }
  
  const html = `
    <table class="table">
      <thead>
        <tr>
          <th>标题</th>
          <th>年份</th>
          <th>是否加密</th>
          <th>排序</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${albumList.map(album => `
          <tr draggable="true" data-id="${String(album.id)}" data-sort-order="${album.sortOrder}">
            <td>${album.title}</td>
            <td>${album.year || '-'}</td>
            <td>${album.needPassword === 1 ? '是' : '否'}</td>
            <td>${album.sortOrder}</td>
            <td>${dateFormatter.format(album.createTime)}</td>
            <td>
              <button class="btn btn-primary manage-files-btn" data-id="${album.id}" data-title="${album.title}">管理文件</button>
              <button class="btn btn-secondary edit-btn" data-id="${album.id}">编辑</button>
              <button class="btn btn-danger delete-btn" data-id="${album.id}">删除</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
  
  // 绑定按钮事件
  document.querySelectorAll('.manage-files-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const albumId = btn.getAttribute('data-id');
      const albumTitle = btn.getAttribute('data-title');
      manageFiles(albumId, albumTitle);
    });
  });
  
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editAlbum(btn.getAttribute('data-id')));
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteAlbum(btn.getAttribute('data-id')));
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
      loadAlbums(currentSiteId);
    });
  }
  
  // 添加相册按钮
  const addAlbumBtn = document.getElementById('add-album-btn');
  if (addAlbumBtn) {
    addAlbumBtn.addEventListener('click', () => openModal());
  }
  
  // 点击模态框外部关闭
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('album-modal');
    if (modal && e.target === modal) {
      closeModal();
    }
  });
}

// 打开模态框
function openModal(album = null) {
  const modal = document.getElementById('album-modal');
  const modalTitle = document.getElementById('modal-title');
  const albumForm = document.getElementById('album-form');
  
  // 检查模态框是否存在
  if (!modal) {
    console.error('模态框不存在');
    return;
  }
  
  if (album) {
    // 编辑模式
    if (modalTitle) {
      modalTitle.textContent = '编辑相册';
    }
    editingAlbum = album;
    
    const albumIdInput = document.getElementById('album-id');
    if (albumIdInput) {
      albumIdInput.value = album.id;
    }
    
    const siteIdInput = document.getElementById('album-site-id');
    if (siteIdInput) {
      siteIdInput.value = album.siteId;
    }
    
    const titleInput = document.getElementById('album-title');
    if (titleInput) {
      titleInput.value = album.title;
    }
    
    const yearInput = document.getElementById('album-year');
    if (yearInput) {
      yearInput.value = album.year || '';
    }
    
    const descriptionInput = document.getElementById('album-description');
    if (descriptionInput) {
      descriptionInput.value = album.description || '';
    }
    
    const ossPrefixInput = document.getElementById('album-oss-prefix');
    if (ossPrefixInput) {
      ossPrefixInput.value = album.ossPrefix || '';
    }
    
    const needPasswordSelect = document.getElementById('album-need-password');
    if (needPasswordSelect) {
      needPasswordSelect.value = album.needPassword;
    }
    
    const passwordInput = document.getElementById('album-password');
    if (passwordInput) {
      passwordInput.value = album.password || '';
    }
    

  } else {
    // 添加模式
    if (modalTitle) {
      modalTitle.textContent = '添加相册';
    }
    editingAlbum = null;
    
    if (albumForm) {
      albumForm.reset();
    }
    
    const albumIdInput = document.getElementById('album-id');
    if (albumIdInput) {
      albumIdInput.value = '';
    }
    
    const siteIdInput = document.getElementById('album-site-id');
    if (siteIdInput) {
      siteIdInput.value = currentSiteId;
    }
    
    // 默认填充当前年份
    const yearInput = document.getElementById('album-year');
    if (yearInput) {
      const currentYear = new Date().getFullYear();
      yearInput.value = currentYear;
    }
    

    
    const needPasswordSelect = document.getElementById('album-need-password');
    if (needPasswordSelect) {
      needPasswordSelect.value = 0;
    }
  }
  
  // 显示或隐藏密码输入框
  const passwordRow = document.getElementById('password-row');
  const needPasswordSelect = document.getElementById('album-need-password');
  if (passwordRow && needPasswordSelect) {
    const needPassword = needPasswordSelect.value;
    passwordRow.style.display = needPassword === '1' ? 'block' : 'none';
  }
  
  // 初始化OSS前缀路径
  updateOssPrefix();
  
  // 绑定年份和标题输入事件，同步更新OSS前缀路径
  const yearInput = document.getElementById('album-year');
  const titleInput = document.getElementById('album-title');
  if (yearInput && titleInput) {
    yearInput.addEventListener('input', updateOssPrefix);
    titleInput.addEventListener('input', updateOssPrefix);
  }
  
  modal.style.display = 'flex';
  // 添加show类以触发动画
  modal.classList.add('show');
}

// 更新OSS前缀路径
function updateOssPrefix() {
  const yearInput = document.getElementById('album-year');
  const titleInput = document.getElementById('album-title');
  const ossPrefixInput = document.getElementById('album-oss-prefix');
  
  if (yearInput && titleInput && ossPrefixInput) {
    const year = yearInput.value;
    const title = titleInput.value;
    
    if (year && title) {
      // 生成OSS前缀路径
      const ossPrefix = `/album/${year}/${title}`;
      ossPrefixInput.value = ossPrefix;
    }
  }
}

// 关闭模态框
function closeModal() {
  const modal = document.getElementById('album-modal');
  if (modal) {
    // 移除show类
    modal.classList.remove('show');
    // 等待动画完成后再隐藏
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
  editingAlbum = null;
}

// 保存相册
async function saveAlbum() {
  const albumForm = document.getElementById('album-form');
  if (!albumForm) {
    console.error('表单不存在');
    return;
  }
  
  const formData = new FormData(albumForm);
  
  const albumId = formData.get('id');
  
  // 计算排序值
  let sortOrder;
  if (albumId) {
    // 编辑模式，保持原排序值
    const album = albums.find(a => a.id == albumId);
    sortOrder = album ? album.sortOrder : 1;
  } else {
    // 新建模式，使用列表最后一个元素的排序值+1
    if (albums.length > 0) {
      const lastAlbum = albums[albums.length - 1];
      sortOrder = (lastAlbum.sortOrder || 0) + 1;
    } else {
      sortOrder = 1;
    }
  }
  
  const albumData = {
    siteId: formData.get('siteId'),
    title: formData.get('title'),
    year: formData.get('year') || null,
    description: formData.get('description') || null,
    ossPrefix: formData.get('ossPrefix') || null,
    needPassword: parseInt(formData.get('needPassword')),
    password: formData.get('password') || null,
    sortOrder: sortOrder
  };
  
  try {
    if (albumId) {
      // 更新相册
      await api.put('/admin/albums', {
        id: albumId,
        ...albumData
      });
    } else {
      // 创建相册
      await api.post('/admin/albums', albumData);
    }
    
    closeModal();
    await loadAlbums(currentSiteId);
  } catch (error) {
    showError('保存失败: ' + (error.message || '未知错误'));
  }
}

// 编辑相册
function editAlbum(id) {
  const album = albums.find(a => a.id == id);
  if (album) {
    openModal(album);
  }
}

// 删除相册
async function deleteAlbum(id) {
  try {
    await showConfirm('确认删除', '确定要删除这个相册吗？');
    await api.delete(`/admin/albums/${id}`);
    await loadAlbums(currentSiteId);
  } catch (error) {
    if (error !== false) {
      showError('删除失败: ' + (error.message || '未知错误'));
    }
  }
}

// 管理文件
function manageFiles(albumId, albumTitle) {
  // 这里可以跳转到媒体管理页面，或者在当前页面加载媒体管理内容
  // 由于我们移除了媒体管理菜单，这里直接在当前页面加载媒体管理功能
  // 设置当前站点ID
  setCurrentSiteId(currentSiteId);
  // 调用媒体管理功能
  loadMediaManagement(albumId, albumTitle);
}

// 绑定拖拽排序事件
let draggedItem = null;
function bindDragAndDropEvents() {
  const albumItems = document.querySelectorAll('#album-list tr[draggable="true"]');
  
  albumItems.forEach(item => {
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
      albumItems.forEach(row => {
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
          await api.put('/admin/albums/sort', { id: draggedId, newSortOrder }, { siteId: currentSiteId });
          // 重新加载相册列表
          await loadAlbums(currentSiteId);
        } catch (error) {
          console.error('排序失败:', error);
          showError('排序失败: ' + (error.message || '未知错误'));
        }
      }
    });
  });
}

