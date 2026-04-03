import { api, showError, showSuccess, showConfirm } from '../utils.js';
import { ossClient } from '../oss-client.js';
import { mediaHandler } from '../media-handler.js';

// 媒体管理页面
let mediaDataMap = {};

// 初始化媒体管理页面
export async function loadMediaManagement(albumId, albumTitle, ossPrefix, contentBody) {
  // 如果没有提供 contentBody，尝试从全局获取
  if (!contentBody) {
    contentBody = document.getElementById('content-body');
  }
  contentBody.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>媒体管理 - ${albumTitle}</h3>
        <div>
          <button id="back-to-albums" class="btn btn-secondary" style="margin-right: 10px;">返回相册管理</button>
          <button id="upload-media-btn" class="btn btn-primary">上传文件</button>
        </div>
      </div>
      <div id="upload-progress-container" style="display: none; margin: 20px 0; padding: 15px; border: 1px solid #e0e0e0; border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span id="upload-filename">上传中...</span>
          <span id="upload-percentage">0%</span>
        </div>
        <div style="height: 8px; background-color: #f5f5f5; border-radius: 4px; overflow: hidden;">
          <div id="upload-progress-bar" style="height: 100%; background: linear-gradient(90deg, #4CAF50, #45a049); width: 0%; transition: width 0.3s;"></div>
        </div>
      </div>
      <div id="media-list">
        <div style="text-align: center; padding: 40px;">加载中...</div>
      </div>
    </div>
  `;
  
  // 创建上传弹窗
  createUploadModal();
  
  // 绑定返回按钮事件
  document.getElementById('back-to-albums').addEventListener('click', () => {
    // 这里需要导入相册管理的init函数
    import('./albums.js').then(module => {
      module.init(contentBody);
    });
  });
  
  // 绑定上传按钮事件
  document.getElementById('upload-media-btn').addEventListener('click', () => {
    openUploadModal(albumId, currentSiteId, ossPrefix);
  });
  
  // 加载媒体列表
  await loadMediaList(albumId);
}

// 创建上传弹窗
function createUploadModal() {
  // 检查弹窗是否已存在
  if (document.getElementById('upload-modal')) {
    // 如果上传弹窗已存在，确保添加标签弹窗也存在
    if (!document.getElementById('add-tag-modal')) {
      // 只创建添加标签弹窗
      const addTagModalHTML = `
        <!-- 添加标签弹窗 -->
        <div id="add-tag-modal" class="modal" style="display: none;">
          <div class="modal-content" style="width: 400px;">
            <div class="modal-header">
              <h4>添加新标签</h4>
              <button id="close-add-tag-modal" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
              <form id="add-tag-form">
                <div class="form-row">
                  <label for="new-tag-name">标签名称</label>
                  <input type="text" id="new-tag-name" required>
                </div>
                <div class="form-row">
                  <label for="new-tag-sort">排序值</label>
                  <input type="number" id="new-tag-sort" value="1" min="1">
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button id="cancel-add-tag-btn" class="btn btn-secondary">取消</button>
              <button id="save-tag-btn" class="btn btn-primary">保存</button>
            </div>
          </div>
        </div>
      `;
      const modalDiv = document.createElement('div');
      modalDiv.innerHTML = addTagModalHTML;
      const addTagModal = modalDiv.querySelector('#add-tag-modal');
      if (addTagModal) {
        document.body.appendChild(addTagModal);
      }
    }
    // 绑定添加标签弹窗事件
    bindAddTagModalEvents();
    return;
  }
  
  const modalHTML = `
    <div id="upload-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); justify-content: center; align-items: center; z-index: 999;">
      <div class="modal-content" style="width: 80%; max-width: 900px; max-height: 95vh; min-height: 600px; display: flex; flex-direction: column; background-color: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); position: relative;">
        <div class="modal-header">
          <h4 id="upload-modal-title">上传文件</h4>
          <button id="close-upload-modal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body" style="flex: 1; display: flex; gap: 20px; align-items: flex-start; overflow-y: auto;">
          <!-- 左侧上传和预览区域 -->
          <div style="flex: 1; min-width: 400px;">
            <div id="upload-area" style="border: 2px dashed #ddd; border-radius: 8px; padding: 30px; text-align: center; background-color: #f9f9f9; cursor: pointer; min-height: 450px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
              <input type="file" id="file-input" accept="image/*,video/*" multiple style="display: none;">
              <div id="upload-placeholder" style="display: block; text-align: center; width: 100%;">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <p style="margin-top: 20px; color: #666; font-size: 18px; font-weight: 500;">点击或拖拽文件到此处上传</p>
                <p style="margin-top: 10px; color: #999; font-size: 14px;">支持图片和视频文件</p>
              </div>
              <!-- 文件预览 -->
              <div id="file-preview-container" style="display: none; width: 100%; height: 100%;">
                <div id="file-preview" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%;"></div>
              </div>
            </div>
          </div>
          
          <!-- 右侧字段区域 -->
          <div style="flex: 1; min-width: 350px;">
            <form id="upload-form" class="form">
              <input type="hidden" id="upload-album-id">
              <input type="hidden" id="upload-album-oss-prefix">
              
              <!-- 拍摄时间和设为封面 -->
              <div style="width: 100%; margin-bottom: 15px;">
                <div style="display: flex; gap: 20px;">
                  <!-- 拍摄时间部分 -->
                  <div style="flex: 1;">
                    <label for="media-shoot-time" style="display: block; margin-bottom: 5px;">拍摄时间</label>
                    <input type="datetime-local" id="media-shoot-time" name="shootTime" style="width: 200px; height: 32px; font-size: 14px; padding: 0 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                  </div>
                  <!-- 设为封面部分 -->
                  <div id="cover-toggle-container" style="flex-shrink: 0; display: flex; flex-direction: column; justify-content: flex-start;">
                    <label for="media-is-cover" style="display: block; margin-bottom: 5px; white-space: nowrap;">设为封面</label>
                    <div style="display: flex; align-items: center;">
                      <div class="toggle-switch" style="position: relative; width: 40px; height: 20px;">
                        <input type="checkbox" id="media-is-cover" name="isCover" value="1" style="opacity: 0; width: 0; height: 0;">
                        <span class="toggle-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 20px;"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 描述 -->
              <div class="form-row">
                <label for="media-description">描述</label>
                <textarea id="media-description" name="description" rows="4"></textarea>
              </div>
              <style>
                .toggle-switch input:checked + .toggle-slider {
                  background-color: #4CAF50 !important;
                }
                .toggle-switch input:checked + .toggle-slider:before {
                  transform: translateX(20px) !important;
                }
                .toggle-slider:before {
                  position: absolute;
                  content: "";
                  height: 14px;
                  width: 14px;
                  left: 3px;
                  bottom: 3px;
                  background-color: white;
                  transition: .4s;
                  border-radius: 50%;
                }
              </style>
              <style>
                /* 编辑模态框中的开关样式 */
                #edit-media-modal .toggle-switch input:checked + .toggle-slider {
                  background-color: #4CAF50 !important;
                }
                #edit-media-modal .toggle-switch input:checked + .toggle-slider:before {
                  transform: translateX(20px) !important;
                }
                #edit-media-modal .toggle-slider:before {
                  position: absolute;
                  content: "";
                  height: 14px;
                  width: 14px;
                  left: 3px;
                  bottom: 3px;
                  background-color: white;
                  transition: .4s;
                  border-radius: 50%;
                }
              </style>
              
              <!-- 标签选择 -->
              <div class="form-row">
                <label>标签</label>
                <div style="position: relative; max-height: 300px;">
                  <input type="text" id="tag-search" placeholder="搜索标签..." style="width: 100%; padding: 8px; box-sizing: border-box;">
                  <div id="selected-tags" style="margin-top: 10px; display: flex; flex-wrap: gap: 5px;"></div>
                  <div id="tag-list" style="max-height: 150px; overflow-y: auto; border: 1px solid #ddd; border-top: none; display: none; position: absolute; width: 100%; background: white; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.15); top: 36px; left: 0; margin-top: 2px; box-sizing: border-box;"></div>
                </div>
              </div>
            </form>
          </div>
        </div>
        <div class="modal-footer" style="padding: 20px; border-top: 1px solid #e1e5e9; display: flex; justify-content: flex-end; gap: 10px;">
          <button id="cancel-upload-btn" class="btn btn-secondary">取消</button>
          <button id="start-upload-btn" class="btn btn-primary">开始上传</button>
        </div>
        <!-- 上传进度条覆盖层 -->
        <div id="upload-progress-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255, 255, 255, 0.9); display: none; flex-direction: column; justify-content: center; align-items: center; z-index: 1000;">
          <div style="position: relative; width: 120px; height: 120px;">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e0e0e0" stroke-width="12"/>
              <circle id="upload-progress-circle" cx="60" cy="60" r="54" fill="none" stroke="#4CAF50" stroke-width="12" stroke-linecap="round" stroke-dasharray="339.12" stroke-dashoffset="339.12" transform="rotate(-90 60 60)" style="transition: stroke-dashoffset 0.3s ease;"/>
            </svg>
            <div id="upload-progress-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px; font-weight: bold; color: #333;">0%</div>
          </div>
          <div id="upload-progress-filename" style="margin-top: 20px; font-size: 16px; color: #666; text-align: center; max-width: 80%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">上传中...</div>
        </div>
      </div>
    </div>
    
    <!-- 添加标签弹窗 -->
    <div id="add-tag-modal" class="modal" style="display: none;">
      <div class="modal-content" style="width: 400px;">
        <div class="modal-header">
          <h4>添加新标签</h4>
          <button id="close-add-tag-modal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form id="add-tag-form">
            <div class="form-row">
              <label for="new-tag-name">标签名称</label>
              <input type="text" id="new-tag-name" required>
            </div>
            <div class="form-row">
              <label for="new-tag-sort">排序值</label>
              <input type="number" id="new-tag-sort" value="1" min="1">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button id="cancel-add-tag-btn" class="btn btn-secondary">取消</button>
          <button id="save-tag-btn" class="btn btn-primary">保存</button>
        </div>
      </div>
    </div>
  `;
  
  // 创建弹窗元素
  const modalDiv = document.createElement('div');
  modalDiv.innerHTML = modalHTML;
  
  // 获取所有模态框并添加到body
  const modals = modalDiv.querySelectorAll('.modal');
  modals.forEach((modal, index) => {
    document.body.appendChild(modal);
    
    // 只绑定第一个模态框（上传文件弹窗）的事件
    if (index === 0) {
      bindUploadModalEvents(modal);
    }
  });
  
  // 绑定添加标签弹窗事件
  bindAddTagModalEvents();
  

}

// 绑定上传弹窗事件
function bindUploadModalEvents(modalInstance) {
  // 绑定关闭按钮事件
  const closeBtn = modalInstance.querySelector('#close-upload-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeUploadModal);
  }
  
  // 绑定取消按钮事件
  const cancelBtn = modalInstance.querySelector('#cancel-upload-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeUploadModal);
  }
  
  // 绑定文件选择事件
  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileSelection);
  }
  
  // 绑定上传区域点击事件
  const uploadArea = document.getElementById('upload-area');
  if (uploadArea) {
    uploadArea.addEventListener('click', () => {
      document.getElementById('file-input').click();
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
      
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        // 将文件设置到file-input
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
          // 创建一个DataTransfer对象
          const dataTransfer = new DataTransfer();
          files.forEach(file => {
            dataTransfer.items.add(file);
          });
          fileInput.files = dataTransfer.files;
          // 触发change事件
          fileInput.dispatchEvent(new Event('change'));
        }
      }
    });
  }
  
  // 绑定标签搜索事件
  const tagSearch = document.getElementById('tag-search');
  if (tagSearch) {
    tagSearch.addEventListener('input', handleTagSearch);
    tagSearch.addEventListener('focus', handleTagSearch);
  }
  
  // 【新增】使用事件委托处理标签列表中的动态点击
  const tagListContainer = modalInstance.querySelector('#tag-list');
  if (tagListContainer) {
    tagListContainer.addEventListener('click', async (e) => {
      // 查找点击目标或其父级是否包含 data-action="add-new-tag"
      const target = e.target.closest('[data-action="add-new-tag"]');
      if (target) {
        const tagName = target.getAttribute('data-tag-name');
        
        if (tagName) {
          try {
            // 直接调用添加标签接口
            const newTag = await api.post('/admin/tags', {
              name: tagName,
              sortOrder: 1
            });
            showSuccess('标签添加成功');
            
            // 重新加载标签列表
            const tagSearch = document.getElementById('tag-search');
            if (tagSearch) {
              // 触发搜索事件，重新加载标签列表
              tagSearch.value = '';
              tagSearch.dispatchEvent(new Event('input'));
            }
            
            // 将新添加的标签直接添加到已选中的标签中
            if (newTag) {
              selectTag(newTag);
            }
          } catch (error) {
            showError('添加标签失败: ' + (error.message || '未知错误'));
          }
        }
      } else {
        // 处理普通标签项的点击
        const tagItem = e.target.closest('[data-tag-id]');
        if (tagItem) {
          const tagId = tagItem.getAttribute('data-tag-id');
          const tagName = tagItem.textContent;
          selectTag({ id: tagId, name: tagName });
        }
      }
    });
  }
  
  // 绑定开始上传按钮事件
  const startUploadBtn = modalInstance.querySelector('#start-upload-btn');
  if (startUploadBtn) {
    startUploadBtn.addEventListener('click', async () => {
      const albumId = document.getElementById('upload-album-id').value;
      const fileInput = document.getElementById('file-input');
      const files = Array.from(fileInput.files);
      
      if (files.length > 0) {
        try {
          await handleMediaUpload(albumId, files);
          closeUploadModal();
        } catch (error) {
          showError('上传失败: ' + (error.message || '未知错误'));
        }
      } else {
        showError('请选择要上传的文件');
      }
    });
  }
  
  // 确保设为封面开关可以点击
  const coverToggle = document.getElementById('media-is-cover');
  if (coverToggle) {
    // 为开关本身添加点击事件
    coverToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      this.checked = !this.checked;
    });
    
    // 为滑块添加点击事件
    const toggleSlider = coverToggle.nextElementSibling;
    if (toggleSlider) {
      toggleSlider.addEventListener('click', function(e) {
        e.stopPropagation();
        const checkbox = this.previousElementSibling;
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
        }
      });
    }
  }
  

}

// 绑定添加标签弹窗事件
function bindAddTagModalEvents() {
  const modal = document.getElementById('add-tag-modal');
  if (!modal) {
    return;
  }
  
  // 关闭按钮
  const closeBtn = document.getElementById('close-add-tag-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      modal.style.display = 'none';
    });
  }
  
  // 取消按钮
  const cancelBtn = document.getElementById('cancel-add-tag-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      modal.style.display = 'none';
    });
  }
  
  // 保存按钮
  const saveBtn = document.getElementById('save-tag-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const tagName = document.getElementById('new-tag-name').value;
      const sortOrder = document.getElementById('new-tag-sort').value;
      
      if (!tagName) {
        showError('请输入标签名称');
        return;
      }
      
      try {
        await api.post('/admin/tags', {
          name: tagName,
          sortOrder: parseInt(sortOrder)
        });
        showSuccess('标签添加成功');
        modal.style.display = 'none';
        // 重新加载标签列表
        const tagSearch = document.getElementById('tag-search');
        if (tagSearch) {
          tagSearch.dispatchEvent(new Event('input'));
        }
      } catch (error) {
        showError('添加标签失败: ' + (error.message || '未知错误'));
      }
    });
  }
  
  // 点击弹窗外部关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// 处理文件选择
async function handleFileSelection(e) {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;
  
  // 显示文件预览
  const previewContainer = document.getElementById('file-preview-container');
  const previewDiv = document.getElementById('file-preview');
  
  previewDiv.innerHTML = '';
  
  // 检查是否有视频文件
  const hasVideo = files.some(file => file.type.startsWith('video/'));
  
  // 隐藏或显示封面设置
  const coverToggleContainer = document.getElementById('cover-toggle-container');
  if (coverToggleContainer) {
    coverToggleContainer.parentElement.parentElement.style.display = hasVideo ? 'none' : 'block';
  }
  
  // 隐藏上传占位符，显示预览
  const uploadPlaceholder = document.getElementById('upload-placeholder');
  if (uploadPlaceholder) {
    uploadPlaceholder.style.display = 'none';
  }
  
  for (const file of files) {
    // 判断文件类型
    let type = 'UNKNOWN';
    if (file.type.startsWith('image/')) {
      type = 'PHOTO';
    } else if (file.type.startsWith('video/')) {
      type = 'VIDEO';
    }
    
    // 创建预览元素容器
    const previewContainer = document.createElement('div');
    previewContainer.style.width = '100%';
    previewContainer.style.height = '100%';
    previewContainer.style.display = 'flex';
    previewContainer.style.flexDirection = 'column';
    previewContainer.style.alignItems = 'flex-start';
    previewContainer.style.justifyContent = 'flex-start';
    
    // 创建预览元素
    const previewItem = document.createElement('div');
    previewItem.style.width = '100%';
    previewItem.style.height = '300px';
    previewItem.style.borderRadius = '8px';
    previewItem.style.overflow = 'hidden';
    previewItem.style.position = 'relative';
    previewItem.style.backgroundColor = '#000';
    previewItem.style.alignSelf = 'stretch';
    
    // 添加文件名
    const fileName = document.createElement('div');
    fileName.textContent = file.name;
    fileName.style.position = 'absolute';
    fileName.style.top = '0';
    fileName.style.left = '0';
    fileName.style.right = '0';
    fileName.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    fileName.style.color = 'white';
    fileName.style.padding = '10px';
    fileName.style.fontSize = '14px';
    fileName.style.textOverflow = 'ellipsis';
    fileName.style.whiteSpace = 'nowrap';
    fileName.style.overflow = 'hidden';
    previewItem.appendChild(fileName);
    
    if (type === 'PHOTO') {
      // 图片预览
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      previewItem.appendChild(img);
    } else if (type === 'VIDEO') {
      // 视频预览
      const videoContainer = document.createElement('div');
      videoContainer.style.position = 'relative';
      videoContainer.style.width = '100%';
      videoContainer.style.height = '100%';
      
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'contain';
      video.controls = true;
      
      // 捕获视频第一帧作为默认封面
      video.addEventListener('loadeddata', function() {
        // 创建canvas用于捕获帧
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 将canvas转换为blob并存储
        canvas.toBlob(function(blob) {
          // 存储封面blob到文件对象中
          file.coverBlob = blob;
          file.coverUrl = URL.createObjectURL(blob);
        }, 'image/jpeg', 0.8);
      });
      
      // 当视频播放或拖动时更新封面
      video.addEventListener('timeupdate', function() {
        // 创建canvas用于捕获当前帧
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 将canvas转换为blob并存储
        canvas.toBlob(function(blob) {
          // 更新封面blob
          file.coverBlob = blob;
          if (file.coverUrl) {
            URL.revokeObjectURL(file.coverUrl);
          }
          file.coverUrl = URL.createObjectURL(blob);
        }, 'image/jpeg', 0.8);
      });
      
      videoContainer.appendChild(video);
      previewItem.appendChild(videoContainer);
    }
    
    // 先添加预览元素
    previewContainer.appendChild(previewItem);
    
    // 读取EXIF信息并添加到预览元素下方
    if (type === 'PHOTO') {
      try {
        const exifInfo = await readExifData(file);
        
        // 设置拍摄时间
        if (exifInfo.DateTime) {
          const shootTimeInput = document.getElementById('media-shoot-time');
          if (shootTimeInput) {
            try {
              // 解析EXIF日期格式 "YYYY:MM:DD HH:MM:SS"
              const exifDateStr = exifInfo.DateTime;
              const dateParts = exifDateStr.split(' ');
              if (dateParts.length === 2) {
                const datePart = dateParts[0].replace(/:/g, '-');
                const timePart = dateParts[1];
                const formattedDate = `${datePart} ${timePart}`;
                const dateTime = new Date(formattedDate);
                if (!isNaN(dateTime.getTime())) {
                  shootTimeInput.value = dateTime.toISOString().slice(0, 16);
                }
              } else {
                // 尝试直接转换
                const dateTime = new Date(exifDateStr);
                if (!isNaN(dateTime.getTime())) {
                  shootTimeInput.value = dateTime.toISOString().slice(0, 16);
                }
              }
            } catch (error) {

            }
          }
        }
        
        // 在图片下方显示EXIF信息
        if (exifInfo) {
          const exifContainer = document.createElement('div');
          exifContainer.style.width = '100%';
          exifContainer.style.marginTop = '10px';
          exifContainer.style.padding = '15px';
          exifContainer.style.backgroundColor = '#f5f5f5';
          exifContainer.style.borderRadius = '8px';
          exifContainer.style.fontFamily = 'monospace';
          exifContainer.style.fontSize = '12px';
          exifContainer.style.maxHeight = '200px';
          exifContainer.style.overflowY = 'auto';
          exifContainer.style.textAlign = 'left';
          exifContainer.style.alignSelf = 'stretch';
          
          let exifHtml = '<div style="font-weight: bold; margin-bottom: 8px; color: #333;">拍摄信息</div>';
          if (exifInfo.DateTime) exifHtml += `<div>📅 拍摄时间: ${exifInfo.DateTime}</div>`;
          if (exifInfo.Make || exifInfo.Model) exifHtml += `<div>📷 相机: ${exifInfo.Make || ''} ${exifInfo.Model || ''}</div>`;
          if (exifInfo.LensModel) exifHtml += `<div>🔍 镜头: ${exifInfo.LensModel}</div>`;
          if (exifInfo.ExposureTime) exifHtml += `<div>⏱️ 快门: ${exifInfo.ExposureTime}</div>`;
          if (exifInfo.FNumber) exifHtml += `<div>🌠 光圈: ${exifInfo.FNumber}</div>`;
          if (exifInfo.ISOSpeedRatings) exifHtml += `<div>⚡ ISO: ${exifInfo.ISOSpeedRatings}</div>`;
          if (exifInfo.FocalLength) exifHtml += `<div>📐 焦距: ${exifInfo.FocalLength}</div>`;
          
          if (exifInfo.GPSLatitude && exifInfo.GPSLongitude) {
            // 转换GPS坐标
            const lat = exifInfo.GPSLatitude;
            const lon = exifInfo.GPSLongitude;
            const latRef = exifInfo.GPSLatitudeRef || 'N';
            const lonRef = exifInfo.GPSLongitudeRef || 'E';
            
            const latitude = lat[0] + lat[1]/60 + lat[2]/3600;
            const longitude = lon[0] + lon[1]/60 + lon[2]/3600;
            
            const finalLat = latRef === 'S' ? -latitude : latitude;
            const finalLon = lonRef === 'W' ? -longitude : longitude;
            
            exifHtml += `<div>📍 位置: ${finalLat.toFixed(6)}, ${finalLon.toFixed(6)}</div>`;
          }
          
          exifContainer.innerHTML = exifHtml;
          previewContainer.appendChild(exifContainer);
        }
      } catch (error) {

      }
    }
    
    // 添加到预览区域
    previewDiv.appendChild(previewContainer);
  }
  
  // 显示预览容器
  if (previewContainer) {
    previewContainer.style.display = 'block';
  }
}

// 读取EXIF数据
function readExifData(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function() {
      try {
        EXIF.getData(img, function() {
          try {
            const tags = EXIF.getAllTags(this);
            
            const exifInfo = {
              // 拍摄日期
              DateTime: tags.DateTimeOriginal || tags.DateTime || null,
              
              // 拍摄器材
              Make: tags.Make || null,
              Model: tags.Model || null,
              LensModel: tags.LensModel || null,
              Flash: tags.Flash ? (tags.Flash & 1 ? '开启' : '关闭') : null,
              
              // 拍摄参数
              ExposureTime: tags.ExposureTime ? `1/${Math.round(1/tags.ExposureTime)}` : null,
              FNumber: tags.FNumber ? `f/${tags.FNumber}` : null,
              ISOSpeedRatings: tags.ISOSpeedRatings || null,
              FocalLength: tags.FocalLength ? `${tags.FocalLength}mm` : null,
              MeteringMode: tags.MeteringMode || null,
              
              // GPS数据
              GPSLatitude: tags.GPSLatitude || null,
              GPSLongitude: tags.GPSLongitude || null,
              GPSLatitudeRef: tags.GPSLatitudeRef || null,
              GPSLongitudeRef: tags.GPSLongitudeRef || null
            };
            
            resolve(exifInfo);
          } catch (error) {

            resolve(null);
          }
        });
      } catch (error) {

        resolve(null);
      }
    };
    img.onerror = function() {

      resolve(null);
    };
    img.src = URL.createObjectURL(file);
  });
}

// 显示EXIF信息
function displayExifInfo(exifInfo) {
  const exifContainer = document.getElementById('exif-container');
  const exifInfoDiv = document.getElementById('exif-info');
  
  if (!exifInfo) {
    exifContainer.style.display = 'none';
    return;
  }
  
  let html = '<div style="font-family: monospace; font-size: 12px;">';
  
  // 拍摄日期
  if (exifInfo.DateTime) {
    html += `<div><strong>拍摄日期:</strong> ${exifInfo.DateTime}</div>`;
  }
  
  // 拍摄器材
  if (exifInfo.Make || exifInfo.Model) {
    html += `<div><strong>拍摄器材:</strong> ${exifInfo.Make || ''} ${exifInfo.Model || ''}</div>`;
  }
  if (exifInfo.LensModel) {
    html += `<div><strong>镜头:</strong> ${exifInfo.LensModel}</div>`;
  }
  if (exifInfo.Flash) {
    html += `<div><strong>闪光灯:</strong> ${exifInfo.Flash}</div>`;
  }
  
  // 拍摄参数
  if (exifInfo.ExposureTime) {
    html += `<div><strong>快门速度:</strong> ${exifInfo.ExposureTime}</div>`;
  }
  if (exifInfo.FNumber) {
    html += `<div><strong>光圈:</strong> ${exifInfo.FNumber}</div>`;
  }
  if (exifInfo.ISOSpeedRatings) {
    html += `<div><strong>ISO:</strong> ${exifInfo.ISOSpeedRatings}</div>`;
  }
  if (exifInfo.FocalLength) {
    html += `<div><strong>焦距:</strong> ${exifInfo.FocalLength}</div>`;
  }
  if (exifInfo.MeteringMode) {
    html += `<div><strong>测光模式:</strong> ${exifInfo.MeteringMode}</div>`;
  }
  
  // GPS数据
  if (exifInfo.GPSLatitude && exifInfo.GPSLongitude) {
    // 转换GPS坐标
    const lat = exifInfo.GPSLatitude;
    const lon = exifInfo.GPSLongitude;
    const latRef = exifInfo.GPSLatitudeRef || 'N';
    const lonRef = exifInfo.GPSLongitudeRef || 'E';
    
    const latitude = lat[0] + lat[1]/60 + lat[2]/3600;
    const longitude = lon[0] + lon[1]/60 + lon[2]/3600;
    
    const finalLat = latRef === 'S' ? -latitude : latitude;
    const finalLon = lonRef === 'W' ? -longitude : longitude;
    
    html += `<div><strong>位置:</strong> ${finalLat.toFixed(6)}, ${finalLon.toFixed(6)}</div>`;
  }
  
  html += '</div>';
  
  exifInfoDiv.innerHTML = html;
  exifContainer.style.display = 'block';
}

// 处理标签搜索
async function handleTagSearch(e) {
  const searchTerm = e.target.value;
  const tagList = document.getElementById('tag-list');
  
  try {
    const tags = await api.get('/admin/tags');
    
    // 过滤标签
    const filteredTags = tags.filter(tag => 
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // 清空标签列表
    tagList.innerHTML = '';
    
    // 添加过滤后的标签
    filteredTags.forEach(tag => {
      const tagItem = document.createElement('div');
      tagItem.textContent = tag.name;
      tagItem.setAttribute('data-tag-id', tag.id);
      tagItem.style.padding = '8px';
      tagItem.style.cursor = 'pointer';
      tagItem.style.borderBottom = '1px solid #eee';
      tagItem.onclick = () => selectTag(tag);
      tagList.appendChild(tagItem);
    });
    
    // 如果没有匹配的标签且搜索框有内容，显示添加新标签选项
    if (filteredTags.length === 0 && searchTerm.trim()) {
      const addTagItem = document.createElement('div');
      addTagItem.textContent = `添加新标签: ${searchTerm.trim()}`;
      addTagItem.style.padding = '8px';
      addTagItem.style.cursor = 'pointer';
      addTagItem.style.borderBottom = '1px solid #eee';
      addTagItem.style.color = '#667eea';
      addTagItem.setAttribute('data-action', 'add-new-tag');
      addTagItem.setAttribute('data-tag-name', searchTerm.trim());
      tagList.appendChild(addTagItem);
    }
    
    // 显示标签列表
    tagList.style.display = 'block';
  } catch (error) {
    tagList.innerHTML = '';
    tagList.style.display = 'none';
  }
}

// 点击页面其他地方关闭标签列表
function bindUploadTagListClickHandler() {
  const handleClickOutside = function(e) {
    const tagSearch = document.getElementById('tag-search');
    const tagList = document.getElementById('tag-list');
    
    if (tagSearch && tagList && !tagSearch.contains(e.target) && !tagList.contains(e.target)) {
      tagList.style.display = 'none';
    }
  };
  
  document.addEventListener('click', handleClickOutside);
  
  // 存储事件监听器引用，以便在关闭时移除
  const uploadModal = document.getElementById('upload-modal');
  if (uploadModal) {
    uploadModal._tagListClickHandler = handleClickOutside;
  }
}

// 移除上传弹框的标签列表点击事件监听器
function removeUploadTagListClickHandler() {
  const uploadModal = document.getElementById('upload-modal');
  if (uploadModal && uploadModal._tagListClickHandler) {
    document.removeEventListener('click', uploadModal._tagListClickHandler);
    uploadModal._tagListClickHandler = null;
  }
}

// 选择标签
function selectTag(tag) {
  const selectedTagsDiv = document.getElementById('selected-tags');
  const tagList = document.getElementById('tag-list');
  
  // 检查标签是否已选中（只在当前弹窗的selected-tags中查找）
  if (selectedTagsDiv.querySelector(`[data-tag-id="${tag.id}"]`)) {
    return; // 已选中，不再添加
  }
  
  // 创建标签元素
  const tagElement = document.createElement('div');
  tagElement.className = 'tag';
  tagElement.setAttribute('data-tag-id', tag.id);
  tagElement.style.display = 'inline-block';
  tagElement.style.padding = '4px 8px';
  tagElement.style.backgroundColor = '#e0e0e0';
  tagElement.style.borderRadius = '4px';
  tagElement.style.margin = '2px';
  tagElement.style.fontSize = '12px';
  tagElement.innerHTML = `${tag.name} <span style="cursor: pointer; margin-left: 5px;">×</span>`;
  
  // 添加删除按钮事件
  tagElement.querySelector('span').addEventListener('click', () => {
    tagElement.remove();
  });
  
  // 添加到选中标签区域
  selectedTagsDiv.appendChild(tagElement);
  
  // 关闭标签列表
  tagList.style.display = 'none';
  
  // 清空搜索框
  document.getElementById('tag-search').value = '';
}

// 打开上传弹窗
export function openUploadModal(albumId, siteId, ossPrefix) {
  const modal = document.getElementById('upload-modal');
  if (!modal) {
    return;
  }
  
  // 设置相册ID
  const albumIdInput = document.getElementById('upload-album-id');
  if (albumIdInput) {
    albumIdInput.value = albumId;
  }
  
  // 设置OSS前缀
  const ossPrefixInput = document.getElementById('upload-album-oss-prefix');
  if (ossPrefixInput) {
    ossPrefixInput.value = ossPrefix || '';
  }
  
  // 存储siteId到弹窗元素属性中
  modal.setAttribute('data-site-id', siteId);
  
  // 重置表单
  const uploadForm = document.getElementById('upload-form');
  if (uploadForm) {
    uploadForm.reset();
  }
  
  // 绑定标签列表点击事件监听器
  bindUploadTagListClickHandler();
  
  // 显示弹窗
  modal.style.display = 'flex';
  // 添加show类以触发动画
  modal.classList.add('show');
}

// 关闭上传弹窗
export function closeUploadModal() {
  const modal = document.getElementById('upload-modal');
  if (modal) {
    // 移除标签列表点击事件监听器
    removeUploadTagListClickHandler();
    
    // 重置表单
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
      uploadForm.reset();
    }
    
    // 清空文件预览
    const previewContainer = document.getElementById('file-preview-container');
    const previewDiv = document.getElementById('file-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    
    if (previewContainer) {
      previewContainer.style.display = 'none';
    }
    if (previewDiv) {
      previewDiv.innerHTML = '';
    }
    if (uploadPlaceholder) {
      uploadPlaceholder.style.display = 'block';
    }
    
    // 清空选中的标签
    const selectedTagsDiv = document.getElementById('selected-tags');
    if (selectedTagsDiv) {
      selectedTagsDiv.innerHTML = '';
    }
    
    // 清空标签搜索框
    const tagSearch = document.getElementById('tag-search');
    if (tagSearch) {
      tagSearch.value = '';
    }
    
    // 隐藏标签列表
    const tagList = document.getElementById('tag-list');
    if (tagList) {
      tagList.style.display = 'none';
    }
    
    // 关闭弹窗
    // 移除show类
    modal.classList.remove('show');
    // 等待动画完成后再隐藏
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
}

// 绑定媒体项事件
export function bindMediaItemEvents() {
  // 为所有媒体项添加点击事件（预览）
  document.querySelectorAll('.media-item').forEach(item => {
    // 点击媒体项预览
    item.addEventListener('click', function(e) {
      // 避免点击按钮时触发预览
      if (e.target.closest('button')) {
        return;
      }
      
      const mediaId = this.getAttribute('data-id');
      const type = this.getAttribute('data-type');
      const previewUrl = this.getAttribute('data-preview-url');
      const filenameElement = this.querySelector('div[title]') || this.querySelector('span[title]');
      const filename = filenameElement ? filenameElement.textContent : '预览';
      
      // 从mediaDataMap中获取原始文件名作为备选
      const media = mediaDataMap[mediaId];
      const originalFilename = media ? media.originalFilename : null;
      const displayFilename = filename || originalFilename || '预览';
      
      const modal = document.getElementById('preview-modal');
      const title = document.getElementById('preview-title');
      const content = document.getElementById('preview-content');
      const exifContainer = document.getElementById('preview-exif');
      
      title.textContent = displayFilename;
      
      if (type === 'PHOTO') {
        content.innerHTML = `<img src="${previewUrl}" style="max-width: 100%; max-height: 70vh; object-fit: contain;">`;
        
        // 从mediaDataMap中获取EXIF信息和原始URL
        const media = mediaDataMap[mediaId];
        const exifInfo = media ? media.exifInfo : null;
        const originalUrl = media ? media.originalUrl : null;
        
        // 显示下载原图按钮
        const downloadBtn = document.getElementById('download-original-btn');
        if (downloadBtn) {
          if (originalUrl) {
            downloadBtn.style.display = 'block';
            downloadBtn.onclick = function() {
              // 创建一个临时链接来下载原图
              const link = document.createElement('a');
              link.href = originalUrl;
              link.download = media.originalFilename;
              link.click();
            };
          } else {
            downloadBtn.style.display = 'none';
          }
        }
        
        // 显示EXIF信息
        if (exifInfo) {
          try {
            const exif = JSON.parse(exifInfo);
            // 检查exif是否为空对象
            if (Object.keys(exif).length > 0) {
              let exifHtml = '<div style="font-weight: bold; margin-bottom: 10px; font-size: 14px; color: #333;">拍摄信息</div>';
              exifHtml += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">';
              
              // 定义中文键名映射
              const exifKeyMap = {
                'ISO': 'ISO',
                'aperture': '光圈',
                'shutterSpeed': '快门速度',
                'camera': '相机',
                'focalLength': '焦距',
                'shootTime': '拍摄时间'
              };
              
              for (const [key, value] of Object.entries(exif)) {
                const chineseKey = exifKeyMap[key] || key;
                exifHtml += `<div style="background-color: #ffffff; padding: 8px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <div style="font-weight: 500; margin-bottom: 4px; color: #555;">${chineseKey}</div>
                  <div style="color: #333;">${value}</div>
                </div>`;
              }
              exifHtml += '</div>';
              exifContainer.innerHTML = exifHtml;
              exifContainer.style.display = 'block';
            } else {
              exifContainer.style.display = 'none';
            }
          } catch (e) {
            // 非JSON格式的exifInfo，直接显示
            if (exifInfo.trim()) {
              exifContainer.innerHTML = `<div style="background-color: #ffffff; padding: 10px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">${exifInfo}</div>`;
              exifContainer.style.display = 'block';
            } else {
              exifContainer.style.display = 'none';
            }
          }
        } else {
          exifContainer.style.display = 'none';
        }
      } else if (type === 'VIDEO') {
        content.innerHTML = `<video src="${previewUrl}" controls style="max-width: 100%; max-height: 70vh; object-fit: contain;"></video>`;
        
        // 隐藏下载原图按钮
        const downloadBtn = document.getElementById('download-original-btn');
        if (downloadBtn) {
          downloadBtn.style.display = 'none';
        }
        
        exifContainer.style.display = 'none';
      }
      
      modal.style.display = 'flex';
      // 添加show类以触发动画
      modal.classList.add('show');
    });
    
    // 悬停显示备注信息和EXIF信息
    item.addEventListener('mouseenter', function() {
      const descriptionTooltip = this.querySelector('.description-tooltip');
      const exifTooltip = this.querySelector('.exif-tooltip');
      
      if (descriptionTooltip) {
        descriptionTooltip.style.display = 'block';
      }
      if (exifTooltip) {
        exifTooltip.style.display = 'block';
      }
    });
    
    // 鼠标离开媒体项时隐藏tooltip
    item.addEventListener('mouseleave', function(e) {
      // 检查鼠标是否移动到了tooltip上
      const descriptionTooltip = this.querySelector('.description-tooltip');
      const exifTooltip = this.querySelector('.exif-tooltip');
      
      // 如果鼠标移动到了tooltip上，不隐藏
      if (descriptionTooltip && descriptionTooltip.contains(e.relatedTarget)) {
        return;
      }
      if (exifTooltip && exifTooltip.contains(e.relatedTarget)) {
        return;
      }
      
      if (descriptionTooltip) {
        descriptionTooltip.style.display = 'none';
      }
      if (exifTooltip) {
        exifTooltip.style.display = 'none';
      }
    });
    
    // 为tooltip添加鼠标离开事件
    const descriptionTooltip = item.querySelector('.description-tooltip');
    if (descriptionTooltip) {
      descriptionTooltip.addEventListener('mouseleave', function(e) {
        // 检查鼠标是否移动回了媒体项
        const mediaItem = this.closest('.media-item');
        if (!mediaItem || !mediaItem.contains(e.relatedTarget)) {
          this.style.display = 'none';
        }
      });
    }
    
    const exifTooltip = item.querySelector('.exif-tooltip');
    if (exifTooltip) {
      exifTooltip.addEventListener('mouseleave', function(e) {
        // 检查鼠标是否移动回了媒体项
        const mediaItem = this.closest('.media-item');
        if (!mediaItem || !mediaItem.contains(e.relatedTarget)) {
          this.style.display = 'none';
        }
      });
    }
  });
  
  // 绑定编辑按钮事件
  document.querySelectorAll('.edit-media-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const mediaId = this.getAttribute('data-media-id');
      const albumId = this.getAttribute('data-album-id');
      editMedia(mediaId, albumId);
    });
  });
  
  // 绑定删除按钮事件
  document.querySelectorAll('.delete-media-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const mediaId = this.getAttribute('data-media-id');
      const albumId = this.getAttribute('data-album-id');
      deleteMedia(mediaId, albumId);
    });
  });
  
  // 绑定预览模态框关闭事件
  const closeBtn = document.getElementById('close-preview-modal');
  const previewModal = document.getElementById('preview-modal');
  
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
  
  if (previewModal) {
    previewModal.addEventListener('click', function(e) {
      if (e.target === previewModal) {
        // 移除show类
        previewModal.classList.remove('show');
        // 等待动画完成后再隐藏
        setTimeout(() => {
          previewModal.style.display = 'none';
        }, 300);
      }
    });
  }
}

// 绑定拖拽排序事件
export function bindDragAndDropEvents() {
  const mediaItems = document.querySelectorAll('.media-item');
  let draggedItem = null;
  
  mediaItems.forEach(item => {
    // 开始拖拽
    item.addEventListener('dragstart', function(e) {
      draggedItem = this;
      this.style.opacity = '0.5';
    });
    
    // 结束拖拽
    item.addEventListener('dragend', function(e) {
      this.style.opacity = '1';
      draggedItem = null;
    });
    
    // 拖拽经过
    item.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.style.border = '2px dashed #667eea';
    });
    
    // 拖拽离开
    item.addEventListener('dragleave', function(e) {
      this.style.border = '1px solid #e0e0e0';
    });
    
    // 放置
    item.addEventListener('drop', function(e) {
      e.preventDefault();
      this.style.border = '1px solid #e0e0e0';
      
      if (draggedItem !== this) {
        const draggedId = draggedItem.getAttribute('data-id');
        const targetId = this.getAttribute('data-id');
        const albumId = this.getAttribute('data-album-id');
        
        // 获取所有媒体项并按当前顺序排序
        const allItems = Array.from(document.querySelectorAll('.media-item'));
        const newOrder = allItems.map(item => item.getAttribute('data-id'));
        
        // 计算新的排序值
        const draggedIndex = newOrder.indexOf(draggedId);
        const targetIndex = newOrder.indexOf(targetId);
        const newSortOrder = targetIndex + 1; // 排序值从1开始
        
        // 调用排序接口
        api.put('/admin/media/sort', {
          id: draggedId,
          newSortOrder: newSortOrder
        }).then(() => {
          // 重新加载媒体列表
          loadMediaList(albumId);
        }).catch(error => {
          console.error('排序失败:', error);
          showError('排序失败: ' + (error.message || '未知错误'));
        });
      }
    });
  });
}

// 加载媒体列表
export async function loadMediaList(albumId) {
  const mediaList = document.getElementById('media-list');
  
  try {
    const response = await api.get(`/admin/media/list?albumId=${albumId}`);
    
    const records = response.data || response || [];
    
    if (records.length === 0) {
      mediaList.innerHTML = '<div style="text-align: center; padding: 40px;">暂无媒体文件</div>';
      return;
    }
    
    // 按排序值排序
    records.sort((a, b) => a.sortOrder - b.sortOrder);
    
    // 存储媒体数据到对象中
    mediaDataMap = {};
    records.forEach(media => {
      mediaDataMap[media.id] = media;
    });
    
    const html = `
      <div id="media-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 15px; padding: 20px;">
        ${records.map(media => `
          <div class="media-item" draggable="true" data-id="${media.id}" data-album-id="${albumId}" data-type="${media.type}" data-sort-order="${media.sortOrder}" data-preview-url="${media.type === 'PHOTO' ? (media.thumbnailUrl || media.originalUrl) : media.originalUrl}" style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; position: relative; transition: all 0.3s ease; cursor: pointer;">
            ${media.type === 'PHOTO' 
              ? `<img src="${media.thumbnailUrl || media.originalUrl}" style="width: 100%; height: 140px; object-fit: cover;" title="${media.description || media.originalFilename}\n拍摄日期: ${media.shootTime ? new Date(media.shootTime).toLocaleString() : '-'}">`
              : `<img src="${media.thumbnailUrl || media.originalUrl}" style="width: 100%; height: 140px; object-fit: cover;" title="${media.description || media.originalFilename}\n拍摄日期: ${media.shootTime ? new Date(media.shootTime).toLocaleString() : '-'}">`
            }
            ${media.isCover === 1 ? `
              <div style="position: absolute; top: 5px; right: 5px; background-color: #4CAF50; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; z-index: 5;">封面</div>
            ` : ''}
            ${media.type === 'VIDEO' ? `
              <div style="position: absolute; top: 5px; left: 5px; background-color: #3498db; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; z-index: 5;">视频</div>
            ` : ''}
            <div style="padding: 8px;">
              <div style="font-size: 14px; font-weight: 500; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${media.description || media.originalFilename}">${media.description || media.originalFilename}</div>
              <div style="font-size: 11px; color: #666; display: flex; justify-content: space-between; gap: 10px;">
                <div>📅 上传: ${media.uploadTime ? new Date(media.uploadTime).toLocaleDateString() : '-'}</div>
                <div>📷 拍摄: ${media.shootTime ? new Date(media.shootTime).toLocaleDateString() : '-'}</div>
              </div>
              <div style="display: flex; gap: 6px; margin-top: 10px;">
                <button class="btn btn-primary btn-sm edit-media-btn" style="padding: 6px 10px; font-size: 12px; flex: 1;" data-media-id="${media.id}" data-album-id="${albumId}">编辑</button>
                <button class="btn btn-danger btn-sm delete-media-btn" style="padding: 6px 10px; font-size: 12px; flex: 1;" data-media-id="${media.id}" data-album-id="${albumId}">删除</button>
              </div>
            </div>
            ${media.description ? `
              <div class="description-tooltip" style="position: absolute; top: 100%; left: 0; right: 0; background: rgba(0, 0, 0, 0.9); color: white; padding: 8px; border-radius: 0 0 8px 8px; font-size: 11px; max-height: 100px; overflow-y: auto; display: none; z-index: 11;">
                <div style="font-weight: bold; margin-bottom: 6px;">备注信息</div>
                <div>${media.description}</div>
              </div>
            ` : ''}
            ${media.exifInfo ? `
              <div class="exif-tooltip" style="position: absolute; top: 100%; left: 0; right: 0; background: rgba(0, 0, 0, 0.9); color: white; padding: 8px; border-radius: 0 0 8px 8px; font-size: 11px; font-family: monospace; max-height: 150px; overflow-y: auto; display: none; z-index: 10;">
                <div style="font-weight: bold; margin-bottom: 6px;">拍摄信息</div>
                ${(() => {
                  try {
                    const exif = JSON.parse(media.exifInfo);
                    let exifHtml = '';
                    const exifKeyMap = {
                      'ISO': 'ISO',
                      'aperture': '光圈',
                      'shutterSpeed': '快门速度',
                      'camera': '相机',
                      'focalLength': '焦距',
                      'shootTime': '拍摄时间'
                    };
                    for (const [key, value] of Object.entries(exif)) {
                      const chineseKey = exifKeyMap[key] || key;
                      exifHtml += `<div>${chineseKey}: ${value}</div>`;
                    }
                    return exifHtml || '<div>无详细EXIF信息</div>';
                  } catch (e) {
                    return `<div>${media.exifInfo}</div>`;
                  }
                })()}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
    
    mediaList.innerHTML = html;
    
    // 确保预览模态框在body下
    ensurePreviewModalInBody();
    
    // 绑定事件
    bindMediaItemEvents();
    bindDragAndDropEvents();
  } catch (error) {
    mediaList.innerHTML = '<div style="text-align: center; padding: 40px; color: red;">加载失败，请刷新重试</div>';
  }
}

// 确保预览模态框在body下
function ensurePreviewModalInBody() {
  let modal = document.getElementById('preview-modal');
  
  // 如果模态框不存在，创建它
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.className = 'modal';
    modal.style.display = 'none';
    modal.style.zIndex = '1000';
    modal.innerHTML = `
      <div class="modal-content" style="width: 90%; max-width: 1000px; max-height: 90vh; overflow: auto;">
        <div class="modal-header">
          <h4 id="preview-title">预览</h4>
          <button id="close-preview-modal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body" style="display: flex; flex-direction: column; align-items: center; padding: 20px;">
          <div id="preview-content"></div>
          <div style="margin-top: 15px; width: 100%; max-width: 800px; display: flex; justify-content: center;">
            <button id="download-original-btn" class="btn btn-primary" style="padding: 8px 16px; font-size: 14px;">下载原图</button>
          </div>
          <div id="preview-exif" style="margin-top: 20px; width: 100%; max-width: 800px; padding: 15px; background-color: #f5f5f5; border-radius: 8px; font-family: monospace; font-size: 12px;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } else if (modal.parentElement !== document.body) {
    // 如果模态框存在但不在body下，移动它
    document.body.appendChild(modal);
  }
}

// 处理媒体上传
export async function handleMediaUpload(albumId, files) {
  // 获取上传模态框和进度条元素
  const modal = document.getElementById('upload-modal');
  const progressOverlay = document.getElementById('upload-progress-overlay');
  const progressCircle = document.getElementById('upload-progress-circle');
  const progressText = document.getElementById('upload-progress-text');
  const progressFilename = document.getElementById('upload-progress-filename');
  
  // 获取siteId
  const siteId = modal ? modal.getAttribute('data-site-id') : null;
  
  // 获取表单数据
  const description = document.getElementById('media-description')?.value || '';
  const shootTime = document.getElementById('media-shoot-time')?.value || null;
  const isCover = document.getElementById('media-is-cover')?.checked ? 1 : 0;
  
  // 获取选中的标签
  const selectedTags = [];
  document.querySelectorAll('#selected-tags [data-tag-id]').forEach(tagElement => {
    selectedTags.push(tagElement.getAttribute('data-tag-id'));
  });
  
  // 显示进度条覆盖层并禁用弹窗交互
  if (progressOverlay) {
    progressOverlay.style.display = 'flex';
  }
  if (modal) {
    modal.style.pointerEvents = 'none';
  }
  
  let allUploadsSuccessful = true;
  
  // 获取当前媒体列表的最大排序值
  let maxSortOrder = 0;
  try {
    const response = await api.get(`/admin/media/list?albumId=${albumId}`);
    // 处理不同的响应格式
    let records = [];
    if (response && response.data) {
      records = response.data;
    } else if (Array.isArray(response)) {
      records = response;
    }
    
    if (records.length > 0) {
      // 确保所有项目都有 sortOrder 属性
      const sortOrders = records.map(item => {
        if (item && typeof item.sortOrder === 'number') {
          return item.sortOrder;
        }
        return 0;
      });
      maxSortOrder = Math.max(...sortOrders);
    }
  } catch (error) {
  }
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (progressFilename) {
      progressFilename.textContent = `${file.name} (${i + 1}/${files.length})`;
    }
    
    // 重置进度条
    updateProgress(0);
    
    try {
      // 1. 处理媒体文件（压缩、提取 EXIF 等）
      const processedMedia = await mediaHandler.processMedia(file);
      
      // 2. 生成文件名
      const ossPrefix = document.getElementById('upload-album-oss-prefix')?.value || 'media';
      const fileName = mediaHandler.generateFileName('media', file.name, siteId, ossPrefix);
      
      // 3. 上传原图（带进度）
      const originalUrl = await ossClient.uploadFile(
        file,
        fileName,
        siteId,
        (progress) => {
          const totalProgress = Math.round(progress * 0.5); // 原图占 50%
          updateProgress(totalProgress);
        }
      );
      
      // 4. 上传压缩图作为缩略图（带进度）
      let thumbnailUrl = null;
      if (processedMedia.type === 'PHOTO' && processedMedia.compressedFile) {
        const thumbFileName = fileName.replace(/\.(\w+)$/, '_thumb.$1');
        thumbnailUrl = await ossClient.uploadFile(
          processedMedia.compressedFile,
          thumbFileName,
          siteId,
          (progress) => {
            const totalProgress = 50 + Math.round(progress * 0.3); // 缩略图占 30%
            updateProgress(totalProgress);
          }
        );
      } else if (processedMedia.type === 'VIDEO') {
        // 视频上传封面图
        const coverFileName = fileName.replace(/\.(\w+)$/, '_cover.jpg');
        // 使用用户选择的封面（如果有），否则使用默认封面
        const coverBlob = file.coverBlob || processedMedia.thumbnail;
        if (coverBlob) {
          thumbnailUrl = await ossClient.uploadFile(
            new File([coverBlob], coverFileName, { type: 'image/jpeg' }),
            coverFileName,
            siteId,
            (progress) => {
              const totalProgress = 50 + Math.round(progress * 0.3);
              updateProgress(totalProgress);
            }
          );
        }
      }
      
      // 5. 保存媒体信息到后端
      updateProgress(90);
      
      // 计算排序值：最大排序值 + 1
      const sortOrder = maxSortOrder + i + 1;
      
      // 视频文件默认设置isCover为0
      const finalIsCover = processedMedia.type === 'VIDEO' ? 0 : isCover;
      
      // 使用原始类型：PHOTO 或 VIDEO
      const type = processedMedia.type;
      
      await api.post('/admin/media/upload', {
        albumId: albumId,
        originalFilename: processedMedia.originalFilename,
        originalUrl: originalUrl,
        thumbnailUrl: thumbnailUrl,
        exifInfo: processedMedia.exifInfo ? JSON.stringify(processedMedia.exifInfo) : null,
        shootTime: shootTime || processedMedia.shootTime,
        type: type,
        description: description,
        sortOrder: sortOrder,
        isCover: finalIsCover,
        tagIds: selectedTags
      });
      
      updateProgress(100);
      
    } catch (error) {
      showError(`文件 ${file.name} 上传失败：${error.message}`);
      allUploadsSuccessful = false;
    }
  }
  
  // 隐藏进度条并刷新列表
  setTimeout(() => {
    if (progressOverlay) {
      progressOverlay.style.display = 'none';
    }
    if (modal) {
      modal.style.pointerEvents = 'auto';
    }
    
    loadMediaList(albumId);
    
    // 只有所有上传都成功时才关闭弹窗
    if (allUploadsSuccessful) {
      closeUploadModal();
    }
  }, 1000);
  
  // 更新进度条函数
  function updateProgress(percent) {
    if (progressCircle && progressText) {
      const circumference = 2 * Math.PI * 54;
      const offset = circumference - (percent / 100) * circumference;
      progressCircle.style.strokeDashoffset = offset;
      progressText.textContent = `${percent}%`;
    }
  }
}

// 创建编辑模态框
function createEditModal() {
  // 检查弹窗是否已存在
  if (document.getElementById('edit-media-modal')) {
    return;
  }
  
  const modalHTML = `
    <div id="edit-media-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); justify-content: center; align-items: center; z-index: 999;">
      <div class="modal-content" style="width: 500px; max-height: 90vh; min-height: 550px; background-color: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); position: relative; display: flex; flex-direction: column;">
        <div class="modal-header">
          <h4 id="edit-modal-title">编辑媒体</h4>
          <button id="close-edit-modal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body" style="padding: 20px; flex: 1;">
          <form id="edit-media-form" class="form">
            <input type="hidden" id="edit-media-id">
            <input type="hidden" id="edit-album-id">
            
            <!-- 拍摄时间和设为封面 -->
            <div style="width: 100%; margin-bottom: 15px;">
              <div style="display: flex; gap: 20px;">
                <!-- 拍摄时间部分 -->
                <div style="flex: 1;">
                  <label for="edit-media-shoot-time" style="display: block; margin-bottom: 5px;">拍摄时间</label>
                  <input type="datetime-local" id="edit-media-shoot-time" name="shootTime" style="width: 200px; height: 32px; font-size: 14px; padding: 0 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <!-- 设为封面部分 -->
                <div style="flex-shrink: 0; display: flex; flex-direction: column; justify-content: flex-start;">
                  <label for="edit-media-is-cover" style="display: block; margin-bottom: 5px; white-space: nowrap;">设为封面</label>
                  <div style="display: flex; align-items: center;">
                    <div class="toggle-switch" style="position: relative; width: 40px; height: 20px;">
                      <input type="checkbox" id="edit-media-is-cover" name="isCover" value="1" style="opacity: 0; width: 0; height: 0;">
                      <span class="toggle-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 20px;"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 描述 -->
            <div class="form-row">
              <label for="edit-media-description">描述</label>
              <textarea id="edit-media-description" name="description" rows="3"></textarea>
            </div>
            
            <!-- 标签选择 -->
            <div class="form-row">
              <label>标签</label>
              <div style="position: relative;">
                <input type="text" id="edit-tag-search" placeholder="搜索标签..." style="width: 100%; padding: 8px; box-sizing: border-box;">
                <div id="edit-selected-tags" style="margin-top: 10px; display: flex; flex-wrap: gap: 5px;"></div>
                <div id="edit-tag-list" style="max-height: 120px; overflow-y: auto; border: 1px solid #ddd; border-top: none; display: none; position: absolute; width: 100%; background: white; z-index: 1000; box-shadow: 0 2px 8px rgba(0,0,0,0.15); top: 36px; left: 0; margin-top: 2px; box-sizing: border-box;"></div>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer" style="padding: 15px 20px; border-top: 1px solid #e1e5e9; display: flex; justify-content: flex-end; gap: 10px;">
          <button id="cancel-edit-btn" class="btn btn-secondary">取消</button>
          <button id="save-edit-btn" class="btn btn-primary">保存</button>
        </div>
      </div>
    </div>
  `;
  
  // 创建弹窗元素
  const modalDiv = document.createElement('div');
  modalDiv.innerHTML = modalHTML;
  const modal = modalDiv.firstElementChild;
  
  // 添加到body
  if (modal) {
    document.body.appendChild(modal);
    // 绑定模态框事件
    bindEditModalEvents(modal);
  }
}

// 绑定编辑模态框事件
function bindEditModalEvents(modalInstance) {
  // 绑定关闭按钮事件
  const closeBtn = modalInstance.querySelector('#close-edit-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeEditModal);
  }
  
  // 绑定取消按钮事件
  const cancelBtn = modalInstance.querySelector('#cancel-edit-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeEditModal);
  }
  
  // 绑定保存按钮事件
  const saveBtn = modalInstance.querySelector('#save-edit-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveMediaEdit);
  }
  
  // 确保设为封面开关可以点击
  const coverToggle = modalInstance.querySelector('#edit-media-is-cover');
  if (coverToggle) {
    // 为开关本身添加点击事件
    coverToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      this.checked = !this.checked;
    });
    
    // 为滑块添加点击事件
    const toggleSlider = coverToggle.nextElementSibling;
    if (toggleSlider) {
      toggleSlider.addEventListener('click', function(e) {
        e.stopPropagation();
        const checkbox = this.previousElementSibling;
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
        }
      });
    }
  }
  
  // 绑定标签搜索事件
  const tagSearch = modalInstance.querySelector('#edit-tag-search');
  if (tagSearch) {
    tagSearch.addEventListener('input', handleEditTagSearch);
    tagSearch.addEventListener('focus', handleEditTagSearch);
  }
  
  // 绑定标签列表点击事件
  const tagList = modalInstance.querySelector('#edit-tag-list');
  if (tagList) {
    tagList.addEventListener('click', async function(e) {
      // 查找点击目标或其父级是否包含 data-action="add-new-tag"
      const target = e.target.closest('[data-action="add-new-tag"]');
      if (target) {
        const tagName = target.getAttribute('data-tag-name');
        
        if (tagName) {
          try {
            // 直接调用添加标签接口
            const newTag = await api.post('/admin/tags', {
              name: tagName,
              sortOrder: 1
            });
            showSuccess('标签添加成功');
            
            // 重新加载标签列表
            const tagSearch = document.getElementById('edit-tag-search');
            if (tagSearch) {
              // 触发搜索事件，重新加载标签列表
              tagSearch.value = '';
              tagSearch.dispatchEvent(new Event('input'));
            }
            
            // 将新添加的标签直接添加到已选中的标签中
            if (newTag) {
              selectEditTag(newTag);
            }
          } catch (error) {
            showError('添加标签失败: ' + (error.message || '未知错误'));
          }
        }
      } else {
        // 处理普通标签项的点击
        const tagItem = e.target.closest('[data-tag-id]');
        if (tagItem) {
          const tagId = tagItem.getAttribute('data-tag-id');
          const tagName = tagItem.textContent;
          selectEditTag({ id: tagId, name: tagName });
        }
      }
    });
  }
  
  // 点击弹窗外部关闭标签列表
  const handleClickOutside = function(e) {
    const tagSearch = modalInstance.querySelector('#edit-tag-search');
    const tagList = modalInstance.querySelector('#edit-tag-list');
    if (tagSearch && tagList && !tagSearch.contains(e.target) && !tagList.contains(e.target)) {
      tagList.style.display = 'none';
    }
  };
  
  document.addEventListener('click', handleClickOutside);
  
  // 存储事件监听器引用，以便在关闭时移除
  modalInstance._tagListClickHandler = handleClickOutside;
  
  // 点击弹窗外部关闭
  modalInstance.addEventListener('click', (e) => {
    if (e.target === modalInstance) {
      closeEditModal();
    }
  });
}

// 处理编辑弹窗的标签搜索
async function handleEditTagSearch(e) {
  const searchTerm = e.target.value;
  const tagList = document.getElementById('edit-tag-list');
  
  try {
    const tags = await api.get('/admin/tags');
    
    // 过滤标签
    const filteredTags = tags.filter(tag => 
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // 清空标签列表
  tagList.innerHTML = '';
  
  // 添加过滤后的标签
  filteredTags.forEach(tag => {
    // 检查标签是否已被选中
    let isSelected = false;
    document.querySelectorAll('#edit-selected-tags [data-tag-id]').forEach(selectedTagElement => {
      const selectedTagId = selectedTagElement.getAttribute('data-tag-id');
      if (selectedTagId == tag.id || selectedTagId === tag.id) {
        isSelected = true;
      }
    });
    
    if (!isSelected) {
      const tagItem = document.createElement('div');
      tagItem.textContent = tag.name;
      tagItem.setAttribute('data-tag-id', tag.id);
      tagItem.style.padding = '8px';
      tagItem.style.cursor = 'pointer';
      tagItem.style.borderBottom = '1px solid #eee';
      tagList.appendChild(tagItem);
    }
  });
  
  // 如果没有匹配的标签且搜索框有内容，显示添加新标签选项
  if (filteredTags.length === 0 && searchTerm.trim()) {
    const addTagItem = document.createElement('div');
    addTagItem.textContent = `添加新标签: ${searchTerm.trim()}`;
    addTagItem.style.padding = '8px';
    addTagItem.style.cursor = 'pointer';
    addTagItem.style.borderBottom = '1px solid #eee';
    addTagItem.style.color = '#667eea';
    addTagItem.setAttribute('data-action', 'add-new-tag');
    addTagItem.setAttribute('data-tag-name', searchTerm.trim());
    tagList.appendChild(addTagItem);
  }
  
  // 显示标签列表
  tagList.style.display = 'block';
  } catch (error) {
    tagList.innerHTML = '';
    tagList.style.display = 'none';
  }
}

// 选择编辑弹窗中的标签
function selectEditTag(tag) {
  const selectedTagsDiv = document.getElementById('edit-selected-tags');
  const tagList = document.getElementById('edit-tag-list');
  
  // 检查标签是否已选中（只在当前弹窗的edit-selected-tags中查找）
  let isSelected = false;
  selectedTagsDiv.querySelectorAll('[data-tag-id]').forEach(selectedTagElement => {
    const selectedTagId = selectedTagElement.getAttribute('data-tag-id');
    if (selectedTagId == tag.id || selectedTagId === tag.id) {
      isSelected = true;
    }
  });
  
  if (isSelected) {
    return; // 已选中，不再添加
  }
  
  // 创建标签元素
  const tagElement = document.createElement('div');
  tagElement.className = 'tag';
  tagElement.setAttribute('data-tag-id', tag.id);
  tagElement.style.display = 'inline-block';
  tagElement.style.padding = '4px 8px';
  tagElement.style.backgroundColor = '#e0e0e0';
  tagElement.style.borderRadius = '4px';
  tagElement.style.margin = '2px';
  tagElement.style.fontSize = '12px';
  tagElement.innerHTML = `${tag.name} <span style="cursor: pointer; margin-left: 5px;">×</span>`;
  
  // 添加删除按钮事件
  tagElement.querySelector('span').addEventListener('click', () => {
    tagElement.remove();
  });
  
  // 添加到选中标签区域
  selectedTagsDiv.appendChild(tagElement);
  
  // 关闭标签列表
  tagList.style.display = 'none';
  
  // 清空搜索框
  document.getElementById('edit-tag-search').value = '';
}

// 关闭编辑模态框
function closeEditModal() {
  const modal = document.getElementById('edit-media-modal');
  if (modal) {
    // 隐藏标签列表
    const tagList = document.getElementById('edit-tag-list');
    if (tagList) {
      tagList.style.display = 'none';
    }
    
    // 清空标签搜索框
    const tagSearch = document.getElementById('edit-tag-search');
    if (tagSearch) {
      tagSearch.value = '';
    }
    
    // 移除事件监听器
    if (modal._tagListClickHandler) {
      document.removeEventListener('click', modal._tagListClickHandler);
      modal._tagListClickHandler = null;
    }  
    // 关闭弹窗
    // 移除show类
    modal.classList.remove('show');
    // 等待动画完成后再隐藏
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
}

// 保存媒体编辑
async function saveMediaEdit() {
  const mediaId = document.getElementById('edit-media-id').value;
  const albumId = document.getElementById('edit-album-id').value;
  const shootTime = document.getElementById('edit-media-shoot-time').value;
  const description = document.getElementById('edit-media-description').value;
  const isCover = document.getElementById('edit-media-is-cover').checked ? 1 : 0;
  
  // 获取选中的标签
  const selectedTags = [];
  document.querySelectorAll('#edit-selected-tags [data-tag-id]').forEach(tagElement => {
    selectedTags.push(tagElement.getAttribute('data-tag-id'));
  });
  
  try {
    await api.put('/admin/media', {
      id: mediaId,
      shootTime: shootTime,
      description: description,
      isCover: isCover,
      tagIds: selectedTags
    });
    
    showSuccess('编辑成功');
    closeEditModal();
    loadMediaList(albumId);
  } catch (error) {
    showError('编辑失败: ' + (error.message || '未知错误'));
  }
}

// 编辑媒体
export async function editMedia(mediaId, albumId) {
  try {
    // 获取媒体信息
    const media = mediaDataMap[mediaId];
    if (!media) {
      showError('媒体信息不存在');
      return;
    }
    
    // 创建编辑模态框
    createEditModal();
    
    // 填充表单数据
    document.getElementById('edit-media-id').value = mediaId;
    document.getElementById('edit-album-id').value = albumId;
    document.getElementById('edit-media-shoot-time').value = media.shootTime ? media.shootTime.replace(' ', 'T').slice(0, 16) : '';
    document.getElementById('edit-media-description').value = media.description || '';
    document.getElementById('edit-media-is-cover').checked = media.isCover === 1;
    
    // 清空现有标签
    const selectedTagsDiv = document.getElementById('edit-selected-tags');
    if (selectedTagsDiv) {
      selectedTagsDiv.innerHTML = '';
    }
    
    // 加载标签列表
    try {
      const tags = await api.get('/admin/tags');
      
      // 检查媒体是否有标签信息
      if (media.tags && Array.isArray(media.tags)) {
        // 显示已选标签
        media.tags.forEach(tag => {
          // 创建标签元素
          const tagElement = document.createElement('div');
          tagElement.className = 'tag';
          tagElement.setAttribute('data-tag-id', tag.id);
          tagElement.style.display = 'inline-block';
          tagElement.style.padding = '4px 8px';
          tagElement.style.backgroundColor = '#e0e0e0';
          tagElement.style.borderRadius = '4px';
          tagElement.style.margin = '2px';
          tagElement.style.fontSize = '12px';
          tagElement.innerHTML = `${tag.name} <span style="cursor: pointer; margin-left: 5px;">×</span>`;
          
          // 添加删除按钮事件
          tagElement.querySelector('span').addEventListener('click', () => {
            tagElement.remove();
          });
          
          // 添加到选中标签区域
          if (selectedTagsDiv) {
            selectedTagsDiv.appendChild(tagElement);
          }
        });
      } else if (media.tagIds && Array.isArray(media.tagIds)) {
        // 如果只有tagIds，根据ID查找标签名称
        media.tagIds.forEach(tagId => {
          const tag = tags.find(t => t.id == tagId || t.id === tagId);
          if (tag) {
            // 创建标签元素
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.setAttribute('data-tag-id', tag.id);
            tagElement.style.display = 'inline-block';
            tagElement.style.padding = '4px 8px';
            tagElement.style.backgroundColor = '#e0e0e0';
            tagElement.style.borderRadius = '4px';
            tagElement.style.margin = '2px';
            tagElement.style.fontSize = '12px';
            tagElement.innerHTML = `${tag.name} <span style="cursor: pointer; margin-left: 5px;">×</span>`;
            
            // 添加删除按钮事件
            tagElement.querySelector('span').addEventListener('click', () => {
              tagElement.remove();
            });
            
            // 添加到选中标签区域
            if (selectedTagsDiv) {
              selectedTagsDiv.appendChild(tagElement);
            }
          }
        });
      }
    } catch (tagError) {
    }
    
      // 显示模态框
    const editModal = document.getElementById('edit-media-modal');
    editModal.style.display = 'flex';
    // 添加show类以触发动画
    editModal.classList.add('show');
  } catch (error) {
    showError('编辑失败：' + (error.message || '未知错误'));
  }
}

// 删除媒体
export async function deleteMedia(mediaId, albumId) {
  try {
    await showConfirm('确认删除', '确定要删除这个媒体文件吗？');
    await api.delete(`/admin/media/${mediaId}`);
    await loadMediaList(albumId);
  } catch (error) {
    if (error !== false) {
      showError('删除失败：' + (error.message || '未知错误'));
    }
  }
}

// 导出当前站点ID，供其他模块使用
export let currentSiteId = null;
export function setCurrentSiteId(siteId) {
  currentSiteId = siteId;
}
