// app.js
import request from './utils/request';
import { API } from './config/api';

App({
  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus();
  },

  async checkLoginStatus() {
    try {
      const token = wx.getStorageSync('token');
      
      if (!token) {
        // 如果没有token，跳转到登录页
        wx.reLaunch({ url: '/pages/login/index' });
        return;
      }

      // 验证token是否有效
      const userInfo = await request.get(API.USER.GET_USER_INFO);
      this.globalData.userInfo = userInfo;
      
      // 获取用户的孩子列表
      const childrenResult = await request.get(API.CHILD.LIST);
      
      if (!childrenResult.children || childrenResult.children.length === 0) {
        // 如果没有孩子，跳转到创建孩子页面
        wx.reLaunch({ url: '/pages/children/create/index' });
      } else {
        // 如果有孩子，设置第一个孩子为选中状态
        this.globalData.selectedChild = childrenResult.children[0];
      }
      
    } catch (error) {
      console.error('登录状态检查失败:', error);
      // token无效，跳转到登录页
      wx.reLaunch({ url: '/pages/login/index' });
    }
  },

  globalData: {
    userInfo: null,
    selectedChild: null  // 当前选中的孩子
  }
})
