import request from '../../../utils/request';
import { API } from '../../../config/api';

Page({
  data: {
    dictationId: '',
    currentWordIndex: 0,
    words: [],
    config: {
      repeatTimes: 2,
      interval: 3000
    },
    audioContext: null,
    isPlaying: false
  },

  onLoad(options) {
    const { id } = options;
    this.setData({ dictationId: id });
    
    // 初始化音频播放器
    const audioContext = wx.createInnerAudioContext();
    audioContext.onError((err) => {
      console.error('音频播放错误:', err);
      wx.showToast({
        title: '音频播放失败',
        icon: 'none'
      });
    });
    
    this.setData({ audioContext });
    
    // 加载听写内容
    this.loadDictationContent();
  },

  async loadDictationContent() {
    try {
      wx.showLoading({ title: '加载中' });
      
      const result = await request.get(API.DICTATION.GET_WORDS(this.data.dictationId));
      
      this.setData({ 
        words: result.words,
        config: {
          ...this.data.config,
          ...result.config
        }
      });
      
      // 开始播放第一个词
      this.playCurrentWord();
      
    } catch (error) {
      console.error('加载听写内容失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  playCurrentWord() {
    const { currentWordIndex, words, config, audioContext } = this.data;
    
    // 检查是否已完成所有词语
    if (currentWordIndex >= words.length) {
      this.finishDictation();
      return;
    }
    
    const word = words[currentWordIndex];
    audioContext.src = word.audioUrl;
    
    this.setData({ isPlaying: true });
    
    let playCount = 0;
    
    // 监听播放完成事件
    audioContext.onEnded(() => {
      playCount++;
      
      // 判断是否需要重复播放
      if (playCount < config.repeatTimes) {
        setTimeout(() => {
          audioContext.play();
        }, config.interval);
      } else {
        // 播放完指定次数后，准备播放下一个词
        this.setData({
          currentWordIndex: currentWordIndex + 1,
          isPlaying: false
        });
        
        // 延迟播放下一个词
        setTimeout(() => {
          this.playCurrentWord();
        }, config.interval);
      }
    });
    
    // 开始播放
    audioContext.play();
  },

  // 重新播放当前词语
  replayWord() {
    if (!this.data.isPlaying) {
      this.playCurrentWord();
    }
  },

  // 完成听写
  finishDictation() {
    wx.navigateTo({
      url: `/pages/dictation/result/index?id=${this.data.dictationId}`
    });
  },

  onUnload() {
    // 清理音频资源
    const { audioContext } = this.data;
    if (audioContext) {
      audioContext.destroy();
    }
  }
}); 