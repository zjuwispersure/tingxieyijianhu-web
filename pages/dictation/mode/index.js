Page({
  data: {
    modes: [
      {
        id: 'unit',
        name: '单元听写',
        desc: '按照课本单元顺序进行听写'
      },
      {
        id: 'smart',
        name: '智能听写',
        desc: '智能推荐需要复习的词语'
      }
    ]
  },

  // 选择听写模式
  handleModeSelect(e) {
    const { mode } = e.currentTarget.dataset;
    if (mode === 'unit') {
      wx.navigateTo({
        url: '/pages/dictation/unit/index'
      });
    } else {
      wx.navigateTo({
        url: '/pages/dictation/smart/index'
      });
    }
  }
}); 