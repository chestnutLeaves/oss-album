import { api, dateFormatter, showError, showSuccess } from '../utils.js';

// 站点管理页面
let sites = [];
let editingSite = null;

// 初始化页面
export async function init(contentBody) {
  // 渲染页面结构
  contentBody.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>站点管理</h3>
      </div>
      <div id="site-list">
        <div style="text-align: center; padding: 40px;">加载中...</div>
      </div>
    </div>
  `;
  
  // 创建模态框并添加到 body
  createModal();
  
  // 加载站点列表
  await loadSites();
  
  // 绑定事件
  bindEvents();
}

// 创建模态框
function createModal() {
  // 检查模态框是否已存在
  if (document.getElementById('site-modal')) {
    return;
  }
  
  const modalHTML = `
    <div id="site-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h4 id="modal-title">添加站点</h4>
          <button id="close-modal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form id="site-form" class="form">
            <input type="hidden" id="site-id" name="site-id">
            <div class="form-row">
              <label for="site-domain">域名</label>
              <input type="text" id="site-domain" name="domain" required>
            </div>
            <div class="form-row">
              <label for="site-title">标题</label>
              <input type="text" id="site-title" name="title" required>
            </div>
            <div class="form-row">
              <label for="site-admin-url">管理页面</label>
              <input type="text" id="site-admin-url" name="adminUrl">
            </div>
            <div class="form-row">
              <label for="site-description">描述</label>
              <textarea id="site-description" name="description"></textarea>
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

  } else {
    console.error('模态框创建失败');
  }
}

// 加载站点列表
async function loadSites() {
  const siteList = document.getElementById('site-list');
  
  try {
    sites = await api.get('/admin/sites');
    renderSiteList(sites);
  } catch (error) {
    console.error('获取站点列表失败:', error);
    siteList.innerHTML = '<div style="text-align: center; padding: 40px; color: red;">获取站点列表失败，请刷新重试</div>';
  }
}

// 渲染站点列表
function renderSiteList(siteList) {
  const container = document.getElementById('site-list');
  
  if (!siteList || siteList.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">暂无站点，请添加</div>';
    return;
  }
  
  const html = `
    <table class="table">
      <thead>
        <tr>
          <th>域名</th>
          <th>标题</th>
          <th>管理页面</th>
          <th>描述</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${siteList.map(site => `
          <tr>
            <td>${site.domain}</td>
            <td>${site.title}</td>
            <td>${site.adminUrl || '-'}</td>
            <td>${site.description || '-'}</td>
            <td>${dateFormatter.format(site.createTime)}</td>
            <td>
              <button class="btn btn-secondary edit-btn" data-id="${site.id}">编辑</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
  
  // 绑定编辑按钮事件
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editSite(btn.getAttribute('data-id')));
  });
}

// 绑定事件
function bindEvents() {
  // 关闭模态框
  const closeModalBtn = document.getElementById('close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  
  const cancelBtn = document.getElementById('cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }
  
  // 保存站点
  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveSite);
  }
  
  // 点击模态框外部关闭
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('site-modal');
    if (modal && e.target === modal) {
      closeModal();
    }
  });
  
  // 使用事件委托处理关闭按钮点击
  const modal = document.getElementById('site-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'close-modal' || e.target.id === 'cancel-btn') {
        closeModal();
      }
    });
  }
}

// 打开模态框（仅用于编辑）
function openModal(site) {
  const modal = document.getElementById('site-modal');
  const modalTitle = document.getElementById('modal-title');
  const siteForm = document.getElementById('site-form');
  
  // 检查模态框是否存在
  if (!modal) {
    console.error('模态框不存在');
    return;
  }
  
  // 编辑模式
  if (modalTitle) {
    modalTitle.textContent = '编辑站点';
  }
  editingSite = site;
  
  const siteIdInput = document.getElementById('site-id');
  if (siteIdInput) {
    siteIdInput.value = site.id;
  }
  
  const domainInput = document.getElementById('site-domain');
  if (domainInput) {
    domainInput.value = site.domain;
  }
  
  const titleInput = document.getElementById('site-title');
  if (titleInput) {
    titleInput.value = site.title;
  }
  
  const descriptionInput = document.getElementById('site-description');
  if (descriptionInput) {
    descriptionInput.value = site.description || '';
  }
  
  const adminUrlInput = document.getElementById('site-admin-url');
  if (adminUrlInput) {
    adminUrlInput.value = site.adminUrl || '';
  }

  modal.style.display = 'flex';
  // 添加show类以触发动画
  modal.classList.add('show');
}

// 关闭模态框
function closeModal() {
  const modal = document.getElementById('site-modal');
  if (modal) {
    // 移除show类
    modal.classList.remove('show');
    // 等待动画完成后再隐藏
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
  editingSite = null;
}

// 保存站点
async function saveSite() {
  const siteForm = document.getElementById('site-form');
  if (!siteForm) {
    console.error('表单不存在');
    return;
  }
  
  const formData = new FormData(siteForm);
  
  const siteData = {
    domain: formData.get('domain'),
    title: formData.get('title'),
    adminUrl: formData.get('adminUrl'),
    description: formData.get('description')
  };
  
  const siteId = formData.get('site-id');
  
  try {
    // 更新站点
    await api.put('/admin/sites', {
      id: siteId,
      ...siteData
    });
    
    closeModal();
    await loadSites();
  } catch (error) {
    showError('保存失败：' + (error.message || '未知错误'));
  }
}

// 编辑站点
function editSite(id) {
  const site = sites.find(s => s.id == id);
  if (site) {
    openModal(site);
  }
}

// 删除站点
async function deleteSite(id) {
  if (confirm('确定要删除这个站点吗？')) {
    try {
      await api.delete(`/admin/sites/${id}`);
      await loadSites();
    } catch (error) {
      showError('删除失败: ' + (error.message || '未知错误'));
    }
  }
}

