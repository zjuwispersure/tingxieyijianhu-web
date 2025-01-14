// pages/dictation/select/index.js
import request from '../../../utils/request';
import { API } from '../../../config/api';

const app = getApp();

Page({
  data: {
    selectedChild: null,
    dictationConfig: null,
    loading: false
  },

  onShow() {
    const selectedChild = app.globalData.selectedChild;
    if (selectedChild) {
      this.setData({ selectedChild });
      this.loadDictationConfig();
    } else {
      wx.showToast({
        title: '请先选择孩子',
        icon: 'none'
      });
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/children/list/index'
        });
      }, 1500);
    }
  },

  // 加载听写配置
  async loadDictationConfig() {
    try {
      // 先从本地获取配置
      const localConfig = wx.getStorageSync(`dictationConfig_${this.data.selectedChild.id}`);
      
      if (localConfig && new Date().getTime() - localConfig.updateTime < 24 * 60 * 60 * 1000) {
        this.setData({ dictationConfig: localConfig });
      } else {
        // 从服务器获取
        const result = await request.get(API.DICTATION.GET_CONFIG, {
          child_id: this.data.selectedChild.id
        });
        
        if (resultstatus == 'success') {
          const config = {
            ...result.data,
            updateTime: new Date().getTime()
          };
          wx.setStorageSync(`dictationConfig_${this.data.selectedChild.id}`, config);
          this.setData({ dictationConfig: config });
        }
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      // 使用默认配置
      this.setData({
        dictationConfig: {
          dictationMode: 'unit',
          wordsPerDictation: 10,
          reviewDays: 3,
          dictationInterval: 5,
          dictationRatio: 100,
          wrongWordsOnly: false
        }
      });
    }
  },

  // 开始听写
  async startDictation() {
    if (!this.data.dictationConfig) {
      wx.showToast({
        title: '配置加载中，请稍后',
        icon: 'none'
      });
      return;
    }

    try {
      this.setData({ loading: true });
      const config = this.data.dictationConfig;
      
      // 根据模式选择不同的接口
      const api = config.dictationMode === 'unit' ? 
        API.DICTATION.START_UNIT : 
        API.DICTATION.START_SMART;

      const serverConfig = {
        child_id: this.data.selectedChild.id,
        words_per_dictation: config.wordsPerDictation,
        review_days: config.reviewDays,
        dictation_interval: config.dictationInterval,
        dictation_ratio: config.dictationRatio,
        wrong_words_only: config.wrongWordsOnly,
        dictation_mode: config.dictationMode
      };

      const result = await request.post(api, serverConfig);

      if (resultstatus == 'success') {
        wx.navigateTo({
          url: `/pages/dictation/practice/index?id=${result.data.id}`
        });
      } else {
        throw new Error(result.msg || '开始听写失败');
      }
    } catch (error) {
      console.error('开始听写失败:', error);
      wx.showToast({
        title: error.message || '开始听写失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 跳转到配置页面
  navigateToConfig() {
    wx.navigateTo({
      url: '/pages/dictation/config/index'
    });
  }
});