import request from '../../../utils/request';
import { API } from '../../../config/api';

const app = getApp();

Page({
  data: {
    config: {
      childId: '',                  // 孩子ID
      wordsPerDictation: 10,       // 每次听写词数
      reviewDays: 3,               // 复习间隔天数
      dictationInterval: 5,        // 听写间隔秒数
      dictationRatio: 100,         // 听写比例
      wrongWordsOnly: false,       // 是否只听写错词
      dictationMode: 'unit',       // 听写模式：unit-单元听写，smart-智能听写
      playCount: 2                 // 词语播放次数
    },
    modes: [
      { value: 'unit', name: '单元听写' },
      { value: 'smart', name: '智能听写' }
    ],
    counts: [5, 10, 15, 20],
    reviewDays: [1, 3, 5, 7],
    intervals: [
      { value: 3, name: '3秒' },
      { value: 5, name: '5秒' },
      { value: 8, name: '8秒' },
      { value: 10, name: '10秒' }
    ],
    ratios: [
      { value: 100, name: '全部' },
      { value: 80, name: '80%' },
      { value: 50, name: '50%' },
      { value: 30, name: '30%' }
    ],
    countIndex: 1,
    reviewIndex: 1,
    intervalIndex: 1,
    ratioIndex: 0,
    modeIndex: 0,
    loading: false,
    playCounts: [1, 2, 3],         // 添加播放次数选项
    playCountIndex: 1,             // 默认选中2次
    activeTip: null,  // 当前显示的提示索引
    tips: {
      0: "选择单元听写或智能听写模式",
      1: "每次听写的词语数量",
      2: "复习词语的时间间隔",
      3: "每个词语之间的间隔时间",
      4: "本单元词语的听写比例",
      5: "只听写之前写错的词语",
      6: "每个词语播放的次数"
    }
  },

  onLoad() {
    const selectedChild = getApp().globalData.selectedChild;
    if (selectedChild) {
      this.setData({
        'config.childId': selectedChild.id
      });
      this.loadConfig();
    }
  },

  // 听写数量改变
  onCountChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'config.wordsPerDictation': this.data.counts[index],
      countIndex: index
    });
  },

  // 复习天数改变
  onReviewDaysChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'config.reviewDays': this.data.reviewDays[index],
      reviewIndex: index
    });
  },

  // 听写间隔改变
  onIntervalChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'config.dictationInterval': this.data.intervals[index].value,
      intervalIndex: index
    });
  },

  // 听写比例改变
  onRatioChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'config.dictationRatio': this.data.ratios[index].value,
      ratioIndex: index
    });
  },

  // 只听写错词开关
  onWrongWordsChange(e) {
    this.setData({
      'config.wrongWordsOnly': e.detail.value
    });
  },

  // 听写模式改变
  onModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    console.log('切换模式:', mode);  // 添加日志
    console.log('当前配置:', this.data.config);  // 添加日志
    
    this.setData({
      'config.dictationMode': mode
    }, () => {
      console.log('切换后配置:', this.data.config);  // 添加日志
    });
  },

  // 播放次数改变
  onPlayCountChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'config.playCount': this.data.playCounts[index],
      playCountIndex: index
    });
  },

  // 保存配置
  async handleSave() {
    try {
      this.setData({ loading: true });
      
      // 转换为服务器需要的格式
      const serverConfig = {
        child_id: this.data.config.childId,
        words_per_dictation: this.data.config.wordsPerDictation,
        review_days: this.data.config.reviewDays,
        dictation_interval: this.data.config.dictationInterval,
        dictation_ratio: this.data.config.dictationRatio,
        wrong_words_only: this.data.config.wrongWordsOnly,
        dictation_mode: this.data.config.dictationMode,
        play_count: this.data.config.playCount
      };

      const result = await request.post(API.DICTATION.UPDATE_CONFIG, serverConfig);
      
      if (result.status === 'success') {
        // 更新本地缓存
        const selectedChild = getApp().globalData.selectedChild;
        if (selectedChild) {
          wx.setStorageSync(`dictationConfig_${selectedChild.id}`, {
            config: {
              child_id: selectedChild.id,
              words_per_dictation: this.data.config.wordsPerDictation,
              review_days: this.data.config.reviewDays,
              dictation_interval: this.data.config.dictationInterval,
              dictation_ratio: this.data.config.dictationRatio,
              wrong_words_only: this.data.config.wrongWordsOnly,
              dictation_mode: this.data.config.dictationMode,
              play_count: this.data.config.playCount
            },
            updateTime: new Date().getTime()
          });
        }

        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });

        // 等待提示显示完成后返回
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }

    } catch (error) {
      console.error('保存配置失败:', error);
      wx.showToast({
        title: error.message || '保存失败，请稍后重试',
        icon: 'none',
        duration: 2000
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadConfig() {
    try {
      this.setData({ loading: true });
      const selectedChild = getApp().globalData.selectedChild;
      if (!selectedChild) return;

      // 先尝试从本地获取配置
      const localConfig = wx.getStorageSync(`dictationConfig_${selectedChild.id}`);
      
      if (localConfig && new Date().getTime() - localConfig.updateTime < 24 * 60 * 60 * 1000) {
        this.setConfigData(localConfig.config);  // 从本地存储读取时使用 config 字段
      } else {
        // 否则从服务器获取
        const result = await request.get(API.DICTATION.GET_CONFIG, {
          child_id: selectedChild.id
        });
        
        if (result.status === 'success') {  // 使用严格相等
          this.setConfigData(result.data.config);  // 从 data.config 中获取配置
          
          // 保存到本地存储时，保持原有结构
          wx.setStorageSync(`dictationConfig_${selectedChild.id}`, {
            config: result.data.config,  // 保存 config 对象
            updateTime: new Date().getTime()
          });
        } else {
          throw new Error(result.message || '获取配置失败');
        }
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      wx.showToast({
        title: error.message || '加载配置失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 设置配置数据和索引
  setConfigData(config) {
    console.log('原始配置:', config);  // 添加日志
    
    // 设置默认值
    const defaultConfig = {
      wordsPerDictation: 10,
      reviewDays: 3,
      dictationInterval: 5,
      dictationRatio: 100,
      wrongWordsOnly: false,
      dictationMode: 'unit',
      playCount: 2
    };

    // 转换服务器返回的下划线命名为驼峰命名
    const convertedConfig = {
      childId: config.child_id,
      wordsPerDictation: config.words_per_dictation,
      reviewDays: config.review_days,
      dictationInterval: config.dictation_interval,
      dictationRatio: config.dictation_ratio,
      wrongWordsOnly: config.wrong_words_only,
      dictationMode: config.dictation_mode,
      playCount: config.play_count
    };

    // 合并配置，确保所有字段都有值
    const mergedConfig = {
      ...defaultConfig,
      ...convertedConfig
    };

    const countIndex = this.data.counts.indexOf(mergedConfig.wordsPerDictation);
    const reviewIndex = this.data.reviewDays.indexOf(mergedConfig.reviewDays);
    const intervalIndex = this.data.intervals.findIndex(i => i.value === mergedConfig.dictationInterval);
    const ratioIndex = this.data.ratios.findIndex(i => i.value === mergedConfig.dictationRatio);
    const playCountIndex = this.data.playCounts.indexOf(mergedConfig.playCount);

    console.log('转换后配置:', mergedConfig);  // 添加日志
    
    this.setData({
      config: mergedConfig,
      countIndex: countIndex >= 0 ? countIndex : 1,
      reviewIndex: reviewIndex >= 0 ? reviewIndex : 1,
      intervalIndex: intervalIndex >= 0 ? intervalIndex : 1,
      ratioIndex: ratioIndex >= 0 ? ratioIndex : 0,
      playCountIndex: playCountIndex >= 0 ? playCountIndex : 1
    });
  },

  // 听写数量输入
  onWordsPerDictationInput(e) {
    let value = parseInt(e.detail.value);
    if (isNaN(value)) value = 10;
    value = Math.min(Math.max(value, 1), 100);
    this.setData({
      'config.wordsPerDictation': value
    });
  },

  // 复习间隔输入
  onReviewDaysInput(e) {
    let value = parseInt(e.detail.value);
    if (isNaN(value)) value = 3;
    value = Math.min(Math.max(value, 1), 30);
    this.setData({
      'config.reviewDays': value
    });
  },

  // 听写间隔输入
  onDictationIntervalInput(e) {
    let value = parseInt(e.detail.value);
    if (isNaN(value)) value = 5;
    value = Math.min(Math.max(value, 1), 30);
    this.setData({
      'config.dictationInterval': value
    });
  },

  // 听写比例输入
  onDictationRatioInput(e) {
    let value = parseInt(e.detail.value);
    if (isNaN(value)) value = 100;
    value = Math.min(Math.max(value, 1), 100);
    this.setData({
      'config.dictationRatio': value
    });
  },

  // 播放次数输入
  onPlayCountInput(e) {
    let value = parseInt(e.detail.value);
    if (isNaN(value)) value = 2;
    value = Math.min(Math.max(value, 1), 5);
    this.setData({
      'config.playCount': value
    });
  },

  // 显示帮助提示
  showHelp(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    
    // 如果点击的是当前显示的提示，则关闭它
    if (this.data.activeTip === index) {
      this.setData({ activeTip: null });
    } else {
      this.setData({ activeTip: index });
    }
  },

  // 点击其他地方时隐藏提示
  hideHelp() {
    if (this.data.activeTip !== null) {
      this.setData({ activeTip: null });
    }
  },

  // 在页面隐藏时清除提示
  onHide() {
    this.setData({ activeTip: null });
  }
}); 