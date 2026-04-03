import { api, tokenManager, showError } from '../utils.js';

// 登录表单处理
const loginForm = document.getElementById('login-form');

// 登录处理
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const loginBtn = document.querySelector('.login-btn');
  
  // 保存原始按钮文本
  const originalText = loginBtn.textContent;
  
  try {
    // 显示加载状态
    loginBtn.textContent = '登录中...';
    loginBtn.disabled = true;
    loginBtn.classList.add('loading');
    
    // 调用登录API
    const data = await api.post('/auth/login', {
      username,
      password
    });
    
    // 存储token
    tokenManager.setToken(data.token);
    
    // 跳转到管理台
    window.location.href = 'admin.html';
  } catch (error) {
    showError(error.message || '登录失败，请检查用户名和密码');
  } finally {
    // 恢复按钮状态
    loginBtn.textContent = originalText;
    loginBtn.disabled = false;
    loginBtn.classList.remove('loading');
  }
});

// 页面加载时检查是否已登录
if (tokenManager.hasToken()) {
  window.location.href = 'admin.html';
}