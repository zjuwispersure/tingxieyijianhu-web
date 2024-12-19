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
      userInfo: app.globalData.userInfo,
      selectedChild: app.globalData.selectedChild
    });
    this.loadRecentDictations();
  },

  async loadRecentDictations() {
    try {
      if (!this.data.selectedChild) return;
      
      const result = await request.get(
        API.STATISTICS.GET_SUMMARY(this.data.selectedChild.id)
      );
      
      this.setData({
        recentDictations: result.recentDictations || [],
        loading: false
      });
    } catch (error) {
      console.error('加载最近听写记录失败:', error);
      this.setData({ loading: false });
    }
  },

  startDictation() {
    wx.navigateTo({
      url: '/pages/dictation/select/index'
    });
  }
});
