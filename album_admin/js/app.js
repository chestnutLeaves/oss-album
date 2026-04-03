import { tokenManager, api, showError, showSuccess } from './utils.js';

// 检查是否登录
if (!tokenManager.hasToken()) {
  window.location.href = 'index.html';
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', async () => {
  // 初始化导航
  initNavigation();
  
  // 初始化退出登录
  initLogout();
  
  // 初始化修改密码
  initChangePassword();
  
  // 加载默认页面
  loadPage('sites');
});

// 初始化导航
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      if (page) {
        loadPage(page);
        
        // 更新导航状态
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });
}

// 初始化退出登录
function initLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    try {
      // 调用退出登录API
      await api.post('/auth/logout');
    } catch (error) {
    } finally {
      // 清除token
      tokenManager.removeToken();
      // 跳转到登录页
      window.location.href = 'index.html';
    }
  });
}

// 加载页面
async function loadPage(page) {
  const contentBody = document.getElementById('content-body');
  const pageTitle = document.getElementById('page-title');
  
  // 设置页面标题
  const pageTitles = {
    sites: '站点管理',
    albums: '相册管理',
    media: '媒体管理',
    tags: '标签管理',
    banners: '轮播图管理'
  };
  
  pageTitle.textContent = pageTitles[page] || '管理中心';
  
  // 显示加载中
  contentBody.innerHTML = '<div style="text-align: center; padding: 40px;">加载中...</div>';
  
  try {
    // 动态导入页面模块
    const module = await import(`./pages/${page}.js`);
    if (module.init) {
      await module.init(contentBody);
    }
  } catch (error) {
    // 检查是否是登录过期错误
    if (error.message === '登录已过期，请重新登录') {
      // 已经在utils.js中处理了跳转，这里不需要重复处理
      return;
    }
    contentBody.innerHTML = '<div style="text-align: center; padding: 40px; color: red;">页面加载失败，请刷新重试</div>';
  }
}

// 初始化修改密码
function initChangePassword() {
  const changePasswordBtn = document.getElementById('change-password-btn');
  const changePasswordModal = document.getElementById('change-password-modal');
  const closeBtn = changePasswordModal.querySelector('.close');
  const cancelBtn = document.getElementById('cancel-change-password');
  const confirmBtn = document.getElementById('confirm-change-password');
  const form = document.getElementById('change-password-form');
  
  // 打开模态框
  changePasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    changePasswordModal.style.display = 'flex';
    // 添加show类以触发动画
    changePasswordModal.classList.add('show');
  });
  
  // 关闭模态框
  function closeModal() {
    // 移除show类
    changePasswordModal.classList.remove('show');
    // 等待动画完成后再隐藏
    setTimeout(() => {
      changePasswordModal.style.display = 'none';
      form.reset();
    }, 300);
  }
  
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // 点击模态框外部关闭 - 使用mousedown和mouseup事件组合避免误关闭
  let clickStartTarget = null;
  window.addEventListener('mousedown', (e) => {
    clickStartTarget = e.target;
  });
  window.addEventListener('mouseup', (e) => {
    if (clickStartTarget === changePasswordModal && e.target === changePasswordModal) {
      closeModal();
    }
    clickStartTarget = null;
  });
  
  // 表单提交
  confirmBtn.addEventListener('click', async () => {
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    
    // 前端验证
    if (!oldPassword) {
      showError('请输入旧密码');
      return;
    }
    
    if (!newPassword || newPassword.length < 6 || newPassword.length > 20) {
      showError('新密码长度必须在6-20位之间');
      return;
    }
    
    if (oldPassword === newPassword) {
      showError('新密码不能与旧密码相同');
      return;
    }
    
    try {
      // 调用修改密码API
      await api.post('/admin/auth/change-password', {
        oldPassword,
        newPassword
      });
      
      showSuccess('密码修改成功，请重新登录');
      // 清除token
      tokenManager.removeToken();
      // 跳转到登录页
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } catch (error) {
      showError(error.message || '网络错误，请稍后重试');
    }
  });
}