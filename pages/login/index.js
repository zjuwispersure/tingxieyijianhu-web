import request from '../../utils/request';
import { API } from '../../config/api';

Page({
  data: {
    loading: false
  },

  // 获取用户信息并登录
  async getUserProfile() {
    console.log('getUserProfile 被调用');
    if (this.data.loading) return;
    
    try {
      this.setData({ loading: true });

      // 获取用户信息（如果用户拒绝也继续登录流程）
      let userInfo = null;
      try {
        console.log('准备调用 wx.getUserProfile');
        const userProfile = await wx.getUserProfile({
          desc: '用于完善用户资料'
        });
        console.log('wx.getUserProfile 调用成功:', userProfile);
        userInfo = userProfile.userInfo;
      } catch (e) {
        console.log('用户拒绝授权获取信息，使用默认值:', e);
        userInfo = {
          nickName: '微信用户',
          avatarUrl: '/assets/images/default-avatar.png'
        };
      }

      // 继续登录流程
      await this.handleLogin(userInfo);
      
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 登录处理
  async handleLogin(userInfo) {
    try {
      console.log('开始登录流程');
      const loginRes = await wx.login();
      console.log('获取到登录凭证:', loginRes.code);
      
      // 调用登录接口
      const loginResult = await request.post(API.USER.LOGIN, {
        code: loginRes.code,
        userInfo
      });
      console.log('登录接口返回:', loginResult);
      
      if (loginResult.status === 'success') { 
        // 保存用户信息
        const userData = loginResult.data;
        console.log('保存的用户信息:', userData);
        const token = userData.access_token;
        wx.setStorageSync('token', token);
        wx.setStorageSync('userInfo', userData.user);
        getApp().globalData.userInfo = userData.user;
        
        // 登录成功后获取孩子信息
        try {
          const childrenCountResult = await request.get(API.CHILD.COUNT);
          console.log('获取孩子数量结果:', childrenCountResult);
          
          if (childrenCountResult.status !== 'success') {
            throw new Error(childrenCountResult.message || '获取孩子信息失败');
          }
          
          // 延迟跳转
          setTimeout(() => {
            if (childrenCountResult.data.total === 0) {
              // 没有孩子时跳转到创建页面
              console.log('没有孩子信息，跳转到创建页面');
              wx.redirectTo({
                url: '/pages/children/create/index'
              });
            } else {
              // 有孩子时直接跳转到首页
              console.log('有孩子信息，跳转到首页');
              wx.switchTab({
                url: '/pages/index/index'
              });
            }
          }, 1500);
          
        } catch (error) {
          console.error('获取孩子配置信息失败:', error);
          wx.showToast({
            title: error.message || '获取孩子信息失败',
            icon: 'none',
            duration: 2000
          });
          return;
        }
        
      } else {
        throw new Error(loginResult.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败，详细错误:', error);
      throw error;
    }
  }
}); 