import request from '../../../utils/request';
import { API } from '../../../config/api';
import { TextbookVersionUtil } from '../../../config/constants';

const app = getApp();

Page({
  data: {
    selectedChild: null,
    units: [],  // 保留 units 作为组织结构
    loading: false,
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '听写本'
    });

    const selectedChild = app.globalData.selectedChild;
    this.setData({ selectedChild });
    this.fetchLessonsData();
  },

  // 获取课文数据
  async fetchLessonsData() {
    if (!this.data.selectedChild) {
      wx.showToast({
        title: '请先选择孩子',
        icon: 'none'
      });
      return;
    }

    const { grade, semester, textbookVersion } = this.data.selectedChild;
    // 直接使用后端格式的版本代号
    const version = TextbookVersionUtil.formatVersion(textbookVersion);

    try {
      this.setData({ loading: true });

      const result = await request.get(API.DICTATION.GET_ALL_LESSONS, {
        grade,
        semester,
        version
      });

      if (result.status === 'success' && result.data) {
        // 按单元组织课文数据
        const unitsMap = {};
        result.data.forEach(lesson => {
          if (!unitsMap[lesson.unit]) {
            unitsMap[lesson.unit] = {
              unit: lesson.unit,
              lessons: []
            };
          }
          unitsMap[lesson.unit].lessons.push({
            lesson: lesson.lesson,
            title: lesson.name,
            isYuWenYuanDi: lesson.lesson === 99  // 标记是否为语文园地
          });
        });

        // 转换为数组并按单元序号排序
        const units = Object.values(unitsMap).sort((a, b) => a.unit - b.unit);
        console.log('组织后的单元数据:', units);

        this.setData({ 
          units,
          loading: false 
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('获取课文列表失败:', error);
      wx.showToast({
        title: '获取课文列表失败',
        icon: 'none'
      });
      return false;
    } finally {
      this.setData({ loading: false });
    }
  },

  // 处理课文选择
  handleLessonSelect(e) {
    const { unit, lesson } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/dictation/words/index?unit=${unit}&lesson=${lesson}`
    });
  },

  onShow() {
    // 刷新统计面板
    this.selectComponent('#statsPanel').refresh();
  }
}); 