import request from '../../../utils/request';
import { API } from '../../../config/api';

const app = getApp();

Page({
  data: {
    words: [],           // 所有词语
    currentIndex: 0,     // 当前词语索引
    playCount: 0,        // 当前播放次数
    config: {            // 听写配置
      dictationMode: 'unit',       // 听写模式：unit-单元听写，smart-智能听写
      random_order: false,        // 是否随机顺序
      retry_limit: 2,             // 重听次数限制
      dictation_interval: 5,      // 听写间隔(秒)
      auto_play: true,            // 是否自动播放
      wordsPerDictation: 10,      // 每次听写词数
      reviewDays: 3,              // 复习间隔天数
      dictationRatio: 100,        // 听写比例(%)
      wrong_words_only: false,    // 是否只听写错词
      mode: 'order',              // 'order' 或 'random'
      repeatCount: 2,            // 重复次数
      interval: 5,                // 间隔时间(秒)
    },
    sessionId: null,     // 听写会话ID
    startTime: null,     // 开始时间
    wordStats: [],       // 每个词的统计信息
    status: 'ready',     // 听写状态：ready-准备开始，playing-听写中，checking-检查中
    inputValue: '',      // 用户输入
    results: [],         // 听写结果
    audioContext: null,  // 音频上下文
    loading: false,      // 加载状态
    handwritingWidth: 300,  // 手写区域宽度
    handwritingHeight: 200, // 手写区域高度
    inputChars: [],        // 已输入的汉字数组
    currentWord: null,     // 当前词语对象
    ctx: null,
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    isPaused: false,
    checkResults: [], // 存储检查结果
    _audioLoadTimer: null,  // 音频加载计时器
    _submitDebounceTimer: null,  // 提交防抖计时器
    timer: null,         // 定时器
    pauseStartTime: null,  // 暂停开始时间
    totalPauseTime: 0,    // 总暂停时间
  },

  onLoad(options) {
    // 分别解析 words 和 config
    const words = JSON.parse(decodeURIComponent(options.words));
    const config = JSON.parse(decodeURIComponent(options.config));
    const sessionId = Number(options.session_id);
    
    // 根据模式排序词语
    const sortedWords = config.mode === 'random' 
      ? this.shuffleWords(words)
      : words;

    this.setData({
      words: sortedWords,
      config: {
        mode: config.mode,
        repeatCount: Number(config.repeatCount) || 2,
        interval: Number(config.interval) || 5,
        retry_limit: Number(config.repeatCount) || 2,
        dictation_interval: Number(config.interval) || 5
      },
      sessionId  // 保存会话ID
    });

    // 初始化音频上下文
    this.initAudioContext();

    // 获取屏幕宽度设置手写区域大小
    const windowInfo = wx.getWindowInfo();
    this.setData({
      handwritingWidth: windowInfo.windowWidth * 0.8,
      handwritingHeight: windowInfo.windowWidth * 0.5
    });
  },

  onReady() {
    // 在页面渲染完成后初始化画布
    this.initCanvas();
  },

  onUnload() {
    // 页面卸载时释放资源
    if (this.data.audioContext) {
      this.data.audioContext.stop();
      this.data.audioContext.destroy();
    }
    // 清理计时器
    if (this.data._audioLoadTimer) {
      clearTimeout(this.data._audioLoadTimer);
    }
    if (this.data._submitDebounceTimer) {
      clearTimeout(this.data._submitDebounceTimer);
    }
  },

  // 初始化音频上下文
  initAudioContext() {
    const audioContext = wx.createInnerAudioContext();
    
    // 监听音频播放结束
    audioContext.onEnded(() => {
      console.log('音频播放结束');
      this.handleAudioEnd();
    });
    
    // 监听音频播放错误
    audioContext.onError((err) => {
      console.error('音频播放错误:', err);
      wx.hideLoading();
      wx.showToast({
        title: '音频播放失败',
        icon: 'none'
      });
      // 添加重试逻辑
      this.retryPlayCount = (this.retryPlayCount || 0) + 1;
      if (this.retryPlayCount < 3) {
        setTimeout(() => {
          this.playCurrentWord();
        }, 1000);
      } else {
        wx.showModal({
          title: '播放失败',
          content: '是否跳过当前词语？',
          success: (res) => {
            if (res.confirm) {
              this.handleAudioEnd();
            }
          }
        });
      }
    });
    
    // 监听音频播放状态
    audioContext.onPlay(() => {
      console.log('音频开始播放');
    });
    
    // 监听音频加载状态
    audioContext.onWaiting(() => {
      console.log('音频加载中');
    });

    this.setData({ audioContext });
  },

  // 开始听写
  async startDictation() {
    try {
      // 初始化音频上下文
      const audioContext = wx.createInnerAudioContext();
      this.setData({
        audioContext,
        status: 'playing',
        startTime: new Date(),  // 记录开始时间
        wordStats: this.data.words.map(() => ({
          retryCount: 0,  // 每个词的重试次数
          startTime: new Date()  // 开始听写这个词的时间
        }))
      });

      // 开始播放第一个词
      this.playCurrentWord();
    } catch (error) {
      console.error('开始听写失败:', error);
      wx.showToast({
        title: error.message || '开始听写失败',
        icon: 'none'
      });
    }
  },

  // 播放当前词语
  async playCurrentWord() {
    const { currentIndex, words, playCount, config } = this.data;
    const currentWord = words[currentIndex];

    if (!currentWord) return;

    try {
      // 更新播放次数
      const newPlayCount = playCount + 1;
      this.setData({ playCount: newPlayCount });

      // 如果是第一次播放这个词，记录开始时间
      if (newPlayCount === 1) {
        const { wordStats } = this.data;
        wordStats[currentIndex].startTime = new Date();
        this.setData({ wordStats });
      }

      // 更新页面标题显示进度
      wx.setNavigationBarTitle({
        title: `听写 ${currentIndex + 1}/${words.length}`
      });

      // 播放音频
      await this.playAudio(currentWord.audio_url);

      // 检查是否需要继续播放或切换到下一个词
      if (newPlayCount < config.repeatCount) {
        // 还没到重复次数限制，延迟后再次播放
        setTimeout(() => {
          this.playCurrentWord();
        }, config.interval * 1000);
      } else {
        // 已达到重复次数，切换到下一个词
        setTimeout(() => {
          this.nextWord();
        }, config.interval * 1000);
      }
    } catch (error) {
      console.error('播放失败:', error);
      wx.showToast({
        title: '播放失败',
        icon: 'none'
      });
    }
  },

  // 切换到下一个词
  nextWord() {
    const { currentIndex, words, wordStats } = this.data;
    
    // 记录当前词的结束时间
    wordStats[currentIndex].endTime = new Date();
    
    // 重置播放次数
    this.setData({ playCount: 0 });

    if (currentIndex < words.length - 1) {
      // 还有下一个词
      this.setData({
        currentIndex: currentIndex + 1,
        wordStats: wordStats.map((stat, index) => {
          if (index === currentIndex + 1) {
            return { ...stat, startTime: new Date() };
          }
          return stat;
        })
      }, () => {
        // 自动开始播放下一个词
        this.playCurrentWord();
      });
    } else {
      // 已经是最后一个词
      this.finishDictation();
      // 播放完成提示音
      wx.vibrateShort();
      wx.showToast({
        title: '听写完成',
        icon: 'success'
      });
    }
  },

  // 播放音频
  playAudio(url) {
    return new Promise((resolve, reject) => {
      const audioContext = this.data.audioContext;
      
      audioContext.src = url;
      
      audioContext.onEnded(() => {
        resolve();
      });
      
      audioContext.onError((err) => {
        reject(err);
      });
      
      audioContext.play();
    });
  },

  // 音频播放结束处理
  handleAudioEnd() {
    const { playCount, config, status } = this.data;
    console.log('音频播放结束', playCount, config.repeatCount);
    
    if (playCount < config.repeatCount) {
      // 还需要重复播放
      console.log('准备重复播放');
      setTimeout(() => {
        this.playCurrentWord();
      }, config.interval * 1000);
    } else {
      // 播放完成，继续下一个词语
      console.log('当前词语播放完成，准备播放下一个');
      const { currentIndex, words } = this.data;
      
      if (currentIndex < words.length - 1) {
        // 还有下一个词语
        setTimeout(() => {
          this.setData({
            currentIndex: currentIndex + 1,
            playCount: 0
          }, () => {
            this.playCurrentWord();
          });
        }, config.interval * 1000);
      } else {
        // 所有词语播放完成
        console.log('所有词语播放完成');
        this.finishDictation();
      }
    }
  },

  // 重新播放当前词语
  replayWord() {
    // 重置播放次数
    this.setData({ 
      playCount: 0,
      status: 'playing'
    }, () => {
      this.playCurrentWord();
    });
  },

  // 进入检查状态
  finishDictation() {
    const { words } = this.data;
    // 初始化检查结果数组
    const checkResults = words.map(word => ({
      word: word.word,
      result: false,  // 默认为错误
      id: word.id,
      pinyin: word.pinyin,  // 添加拼音信息
      hint: word.hint,      // 添加提示信息
      audio_url: word.audio_url  // 保留音频URL，以便需要时重播
    }));
    
    console.log('初始化检查结果:', checkResults); // 添加日志
    
    this.setData({
      status: 'checking',
      checkResults,
      playCount: 0
    });

    // 更新导航栏标题
    wx.setNavigationBarTitle({
      title: '检查结果'
    });
  },

  // 处理单个词语的检查结果
  handleCheckResult(e) {
    const { index, result } = e.currentTarget.dataset;
    console.log('处理检查结果:', index, result); // 添加日志
    this.setData({
      [`checkResults[${index}].result`]: result
    });
  },

  // 全部标记为正确
  handleAllCorrect() {
    const { checkResults } = this.data;
    console.log('标记全部正确, 当前结果:', checkResults); // 添加日志
    const newResults = checkResults.map(item => ({
      ...item,
      result: true
    }));
    this.setData({ checkResults: newResults });
  },
  
  // 全部标记为错误
  handleAllWrong() {
    const { checkResults } = this.data;
    console.log('标记全部错误, 当前结果:', checkResults); // 添加日志
    const newResults = checkResults.map(item => ({
      ...item,
      result: false
    }));
    this.setData({ checkResults: newResults });
  },

  // 提交听写结果
  async handleSubmitResults() {
    const { checkResults, sessionId, startTime, wordStats, totalPauseTime, pauseStartTime } = this.data;
    
    if (!sessionId) {
      wx.showToast({
        title: '听写会话无效，请重新开始',
        icon: 'none'
      });
      return;
    }

    // 计算统计信息
    const endTime = new Date();
    // 如果当前处于暂停状态，加上当前的暂停时间
    const finalPauseTime = totalPauseTime + (pauseStartTime ? (endTime - pauseStartTime) : 0);
    
    // 总用时(秒)，减去暂停时间
    const totalTime = Math.round((endTime - startTime - finalPauseTime) / 1000);

    // 计算有效的听写时间（去掉暂停时间）
    const effectiveTime = wordStats.reduce((total, stat) => {
      if (stat.endTime) {
        // 计算每个词的实际用时，不包括暂停时间
        const wordTime = (stat.endTime - stat.startTime) / 1000;
        return total + Math.max(0, wordTime);  // 确保不会出现负数
      }
      return total;
    }, 0);
    
    const avgTime = Math.round(effectiveTime / checkResults.length);  // 平均每个词用时
    const totalRetryCount = wordStats.reduce((sum, stat) => sum + (stat.retryCount || 0), 0);

    try {
      this.setData({ loading: true });
      
      const result = await request.post(API.DICTATION.SUBMIT_RESULT, {
        session_id: Number(sessionId),
        stats: {
          total_time: totalTime,
          avg_time: avgTime,
          retry_count: totalRetryCount
        },
        results: checkResults.map((item, index) => ({
          item_id: item.id,
          is_correct: item.result,
          retry_count: wordStats[index].retryCount || 0
        }))
      });
      
      if (result.status === 'success') {
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        });
        
        // 通知上一页更新统计数据
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        if (prevPage && prevPage.fetchStatistics) {
          prevPage.fetchStatistics();
        }
        
        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        throw new Error(result.message || '提交失败');
      }
    } catch (error) {
      console.error('提交结果失败:', error);
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 随机排序词语
  shuffleWords(words) {
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // 输入处理
  handleInput(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  // 处理手写完成
  handleHandwritingFinish(e) {
    const { character } = e.detail;
    if (character) {
      const { inputChars, currentWord } = this.data;
      if (inputChars.length < currentWord.word.length) {
        this.setData({
          inputChars: [...inputChars, character]
        });
      }
    }
  },

  // 处理手写重置
  handleHandwritingReset() {
    // 可以添加一些重置相关的逻辑
  },

  // 清除输入
  clearInput() {
    this.setData({
      inputChars: []
    });
  },

  // 初始化画布
  async initCanvas() {
    try {
      const query = wx.createSelectorQuery();
      query.select('#handwriting')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res && res[0]) {
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            
            // 设置画布大小
            const { pixelRatio: dpr } = wx.getWindowInfo();
            canvas.width = this.data.handwritingWidth * dpr;
            canvas.height = this.data.handwritingHeight * dpr;
            ctx.scale(dpr, dpr);

            // 设置画笔样式
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // 设置背景色
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            this.setData({ ctx });
          } else {
            console.error('未找到画布节点');
          }
        });
    } catch (error) {
      console.error('初始化画布失败:', error);
    }
  },

  // 处理触摸开始
  handleTouchStart(e) {
    const { x, y } = e.touches[0];
    this.setData({
      isDrawing: true,
      lastX: x,
      lastY: y
    });
  },

  // 处理触摸移动
  handleTouchMove(e) {
    const { isDrawing, ctx, lastX, lastY } = this.data;
    if (!isDrawing) return;

    const { x, y } = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    this.setData({
      lastX: x,
      lastY: y
    });
  },

  // 处理触摸结束
  handleTouchEnd() {
    this.setData({ isDrawing: false });
    // TODO: 这里可以添加手写识别的功能
    // 可以截图画布内容，调用后端的识别服务
  },

  // 清除画布
  clearInput() {
    const { ctx, handwritingWidth, handwritingHeight } = this.data;
    if (ctx) {
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, handwritingWidth, handwritingHeight);
    }
    this.setData({ inputChars: [] });
  },

  // 获取画布内容
  async getCanvasImage() {
    try {
      const query = wx.createSelectorQuery();
      const canvas = await new Promise(resolve => {
        query.select('#handwriting')
          .fields({ node: true, size: true })
          .exec((res) => resolve(res[0].node));
      });
      
      // 获取画布内容
      const tempFilePath = await wx.canvasToTempFilePath({
        canvas,
        fileType: 'png',
        quality: 1
      });
      
      return tempFilePath;
    } catch (error) {
      console.error('获取画布内容失败:', error);
      return null;
    }
  },

  // 暂停/继续播放
  handlePause() {
    const { isPaused, audioContext } = this.data;
    // 添加防抖，避免快速点击
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
    }
    this.pauseTimer = setTimeout(() => {
      const now = new Date();
      if (isPaused) {
        audioContext.play();
        // 计算暂停时间
        if (this.data.pauseStartTime) {
          this.setData({
            totalPauseTime: this.data.totalPauseTime + (now - this.data.pauseStartTime),
            pauseStartTime: null
          });
        }
      } else {
        audioContext.pause();
        // 记录暂停开始时间
        this.setData({ pauseStartTime: now });
      }
      this.setData({ isPaused: !isPaused });
    }, 300);
  },

  // 重新播放当前词语
  handleReplay() {
    // 记录重试次数
    const { currentIndex, wordStats } = this.data;
    wordStats[currentIndex].retryCount++;
    
    this.setData({ 
      playCount: 0,
      isPaused: false,
      wordStats
    }, () => {
      this.playCurrentWord();
    });
  },

  // 退出听写
  handleExit() {
    const { currentIndex, words } = this.data;
    const progress = Math.round((currentIndex / words.length) * 100);
    wx.showModal({
      title: '确认退出',
      content: `当前进度${progress}%，退出后本次听写将不会保存`,
      success: (res) => {
        if (res.confirm) {
          // 停止音频播放
          this.data.audioContext.stop();
          wx.navigateBack();
        }
      }
    });
  },

  // 重播单个词语
  async handleReplayWord(e) {
    const { index } = e.currentTarget.dataset;
    const word = this.data.checkResults[index];
    
    try {
      await this.playAudio(word.audio_url);
    } catch (error) {
      console.error('播放失败:', error);
      wx.showToast({
        title: '播放失败',
        icon: 'none'
      });
    }
  },
}); 