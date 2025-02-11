async loadChildren() {
  try {
    this.setData({ loading: true });
    
    console.log('开始加载孩子列表');
    const children = await app.fetchChildrenList();
    console.log('获取到的孩子列表:', children);
    
    this.setData({
      children,
      loading: false
    });
  } catch (error) {
    console.error('加载孩子列表失败:', error);
    this.setData({ loading: false });
  }
} 