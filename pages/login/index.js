import request from '../../utils/request';
import { API } from '../../config/api';

Page({
  data: {
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
  },

  async handleLogin() {
    try {
      // 获取微信登录凭证
      const { code } = await wx.login();
      
      if (this.data.canIUseGetUserProfile) {
        // 获取用户信息
        const userInfo = await wx.getUserProfile({
          desc: '用于完善用户资料'
        });
        
        // 调用登录接口
        const result = await request.post(API.USER.LOGIN, {
          code,
          userInfo: userInfo.userInfo
        });
        
        // 保存token
        wx.setStorageSync('token', result.token);
        wx.setStorageSync('userInfo', userInfo.userInfo);
        
        // 跳转到首页
        wx.reLaunch({ url: '/pages/index/index' });
      }
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      });
    }
  }
}); 