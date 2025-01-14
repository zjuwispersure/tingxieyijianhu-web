// app.js
import request from './utils/request';
import { API } from './config/api';

App({
  onLaunch() {
    // 从本地存储加载选中的孩子
    const selectedChild = wx.getStorageSync('selectedChild');
    if (selectedChild) {
      this.globalData.selectedChild = selectedChild;
    }

    // 登录
    wx.login({
      success: async (res) => {
        if (res.status === 'success') {
          try {
            const result = await request.post(API.USER.LOGIN, {
              code: res.code
            });

            if (result && result.data) {
              this.globalData.userInfo = result.data;
              
              // 登录成功后获取孩子列表
              try {
                const childrenResult = await request.get(API.CHILD.LIST);
                if (childrenResult.status === 'success' && childrenResult.data) {
                  // 转换教材版本格式
                  const children = childrenResult.data.map(child => ({
                    ...child,
                    textbookVersion: child.textbook_version === 'rj' ? '人教版' : '北师大版'
                  }));
                  
                  // 如果本地没有选中的孩子，默认选中第一个
                  if (!this.globalData.selectedChild && children.length > 0) {
                    const firstChild = children[0];
                    this.globalData.selectedChild = firstChild;
                    wx.setStorageSync('selectedChild', firstChild);
                  }
                  
                  // 更新本地存储
                  wx.setStorageSync('children', children);
                }
              } catch (error) {
                console.error('获取孩子列表失败:', error);
              }
              
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(result.data)
              }
            }
          } catch (error) {
            console.error('登录请求失败:', error);
          }
        }
      }
    });
  },

  // 添加一个更新选中孩子的方法
  updateSelectedChild(child) {
    this.globalData.selectedChild = child;
    wx.setStorageSync('selectedChild', child);
  },

  globalData: {
    userInfo: null,
    selectedChild: null
  }
});
