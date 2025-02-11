// pages/children/list/index.js
import request from '../../../utils/request';
import { API } from '../../../config/api';

const app = getApp();

Page({
  data: {
    children: [],
    loading: false,
    selectedChildId: ''  // 选中的孩子ID
  },

  onShow() {
    this.loadChildren();
    // 从全局获取选中的孩子ID
    const selectedChild = app.globalData.selectedChild;
    if (selectedChild) {
      this.setData({
        selectedChildId: selectedChild.id
      });
    }
  },

  async loadChildren() {
    try {
      this.setData({ loading: true });
      const result = await request.get(API.CHILD.LIST);
      
      if (result.status === 'success') {
        // 转换教材版本格式
        const children = (result.data || []).map(child => ({
          ...child,
          textbookVersion: child.textbook_version === 'renjiaoban' ? '人教版' : '北师大版'
        }));
        
        // 更新本地存储
        wx.setStorageSync('children', children);
        
        this.setData({
          children: children
        });
        
        // 如果没有选中的孩子，默认选中第一个
        if (!this.data.selectedChildId && children.length > 0) {
          const firstChild = children[0];
          this.setData({ selectedChildId: firstChild.id });
          app.globalData.selectedChild = firstChild;
          wx.setStorageSync('selectedChild', firstChild);
        }
      } else {
        throw new Error(result.msg || '获取孩子列表失败');
      }
    } catch (error) {
      console.error('获取孩子列表失败:', error);
      wx.showToast({
        title: error.message || '获取孩子列表失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 选择孩子
  handleSelectChild(e) {
    const { id } = e.currentTarget.dataset;
    const selectedChild = this.data.children.find(child => child.id === parseInt(id));
    
    if (selectedChild) {
      this.setData({ selectedChildId: parseInt(id) });
      // 使用 app 的统一方法更新选中的孩子
      app.updateSelectedChild(selectedChild);
      
      wx.showToast({
        title: '已选择' + selectedChild.nickname,
        icon: 'success'
      });
    }
  },

  // 编辑孩子
  handleEditChild(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/children/create/index?id=${id}`
    });
  },

  // 添加孩子
  handleAddChild() {
    wx.navigateTo({
      url: '/pages/children/create/index'
    });
  }
});