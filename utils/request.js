import { CONFIG } from '../config/config';

const request = {
  get(url, params = {}) {
    return this.request({
      method: 'GET',
      url,
      data: params
    });
  },
  
  post(url, data = {}) {
    return this.request({
      method: 'POST',
      url,
      data
    });
  },

  put(url, data = {}) {
    return this.request({
      method: 'PUT',
      url,
      data
    });
  },

  delete(url) {
    return this.request({
      method: 'DELETE',
      url
    });
  },
  
  request(options) {
    const token = wx.getStorageSync('token');
    const requestUrl = options.url.startsWith('http') 
      ? options.url 
      : `${CONFIG.baseURL}${options.url}`;
    
    return new Promise((resolve, reject) => {
      wx.request({
        ...options,
        url: requestUrl,
        timeout: options.timeout || CONFIG.timeout,
        header: {
          'content-type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          if (res.statusCode === 401) {
            wx.clearStorageSync();
            wx.redirectTo({
              url: '/pages/login/index'
            });
            reject(new Error('未授权，请重新登录'));
            return;
          }

          const result = res.data;
          if (result.status === 'success') {
            resolve(result);
          } else {
            reject(new Error(result.message || '请求失败'));
          }
        },
        fail: (err) => {
          console.error('请求失败:', err);
          reject(err);
        }
      });
    });
  }
};

export default request;