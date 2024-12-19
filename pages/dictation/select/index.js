// pages/dictation/select/index.js
import request from '../../../utils/request';
import { API } from '../../../config/api';

const app = getApp();

Page({
  data: {
    selectedChild: null,
    mode: 'unit', // unit: 单元听写, review: 复习听写
    selectedModeIndex: 0,
    config: {
      wordCount: 10,
      repeatTimes: 2,
      interval: 3,
      priorityError: false
    },
    modes: [
      { id: 'unit', name: '单元听写' },
      { id: 'review', name: '复习听写' }
    ],
    wordCounts: [5, 10, 15, 20],
    repeatTimesList: [1, 2, 3],
    intervalList: [2, 3, 4, 5],
    selectedWordCountIndex: 1,
    selectedRepeatTimesIndex: 1,
    selectedIntervalIndex: 1
  },

  onLoad() {
    this.setData({
      selectedChild: app.globalData.selectedChild
    });
  },

  onModeChange(e) {
    const index = e.detail.value;
    this.setData({
      mode: this.data.modes[index].id,
      selectedModeIndex: index
    });
  },

  onConfigChange(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    switch(field) {
      case 'wordCount':
        this.setData({
          'config.wordCount': this.data.wordCounts[value],
          selectedWordCountIndex: value
        });
        break;
      case 'repeatTimes':
        this.setData({
          'config.repeatTimes': this.data.repeatTimesList[value],
          selectedRepeatTimesIndex: value
        });
        break;
      case 'interval':
        this.setData({
          'config.interval': this.data.intervalList[value],
          selectedIntervalIndex: value
        });
        break;
      case 'priorityError':
        this.setData({
          'config.priorityError': value
        });
        break;
    }
  },

  async handleStart() {
    try {
      const { mode, config } = this.data;
      
      // 创建听写练习
      const result = await request.post(API.DICTATION.CREATE, {
        mode,
        config,
        childId: this.data.selectedChild.id
      });

      // 跳转到听写页面
      wx.navigateTo({
        url: `/pages/dictation/practice/index?id=${result.dictationId}`
      });
    } catch (error) {
      console.error('创建听写失败:', error);
      wx.showToast({
        title: '创建失败，请重试',
        icon: 'none'
      });
    }
  }
});