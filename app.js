// app.js
import request from './utils/request';
import { API } from './config/api';
import { TextbookVersionUtil } from './config/constants';

App({
  onLaunch() {
    // 初始化登录状态
    this.loginReady = false;
    this.loginPromise = null;
    
    // 从本地存储加载用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.loginReady = true;
    }
    
    // 从本地存储加载选中的孩子
    const selectedChild = wx.getStorageSync('selectedChild');
    if (selectedChild) {
      this.globalData.selectedChild = selectedChild;
    }
  },

  // 登录方法
  async login({ code, nickname }) {
    try {
      // 调用后端登录接口
      const result = await request.post(API.USER.LOGIN, {
        code,
        nickname,
        platform: 'wx'
      });
      
      if (result.status === 'success') {
        // 保存 token
        const token = result.data.access_token;
        wx.setStorageSync('token', token);
        
        // 保存用户信息
        const userData = {
          id: result.data.user_id,
          nickname: nickname,
          platform: 'wx'
        };
        this.globalData.userInfo = userData;
        wx.setStorageSync('userInfo', userData);
        
        // 设置登录状态
        this.loginReady = true;
        
        return result.data;
      } else {
        throw new Error(result.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },

  // 添加一个统一的数据转换方法
  formatChildData(child) {
    console.log('格式化前的孩子数据:', child);
    const formatted = {
      id: child.id,
      nickname: child.nickname,
      grade: Number(child.grade || 1),
      semester: Number(child.semester || 1),
      textbook_version: child.textbook_version,
      textbookVersion: TextbookVersionUtil.parseVersion(child.textbook_version) || '人教版',
      createdAt: child.created_at,
      updatedAt: child.updated_at
    };
    console.log('格式化后的孩子数据:', formatted);
    return formatted;
  },

  // 验证孩子数据的完整性
  isValidChild(child) {
    return child 
      && child.id 
      && child.nickname 
      && child.textbook_version 
      && !isNaN(Number(child.grade))
      && typeof child.semester === 'number';
  },

  // 缓存相关的常量
  CACHE: {
    CHILDREN_LIST: 'children_list',
    CHILDREN_UPDATE_TIME: 'children_update_time',
    CHILDREN_NEED_UPDATE: 'children_need_update',
    CACHE_DURATION: 30 * 60 * 1000  // 30分钟
  },

  // 检查缓存是否需要更新
  isChildrenCacheExpired() {
    const updateTime = wx.getStorageSync(this.CACHE.CHILDREN_UPDATE_TIME);
    const needUpdate = wx.getStorageSync(this.CACHE.CHILDREN_NEED_UPDATE);
    
    if (needUpdate) return true;
    
    if (!updateTime) return true;
    
    return Date.now() - updateTime > this.CACHE.CACHE_DURATION;
  },

  // 标记需要更新孩子列表
  markChildrenNeedUpdate() {
    wx.setStorageSync(this.CACHE.CHILDREN_NEED_UPDATE, true);
  },

  // 更新孩子列表缓存
  updateChildrenCache(children) {
    // 确保所有孩子的 grade 都是数字类型
    const formattedChildren = children.map(child => ({
      ...child,
      grade: Number(child.grade)
    }));
    wx.setStorageSync(this.CACHE.CHILDREN_LIST, formattedChildren);
    wx.setStorageSync(this.CACHE.CHILDREN_UPDATE_TIME, Date.now());
    wx.setStorageSync(this.CACHE.CHILDREN_NEED_UPDATE, false);
  },

  // 获取孩子列表的方法
  async fetchChildrenList() {
    try {
      const result = await request.get(API.CHILD.LIST);
      console.log('从服务器获取的原始数据:', result.data.children);
      
      if (result.status === 'success' && result.data && result.data.children) {
        const children = result.data.children
          .filter(this.isValidChild)
          .map(child => this.formatChildData(child));
        
        console.log('格式化后准备缓存的数据:', children);
        wx.setStorageSync('children', children);
        return children;
      }
      return [];
    } catch (error) {
      console.error('获取孩子列表失败:', error);
      return [];
    }
  },

  // 添加一个更新选中孩子的方法
  updateSelectedChild(child) {
    // 确保数据格式一致性
    const formattedChild = {
      ...child,
      grade: Number(child.grade),
      semester: Number(child.semester),
      textbookVersion: TextbookVersionUtil.parseVersion(child.textbook_version)
    };
    
    console.log('更新选中的孩子:', formattedChild);
    this.globalData.selectedChild = formattedChild;
    wx.setStorageSync('selectedChild', formattedChild);
  },

  globalData: {
    userInfo: null,
    selectedChild: null
  }
});
