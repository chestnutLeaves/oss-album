import { api, dateFormatter, showError, showSuccess, showConfirm } from '../utils.js';

// 标签管理页面
let tags = [];
let editingTag = null;

// 初始化页面
export async function init(contentBody) {
  // 渲染页面结构
  contentBody.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>标签管理</h3>
        <button id="add-tag-btn" class="btn btn-primary">添加标签</button>
      </div>
      <div id="tag-list">
        <div style="text-align: center; padding: 40px;">加载中...</div>
      </div>
    </div>
  `;
  
  // 创建模态框并添加到body
  createModal();
  
  // 加载标签列表
  await loadTags();
  
  // 绑定事件
  bindEvents();
}

// 创建模态框
function createModal() {
  // 只移除标签管理相关的模态框，避免影响其他功能
  const existingModal = document.getElementById('tag-modal');
  if (existingModal && existingModal.parentNode) {
    existingModal.parentNode.removeChild(existingModal);
  }
  
  const modalHTML = `
    <div id="tag-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h4 id="modal-title">添加标签</h4>
          <button id="close-modal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form id="tag-form" class="form">
            <input type="hidden" id="tag-id" name="id">
            <div class="form-row">
              <label for="tag-name">标签名称</label>
              <input type="text" id="tag-name" name="name" required>
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
    saveBtn.addEventListener('click', saveTag);
  }
  

}

// 加载标签列表
async function loadTags() {
  const tagList = document.getElementById('tag-list');
  
  try {
    const tagsData = await api.get('/admin/tags');
    
    // 确保tagsData是数组
    if (!Array.isArray(tagsData)) {
      tagList.innerHTML = '<div style="text-align: center; padding: 40px; color: red;">标签数据格式错误</div>';
      return;
    }
    
    // 将每个tag的id转换为字符串，避免数字精度问题
    tags = tagsData.map(tag => ({
      ...tag,
      id: String(tag.id)
    }));
    
    renderTagList(tags);
  } catch (error) {
    tagList.innerHTML = '<div style="text-align: center; padding: 40px; color: red;">获取标签列表失败，请刷新重试</div>';
  }
}

// 渲染标签列表
function renderTagList(tags) {
  const container = document.getElementById('tag-list');
  

  
  if (!tags || tags.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px;">暂无标签，请添加</div>';
    return;
  }
  
  const html = `
    <table class="table">
      <thead>
        <tr>
          <th>标签名称</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${tags.map(tag => `
          <tr draggable="true" data-id="${String(tag.id)}" data-sort-order="${tag.sortOrder}">
            <td>${tag.name}</td>
            <td>${dateFormatter.format(tag.createTime)}</td>
            <td>
              <button class="btn btn-secondary edit-btn" data-id="${String(tag.id)}">编辑</button>
              <button class="btn btn-danger delete-btn" data-id="${String(tag.id)}">删除</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;

  
  // 绑定编辑和删除按钮事件
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editTag(btn.getAttribute('data-id')));
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteTag(btn.getAttribute('data-id')));
  });
  
  // 绑定拖拽排序事件
  bindDragAndDropEvents();


}

// 绑定事件
function bindEvents() {
  // 添加标签按钮
  const addTagBtn = document.getElementById('add-tag-btn');
  if (addTagBtn) {
    addTagBtn.addEventListener('click', () => openModal());
  }
  
  // 点击模态框外部关闭
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('tag-modal');
    if (modal && e.target === modal) {
      closeModal();
    }
  });
  
  // 模态框事件在createModal函数中已通过bindModalEvents绑定
}

// 打开模态框
function openModal(tag = null) {
  // 明确获取标签管理的模态框
  const modal = document.getElementById('tag-modal');
  
  // 检查模态框是否存在
  if (!modal) {
    console.error('模态框不存在');
    return;
  }
  
  // 在模态框容器内查询标题元素，避免选择到其他模态框的标题
  const modalTitle = modal.querySelector('#modal-title');
  const tagForm = modal.querySelector('#tag-form');
  

  
  if (tag) {
    // 编辑模式

    if (modalTitle) {
      // 直接操作DOM，确保标题被正确设置
      modalTitle.innerHTML = '编辑标签';

      
      // 强制重绘，确保渲染更新
      modalTitle.style.visibility = 'hidden';
      void modalTitle.offsetWidth; // 触发重绘
      modalTitle.style.visibility = 'visible';
    } else {
      console.error('模态框标题元素不存在');
    }
    editingTag = tag;
    
    // 在模态框容器内查询表单元素
    const tagIdInput = modal.querySelector('#tag-id');
    if (tagIdInput) {
      tagIdInput.value = tag.id;

    }
    
    const nameInput = modal.querySelector('#tag-name');
    if (nameInput) {
      nameInput.value = tag.name;

    }
  } else {
    // 添加模式

    if (modalTitle) {
      modalTitle.innerHTML = '添加标签';

      
      // 强制重绘，确保渲染更新
      modalTitle.style.visibility = 'hidden';
      void modalTitle.offsetWidth; // 触发重绘
      modalTitle.style.visibility = 'visible';
    } else {
      console.error('模态框标题元素不存在');
    }
    editingTag = null;
    
    if (tagForm) {
      tagForm.reset();
    }
    
    // 在模态框容器内查询表单元素
    const tagIdInput = modal.querySelector('#tag-id');
    if (tagIdInput) {
      tagIdInput.value = '';
    }
  }
  
  // 强制显示模态框
  modal.style.display = 'flex';
  // 添加show类以触发动画
  modal.classList.add('show');

  
  // 打印当前页面上的模态框数量
  const modalCount = document.querySelectorAll('.modal').length;

  
  // 打印当前模态框的标题
  if (modalTitle) {

  }
}

// 关闭模态框
function closeModal() {
  const modal = document.getElementById('tag-modal');
  if (modal) {
    // 移除show类
    modal.classList.remove('show');
    // 等待动画完成后再隐藏
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
  editingTag = null;
}

// 保存标签
async function saveTag() {
  const tagForm = document.getElementById('tag-form');
  if (!tagForm) {
    console.error('表单不存在');
    return;
  }
  
  const formData = new FormData(tagForm);
  
  const tagData = {
    name: formData.get('name')
  };
  
  const tagId = formData.get('id');
  
  try {
    if (tagId) {
      // 更新标签
      await api.put('/admin/tags', {
        id: tagId,
        ...tagData
      });
    } else {
      // 创建标签
      // 计算排序值
      let sortOrder = 1;
      if (tags.length > 0) {
        // 找到最大的排序值
        const maxSortOrder = Math.max(...tags.map(tag => tag.sortOrder || 0));
        sortOrder = maxSortOrder + 1;
      }
      await api.post('/admin/tags', {
        ...tagData,
        sortOrder
      });
    }
    
    closeModal();
    await loadTags();
  } catch (error) {
    showError('保存失败: ' + (error.message || '未知错误'));
  }
}

// 编辑标签
function editTag(id) {
  // 确保使用字符串比较，避免数字精度问题
  // 尝试直接使用id查找，不进行类型转换
  const tag = tags.find(t => t.id === id);
  // 如果没找到，尝试使用字符串比较
  if (!tag) {
    const tagByString = tags.find(t => String(t.id) === String(id));
    if (tagByString) {
      openModal(tagByString);
    } else {
      console.error('未找到标签，ID:', id);
    }
  } else {
    openModal(tag);
  }
}

// 删除标签
async function deleteTag(id) {
  try {
    await showConfirm('确认删除', '确定要删除这个标签吗？');
    await api.delete(`/admin/tags/${id}`);
    await loadTags();
  } catch (error) {
    if (error !== false) {
      showError('删除失败: ' + (error.message || '未知错误'));
    }
  }
}

// 绑定拖拽排序事件
let draggedItem = null;
function bindDragAndDropEvents() {
  const tagItems = document.querySelectorAll('#tag-list tr[draggable="true"]');
  
  tagItems.forEach(item => {
    // 开始拖拽
    item.addEventListener('dragstart', function(e) {
      draggedItem = this;
      this.style.opacity = '0.5';
      e.dataTransfer.effectAllowed = 'move';
    });
    
    // 结束拖拽
    item.addEventListener('dragend', function(e) {
      this.style.opacity = '1';
      draggedItem = null;
      // 恢复所有行的边框样式
      tagItems.forEach(row => {
        row.style.border = 'none';
      });
    });
    
    // 拖拽经过
    item.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      this.style.border = '2px dashed var(--primary)';
    });
    
    // 拖拽离开
    item.addEventListener('dragleave', function(e) {
      this.style.border = 'none';
    });
    
    // 放置
    item.addEventListener('drop', function(e) {
      e.preventDefault();
      this.style.border = 'none';
      
      if (draggedItem !== this) {
        // 计算新的排序位置
        const draggedId = draggedItem.getAttribute('data-id');
        const targetId = this.getAttribute('data-id');
        
        // 获取当前所有标签行
        const allItems = Array.from(document.querySelectorAll('#tag-list tr[draggable="true"]'));
        const draggedIndex = allItems.indexOf(draggedItem);
        const targetIndex = allItems.indexOf(this);
        
        // 调用排序API
        // 注意：排序值从1开始，所以需要将索引加1
        updateTagSort(draggedId, targetIndex + 1);
      }
    });
  });
}

// 更新标签排序
async function updateTagSort(tagId, newSortOrder) {
  try {
    await api.put('/admin/tags/sort', {
      id: tagId,
      newSortOrder
    });
    // 重新加载标签列表
    await loadTags();
  } catch (error) {
    showError('排序失败: ' + (error.message || '未知错误'));
  }
}

