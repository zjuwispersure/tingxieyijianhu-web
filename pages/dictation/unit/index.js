import request from '../../../utils/request';
import { API } from '../../../config/api';

Page({
  data: {
    units: [],
    loading: true,
    selectedChild: null,
    statistics: {
      todayCount: 0,
      totalCount: 0
    }
  },

  onLoad() {
    this.setData({
      selectedChild: getApp().globalData.selectedChild
    });
    this.loadUnits();
    this.loadStatistics();
  },

  // 加载单元列表
  async loadUnits() {
    try {
      const result = await request.get(API.DICTATION.GET_ITEMS, {
        child_id: this.data.selectedChild.id
      });
      
      if (result.status === 'success') {
        this.setData({
          units: result.data.units || []
        });
      }
    } catch (error) {
      console.error('加载单元失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载统计信息
  async loadStatistics() {
    try {
      const result = await request.get(API.DICTATION.GET_STATISTICS, {
        child_id: this.data.selectedChild.id
      });
      
      if (result.status === 'success') {
        this.setData({
          statistics: result.data
        });
      }
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  },

  // 打开单元详情
  handleUnitTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/dictation/words/index?unitId=${id}`
    });
  },

  // 打开设置
  handleOpenSettings() {
    wx.navigateTo({
      url: '/pages/dictation/config/index'
    });
  }
}); 