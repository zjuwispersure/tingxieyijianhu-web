import request from '../../utils/request';
import { API } from '../../config/api';

// 获取应用实例
const app = getApp();

Page({
  data: {
    loading: false
  },

  // 获取用户信息并登录
  async getUserProfile(e) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      // 1. 先获取用户信息
      const userProfileRes = await wx.getUserProfile({
        desc: '用于完善用户资料'
      });
      console.log('wx.getUserProfile 调用成功:', userProfileRes);
      
      // 2. 传入用户信息进行登录
      const loginResult = await app.login(userProfileRes.userInfo);
      
      // 3. 获取孩子列表
      const children = await app.fetchChildrenList();
      
      // 4. 根据孩子列表状态决定跳转
      if (children.length === 0) {
        // 没有孩子时跳转到创建页面
        console.log('没有孩子信息，跳转到创建页面');
        wx.redirectTo({
          url: '/pages/children/create/index'
        });
      } else {
        // 有孩子时直接跳转到首页
        console.log('有孩子信息，跳转到首页');
        wx.switchTab({
          url: '/pages/dictation/index/index'
        });
      }
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      this.setData({ loading: false });
    }
  },
}); 