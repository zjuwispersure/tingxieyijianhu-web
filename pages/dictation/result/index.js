// pages/dictation/result/index.js
import request from '../../../utils/request';
import { API } from '../../../config/api';

Page({
  data: {
    dictationId: '',
    words: [],
    results: [],
    statistics: null,
    loading: true
  },

  onLoad(options) {
    const { id } = options;
    this.setData({ dictationId: id });
    this.loadDictationWords();
  },

  async loadDictationWords() {
    try {
      const result = await request.get(API.DICTATION.GET_WORDS(this.data.dictationId));
      this.setData({
        words: result.words,
        results: new Array(result.words.length).fill(null),
        loading: false
      });
    } catch (error) {
      console.error('加载听写内容失败:', error);
      this.setData({ loading: false });
    }
  },

  onResultChange(e) {
    const { index } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    const results = [...this.data.results];
    results[index] = value;
    
    this.setData({ results });
  },

  async handleSubmit() {
    try {
      const { results } = this.data;
      
      // 检查是否所有词语都已判定
      if (results.includes(null)) {
        wx.showToast({
          title: '请完成所有词语的判定',
          icon: 'none'
        });
        return;
      }

      // 提交结果
      const result = await request.post(
        API.DICTATION.SUBMIT_RESULT(this.data.dictationId),
        { results }
      );

      this.setData({
        statistics: result.statistics
      });

      // 显示结果统计
      wx.showModal({
        title: '听写完成',
        content: `本次听写共${result.statistics.total}个词语，正确${result.statistics.correct}个，正确率${result.statistics.accuracy}%`,
        showCancel: false,
        success: () => {
          // 返回首页
          wx.switchTab({
            url: '/pages/index/index'
          });
        }
      });

    } catch (error) {
      console.error('提交结果失败:', error);
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      });
    }
  }
});