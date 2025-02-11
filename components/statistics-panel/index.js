import request from '../../utils/request';
import { API } from '../../config/api';

Component({
  properties: {
    showDaily: {
      type: Boolean,
      value: true
    },
    showOverall: {
      type: Boolean,
      value: true
    }
  },

  data: {
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
        avg_score: 0,
        best_score: 0
      }
    }
  },

  lifetimes: {
    attached() {
      this.fetchStatistics();
    }
  },

  methods: {
    async fetchStatistics() {
      try {
        const app = getApp();
        const selectedChild = app.globalData.selectedChild;
        if (!selectedChild) return;
        
        const [dailyStats, overallStats] = await Promise.all([
          request.get(API.DICTATION.GET_STATISTICS.DAILY, { child_id: selectedChild.id }),
          request.get(API.DICTATION.GET_STATISTICS.OVERALL, { child_id: selectedChild.id })
        ]);
        
        if (dailyStats.status === 'success' && overallStats.status === 'success') {
          console.log('原始统计数据:', {
            daily: dailyStats.data,
            overall: overallStats.data
          });
          
          // 预处理日常统计数据
          const daily = dailyStats.data || {};
          // 如果正确率小于1，说明是小数形式，需要转换为百分比
          if (daily.accuracy && daily.accuracy < 1) {
            daily.accuracy = Math.round(daily.accuracy * 100);
          }
          
          // 预处理整体统计数据
          const overall = overallStats.data || {};
          if (overall) {
            // 处理分数，确保为整数
            overall.avg_score = overall.avg_score ? Math.round(overall.avg_score) : 0;
            overall.best_score = overall.best_score ? Math.round(overall.best_score) : 0;
            // 如果正确率小于1，说明是小数形式，需要转换为百分比
            if (overall.accuracy && overall.accuracy < 1) {
              overall.accuracy = Math.round(overall.accuracy * 100);
            }
          }
          
          this.setData({
            statistics: {
              daily,
              overall
            }
          });
          
          console.log('统计面板数据处理后:', this.data.statistics);
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      }
    },

    refresh() {
      return this.fetchStatistics();
    }
  }
}); 