// pages/children/list/index.js
import request from '../../../utils/request';
import { API } from '../../../config/api';

const app = getApp();

Page({
  data: {
    children: []
  },

  onShow() {
    this.loadChildren();
  },

  async loadChildren() {
    try {
      const result = await request.get(API.CHILD.LIST);
      this.setData({
        children: result.children || []
      });
    } catch (error) {
      console.error('加载孩子列表失败:', error);
    }
  },

  navigateToCreate() {
    wx.navigateTo({
      url: '/pages/children/create/index'
    });
  },

  selectChild(e) {
    const { id } = e.currentTarget.dataset;
    const child = this.data.children.find(item => item.id === id);
    if (child) {
      app.globalData.selectedChild = child;
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  editChild(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/children/create/index?id=${id}`
    });
  }
});