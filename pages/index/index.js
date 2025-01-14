// index.js
import request from '../../utils/request';
import { API } from '../../config/api';

const app = getApp();

Page({
  data: {
    userInfo: null,
    selectedChild: null,
    recentDictations: [],
    loading: true
  },

  onLoad() {
    this.setData({
      userInfo: app.globalData.userInfo
    });
    this.loadSelectedChild();
  },

  onShow() {
    // 检查选中的孩子是否发生变化
    const currentChild = app.globalData.selectedChild;
    if (currentChild && (!this.data.selectedChild || currentChild.id !== this.data.selectedChild.id)) {
      this.setData({ selectedChild: currentChild });
      this.loadRecentDictations();
    }
  },

  // 加载选中的孩子
  async loadSelectedChild() {
    try {
      // 先从全局获取
      let selectedChild = app.globalData.selectedChild;
      
      if (!selectedChild) {
        // 如果全局没有，尝试从本地存储获取
        selectedChild = wx.getStorageSync('selectedChild');
        
        if (!selectedChild) {
          // 如果本地存储也没有，从服务器获取孩子列表并选择第一个
          const result = await request.get(API.CHILD.LIST);
          if (result.status === 'success' && result.data && result.data.length > 0) {
            // 转换教材版本格式
            const children = result.data.map(child => ({
              ...child,
              textbookVersion: child.textbook_version === 'rj' ? '人教版' : '北师大版'
            }));
            
            // 选择第一个孩子
            selectedChild = children[0];
            
            // 更新本地存储和全局状态
            wx.setStorageSync('children', children);
            app.updateSelectedChild(selectedChild);
          }
        } else {
          // 如果从本地存储找到了，更新到全局
          app.globalData.selectedChild = selectedChild;
        }
      }

      // 更新页面状态
      if (selectedChild) {
        this.setData({ selectedChild });
        this.loadRecentDictations();
      } else {
        // 如果实在没有孩子，跳转到添加孩子页面
        wx.redirectTo({
          url: '/pages/children/create/index'
        });
      }
    } catch (error) {
      console.error('加载孩子信息失败:', error);
      wx.showToast({
        title: error.message || '加载孩子信息失败',
        icon: 'none'
      });
    }
  },

  // 加载最近听写记录
  async loadRecentDictations() {
    if (!this.data.selectedChild) {
      this.setData({ loading: false });
      return;
    }

    try {
      this.setData({ loading: true });
      const result = await request.get(API.DICTATION.GET_STATISTICS, {
        child_id: this.data.selectedChild.id
      });
      
      // request 已经处理了 status 判断，这里直接使用数据
      this.setData({
        recentDictations: result.data || []
      });
    } catch (error) {
      console.error('获取听写记录失败:', error);
      wx.showToast({
        title: error.message || '获取记录失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  startDictation() {
    wx.navigateTo({
      url: '/pages/dictation/select/index'
    });
  },

  // 跳转到配置页面
  navigateToConfig() {
    if (!this.data.selectedChild) {
      wx.showToast({
        title: '请先选择孩子',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/dictation/config/index'
    });
  }
});
