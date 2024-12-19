import { API } from '../config/api';

const request = {
  async get(url, params = {}) {
    return this.request('GET', url, params);
  },
  
  async post(url, data = {}) {
    return this.request('POST', url, data);
  },
  
  async request(method, url, data = {}) {
    try {
      const token = wx.getStorageSync('token');
      
      const response = await wx.request({
        url,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      
      if (response.statusCode === 401) {
        // token过期，重新登录
        wx.redirectTo({ url: '/pages/login/index' });
        return;
      }
      
      if (response.statusCode !== 200) {
        throw new Error(response.data.message || '请求失败');
      }
      
      return response.data;
    } catch (error) {
      wx.showToast({
        title: error.message,
        icon: 'none'
      });
      throw error;
    }
  }
};

export default request; 