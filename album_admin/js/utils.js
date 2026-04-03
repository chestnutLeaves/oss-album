import { API_BASE_URL, STORAGE_KEYS } from './config.js';

// Token管理
export const tokenManager = {
  // 获取token
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },
  
  // 设置token
  setToken(token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  },
  
  // 清除token
  removeToken() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  },
  
  // 检查是否有token
  hasToken() {
    return !!this.getToken();
  }
};

// 日期格式化
export const dateFormatter = {
  // 格式化时间戳或ISO字符串
  format(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },
  
  // 格式化为日期
  formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
};

// 自定义提示框
export function showToast(message, type = 'info') {
  // 创建提示框元素
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // 添加到页面
  document.body.appendChild(toast);
  
  // 3秒后自动移除
  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// 错误提示
export function showError(message) {
  showToast(message, 'error');
}

// 成功提示
export function showSuccess(message) {
  showToast(message, 'success');
}

// 信息提示
export function showInfo(message) {
  showToast(message, 'info');
}

// 自定义确认弹框
export function showConfirm(title, message) {
  return new Promise((resolve, reject) => {
    // 创建确认弹框元素
    const confirmModal = document.createElement('div');
    confirmModal.className = 'confirm-modal';
    confirmModal.innerHTML = `
      <div class="confirm-content">
        <div class="confirm-header">${title}</div>
        <div class="confirm-body">${message}</div>
        <div class="confirm-footer">
          <button class="btn btn-secondary cancel-btn">取消</button>
          <button class="btn btn-danger confirm-btn">确认</button>
        </div>
      </div>
    `;
    
    // 添加到页面
    document.body.appendChild(confirmModal);
    
    // 绑定取消按钮事件
    const cancelBtn = confirmModal.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(confirmModal);
      reject(false);
    });
    
    // 绑定确认按钮事件
    const confirmBtn = confirmModal.querySelector('.confirm-btn');
    confirmBtn.addEventListener('click', () => {
      document.body.removeChild(confirmModal);
      resolve(true);
    });
    
    // 点击弹框外部关闭
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) {
        document.body.removeChild(confirmModal);
        reject(false);
      }
    });
  });
}

// Request封装
export const request = async (url, options = {}) => {
  // 构建完整URL
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  // 设置默认选项
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  // 添加token
  const token = tokenManager.getToken();
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }
  
  // 合并选项
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  try {
    // 发送请求
    const response = await fetch(fullUrl, mergedOptions);
    
    // 检查HTTP状态码
    if (response.status === 401 || response.status === 403) {
      tokenManager.removeToken();
      // 使用setTimeout确保跳转能够执行
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 100);
      throw new Error('登录已过期，请重新登录');
    }
    
    // 解析响应
    const data = await response.json();
    
    // 检查响应状态
    if (data.code !== 0) {
      // 处理401和403错误
      if (data.code === 401 || data.code === 403) {
        tokenManager.removeToken();
        // 使用setTimeout确保跳转能够执行
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 100);
        throw new Error('登录已过期，请重新登录');
      }
      throw new Error(data.message || '操作失败');
    }
    
    return data.data;
  } catch (error) {
    console.error('请求错误:', error);
    // 将 "Failed to fetch" 替换为更友好的提示
    if (error.message === 'Failed to fetch') {
      throw new Error('网络连接失败，请检查服务器是否可用');
    }
    throw error;
  }
};

// 简化的请求方法
export const api = {
  get(url, params) {
    let queryString = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value);
        }
      });
      queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    }
    
    return request(`${url}${queryString}`, {
      method: 'GET',
    });
  },
  
  post(url, data) {
    return request(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  put(url, data, params) {
    let queryString = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value);
        }
      });
      queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    }
    
    return request(`${url}${queryString}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete(url) {
    return request(url, {
      method: 'DELETE',
    });
  }
};