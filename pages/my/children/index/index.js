import request from '../../../../utils/request';
import { API } from '../../../../config/api';
import { TextbookVersionUtil } from '../../../../config/constants';

const app = getApp();

Page({
  data: {
    children: [],
    loading: false,
    selectedChildId: null
  },

  onLoad() {
    // 获取当前选中的孩子ID
    const selectedChild = app.globalData.selectedChild;
    if (selectedChild) {
      this.setData({ selectedChildId: selectedChild.id });
    }
  },

  onShow() {
    this.loadChildren();
  },

  // 加载孩子列表
  async loadChildren() {
    try {
      this.setData({ loading: true });
      
      // 从服务器获取最新的孩子列表
      const result = await request.get(API.CHILD.LIST);
      
      if (result.status === 'success' && result.data && result.data.children) {
        // 格式化孩子数据
        const children = result.data.children.map(child => ({
          id: child.id,
          nickname: child.nickname,
          grade: Number(child.grade),
          semester: child.semester,
          textbookVersion: TextbookVersionUtil.parseVersion(child.textbook_version)
        }));
        
        // 更新页面数据和本地缓存
        this.setData({ children });
        app.updateChildrenCache(children);
        
        console.log('获取到的孩子列表:', children);
      } else {
        throw new Error('获取孩子列表失败');
      }
    } catch (error) {
      console.error('加载孩子列表失败:', error);
      // 如果获取失败，尝试使用缓存数据
      const cachedChildren = wx.getStorageSync('children') || [];
      this.setData({ children: cachedChildren });
      
      wx.showToast({
        title: error.message || '获取孩子列表失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 选择默认孩子
  handleSelectDefault(e) {
    const { id } = e.currentTarget.dataset;
    const child = this.data.children.find(c => c.id === id);
    
    if (child) {
      this.setData({ selectedChildId: id });
      app.updateSelectedChild(child);
      
      wx.showToast({
        title: '已设为默认',
        icon: 'success'
      });
    }
  },

  // 删除孩子
  async handleDelete(e) {
    const { id, name } = e.currentTarget.dataset;
    
    try {
      // 确认删除
      const res = await wx.showModal({
        title: '确认删除',
        content: `确定要删除 ${name} 吗？`,
        confirmText: '删除',
        confirmColor: '#ff4d4f'
      });
      
      if (res.confirm) {
        const result = await request.post(API.CHILD.DELETE, { id });
        
        if (result.status === 'success') {
          // 从列表中移除
          const children = this.data.children.filter(c => c.id !== id);
          this.setData({ children });
          
          // 更新缓存
          app.updateChildrenCache(children);
          
          // 如果删除的是当前选中的孩子，清除选中状态
          if (id === this.data.selectedChildId) {
            app.updateSelectedChild(null);
            this.setData({ selectedChildId: null });
          }
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    } catch (error) {
      console.error('删除失败:', error);
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none'
      });
    }
  },

  // 编辑孩子
  handleEdit(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/my/children/edit/index?id=${id}`
    });
  },

  // 添加孩子
  handleAdd() {
    wx.navigateTo({
      url: '/pages/my/children/edit/index'
    });
  }
}); 