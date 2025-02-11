import request from '../../../utils/request';
import { API } from '../../../config/api';

const app = getApp();

Page({
  data: {
    // 当前选中的孩子信息
    selectedChild: null,
    // 听写模式选项
    modes: [
      {
        title: '课文模式',
        desc: '按照课文顺序练习',
        icon: '/assets/images/unit-mode.png',
        mode: 'unit'
      },
      {
        title: '智能模式',
        desc: '根据学习情况智能推荐',
        icon: '/assets/images/smart-mode.png',
        mode: 'smart'
      }
    ],
    // 听写统计数据
    statistics: {
      daily: {
        total: 0,
        correct: 0,
        accuracy: 0
      },
      overall: {
        total: 0,
        correct: 0,
        accuracy: 0,
        week_count: 0,
        month_count: 0,
        avg_score: null,
        best_score: null
      }
    }
  },

  onLoad() {
    // 获取当前选中的孩子
    const selectedChild = app.globalData.selectedChild;
    this.setData({ selectedChild });
    
    // 如果有选中的孩子才获取统计数据
    if (selectedChild) {
      this.fetchAllStatistics();
    }
  },

  // 获取所有统计数据
  async fetchAllStatistics() {
    try {
      const selectedChild = app.globalData.selectedChild;
      if (!selectedChild) return;
      
      // 并行请求统计数据
      const [dailyStats, overallStats] = await Promise.all([
        request.get(API.DICTATION.GET_STATISTICS.DAILY, { child_id: selectedChild.id }),
        request.get(API.DICTATION.GET_STATISTICS.OVERALL, { child_id: selectedChild.id })
      ]);
      
      if (dailyStats.status === 'success' && overallStats.status === 'success') {
        // 预处理日常统计数据
        const daily = dailyStats.data || {};
        if (daily.accuracy) {
          daily.accuracy = Math.round(daily.accuracy);
        }
        
        // 预处理整体统计数据
        const overall = overallStats.data || {};
        if (overall) {
          // 处理分数，确保为整数
          overall.avg_score = overall.avg_score ? Math.round(overall.avg_score) : 0;
          overall.best_score = overall.best_score ? Math.round(overall.best_score) : 0;
          overall.accuracy = Math.round(overall.accuracy);
        }
        
        this.setData({
          statistics: {
            daily,
            overall
          }
        });
        
        console.log('处理后的统计数据:', {
          daily: this.data.statistics.daily,
          overall: this.data.statistics.overall
        });
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  },

  onShow() {
    // 每次页面显示时重新获取统计数据
    this.fetchAllStatistics();
  },

  // 处理模式选择
  handleModeSelect(e) {
    const { mode } = e.currentTarget.dataset;
    
    if (mode === 'unit') {
      // 跳转到听写本页面
      wx.navigateTo({
        url: '/pages/dictation/lesson/index'
      });
    } else if (mode === 'smart') {
      // 跳转到智能听写页面
      wx.navigateTo({
        url: '/pages/dictation/smart/index'
      });
    }
  }
}); 