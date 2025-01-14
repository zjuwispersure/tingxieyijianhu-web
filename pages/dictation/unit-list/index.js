// pages/dictation/unit-list/index.js
import { API } from '../../../config/api';
import request from '../../../utils/request';

Page({
  data: {
    units: [],
    loading: true,
    selectedChild: null
  },

  onLoad() {
    const app = getApp();
    this.setData({
      selectedChild: app.globalData.selectedChild
    });
    this.loadUnits();
  },

  async loadUnits() {
    try {
      const result = await request.get(API.DICTATION.GET_ITEMS);
      this.setData({
        units: result.items,
        loading: false
      });
    } catch (error) {
      console.error('加载单元列表失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  handleUnitSelect(e) {
    const { unit } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/dictation/practice/index?unitId=${unit.id}`
    });
  }
});