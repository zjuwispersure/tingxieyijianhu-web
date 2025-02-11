const app = getApp();

Page({
  data: {
    userInfo: null,
    loading: false,
    menuList: [
      {
        id: 'family',
        title: '家庭管理',
        url: '/pages/my/family/index/index',
        needLogin: true,
        badge: ''
      },
      {
        id: 'children',
        title: '孩子管理',
        url: '/pages/my/children/index/index',
        needLogin: true
      }
    ]
  },

  onLoad() {
    // 页面加载时检查登录状态
    this.checkLoginStatus();
  },

  onShow() {
    // 每次显示页面时检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = app.globalData.userInfo;
    
    if (userInfo) {
      console.log('当前用户信息:', userInfo);
      this.setData({ userInfo });
    } else {
      console.log('用户未登录');
      this.setData({ userInfo: null });
    }
  },

  // 处理登录
  async handleLogin() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      // 获取用户登录凭证
      const { code } = await wx.login();
      if (!code) {
        throw new Error('获取登录凭证失败');
      }
      
      // 调用登录接口
      const loginResult = await app.login({
        code,
        nickname: '微信用户'
      });
      
      // 使用全局状态更新页面
      this.setData({
        userInfo: app.globalData.userInfo
      });
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
      
      // 延迟获取孩子列表，确保 token 已经保存
      setTimeout(async () => {
        await app.fetchChildrenList();
      }, 100);
      
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 处理菜单点击
  handleMenuClick(e) {
    const { url, needLogin } = e.currentTarget.dataset;
    
    if (needLogin && !this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({ url });
  }
}); 