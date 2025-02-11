import request from '../../../utils/request';
import { API } from '../../../config/api';
import { TextbookVersionUtil } from '../../../config/constants';

const app = getApp();

Page({
  data: {
    unit: null,
    lesson: null,
    lessonTitle: '',
    words: [],
    wrongWords: [],  // 错误统计
    selectedWords: new Set(),
    totalCount: 0,
    loading: false,
    showConfigModal: false,
    // 听写配置
    config: {
      mode: 'order', // order-顺序, random-随机
      repeatCount: 2, // 重复次数
      interval: 5,    // 间隔时间(秒)
    }
  },

  onLoad(options) {
    const { unit, lesson } = options;
    this.setData({
      unit: Number(unit),
      lesson: Number(lesson)
    });
    
    this.loadLocalConfig();
    this.fetchWords();
    this.fetchUnitStats();
  },

  // 加载本地缓存的配置
  loadLocalConfig() {
    const cacheKey = 'dictation_unit_config';  // 单元模式的配置缓存key
    const cachedConfig = wx.getStorageSync(cacheKey);
    if (cachedConfig) {
      this.setData({
        config: cachedConfig
      });
    }
  },

  // 保存配置到本地
  saveLocalConfig() {
    const cacheKey = 'dictation_unit_config';
    wx.setStorageSync(cacheKey, this.data.config);
  },

  // 获取词语列表
  async fetchWords() {
    try {
      this.setData({ loading: true });
      
      const selectedChild = app.globalData.selectedChild;
      if (!selectedChild) {
        throw new Error('请先选择孩子');
      }

      const result = await request.get(API.DICTATION.GET_LESSON_WORDS, {
        unit: this.data.unit,
        lesson: this.data.lesson,
        grade: selectedChild.grade,
        semester: selectedChild.semester,
        version: TextbookVersionUtil.formatVersion(selectedChild.textbookVersion)
      });

      if (result.status === 'success' && result.data) {
        const words = result.data.map(word => ({
          id: word.id,
          word: word.word,
          pinyin: word.pinyin,
          hint: word.hint,
          audio_url: word.audio_url,
          characters: word.word.split(''),  // 将汉字拆分为数组
          selected: true  // 默认全选
        }));

        this.setData({
          lessonTitle: result.data[0]?.lesson_name || `第${this.data.lesson}课`,
          words,
          totalCount: words.length,
          selectedWords: new Set(words.map(w => w.id))
        });
      }
    } catch (error) {
      console.error('获取词语列表失败:', error);
      wx.showToast({
        title: '获取词语列表失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 选择/取消选择单个词语
  toggleWord(e) {
    const { index } = e.currentTarget.dataset;
    const { words, selectedWords } = this.data;
    const word = words[index];
    const newSelected = !word.selected;
    
    this.setData({
      [`words[${index}].selected`]: newSelected
    });

    if (newSelected) {
      selectedWords.add(word.id);
    } else {
      selectedWords.delete(word.id);
    }

    this.setData({
      selectedWords,
      totalCount: selectedWords.size
    });
  },

  // 全选/取消全选
  toggleAll() {
    const { words } = this.data;
    const allSelected = words.every(w => w.selected);
    const newWords = words.map(w => ({
      ...w,
      selected: !allSelected
    }));
    
    this.setData({
      words: newWords,
      selectedWords: !allSelected ? new Set(words.map(w => w.id)) : new Set(),
      totalCount: !allSelected ? words.length : 0
    });
  },

  // 显示听写设置
  showConfig() {
    this.setData({
      showConfigModal: true
    });
  },

  // 更新听写模式
  updateMode(e) {
    this.setData({
      'config.mode': e.currentTarget.dataset.mode
    }, () => {
      this.saveLocalConfig();
    });
  },

  // 更新重复次数
  updateRepeatCount(e) {
    this.setData({
      'config.repeatCount': Number(e.currentTarget.dataset.count)
    }, () => {
      this.saveLocalConfig();
    });
  },

  // 更新间隔时间
  updateInterval(e) {
    this.setData({
      'config.interval': Number(e.currentTarget.dataset.interval)
    }, () => {
      this.saveLocalConfig();
    });
  },

  // 开始听写
  handleStartDictation() {
    const { words } = this.data;
    const selectedWords = words.filter(w => w.selected);
    
    if (selectedWords.length === 0) {
      wx.showToast({
        title: '请至少选择一个词语',
        icon: 'none'
      });
      return;
    }

    // 先创建听写会话
    request.post(API.DICTATION.START_LESSON, {
      child_id: app.globalData.selectedChild.id,
      name: '听写练习',
      items: selectedWords.map(word => word.id),
      config: {
        dictation_interval: this.data.config.interval,
        retry_limit: this.data.config.repeatCount,
        auto_play: true,
        wrong_words_only: false,
        random_order: this.data.config.mode === 'random'
      }
    }).then(result => {
      if (result.status === 'success') {
        // 将听写会话ID和词语列表传递给练习页面
        const wordsStr = encodeURIComponent(JSON.stringify(selectedWords));
        const configStr = encodeURIComponent(JSON.stringify(this.data.config));
        wx.navigateTo({
          url: `/pages/dictation/practice/index?words=${wordsStr}&config=${configStr}&session_id=${Number(result.data.session_id)}`
        });
      } else {
        throw new Error(result.message || '创建听写会话失败');
      }
    }).catch(error => {
      console.error('创建听写会话失败:', error);
      wx.showToast({
        title: error.message || '创建听写会话失败',
        icon: 'none'
      });
    });
  },

  // 隐藏听写设置
  hideConfig() {
    this.setData({
      showConfigModal: false
    });
  },

  // 点击遮罩层关闭
  onModalTap() {
    this.hideConfig();
  },

  // 阻止冒泡
  onModalContentTap(e) {
    e.stopPropagation();
  },

  // 获取单元错误统计
  async fetchUnitStats() {
    try {
      const selectedChild = app.globalData.selectedChild;
      if (!selectedChild) return;
      
      const result = await request.get(API.DICTATION.GET_STATISTICS.UNIT, {
        child_id: selectedChild.id,
        unit: this.data.unit,
        lesson: this.data.lesson
      });
      
      if (result.status === 'success') {
        // 将错误统计信息与词语列表合并
        const wrongWords = result.data.words;
        const words = this.data.words.map(word => {
          const wrongInfo = wrongWords.find(w => w.id === word.id);
          return {
            ...word,
            error_count: wrongInfo?.error_count || 0,
            total_count: wrongInfo?.total_count || 0
          };
        });
        
        this.setData({ words, wrongWords });
      }
    } catch (error) {
      console.error('获取单元统计失败:', error);
    }
  }
}); 