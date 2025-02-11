import request from '../../../utils/request';
import { API } from '../../../config/api';

Page({
  data: {
    id: '',
    form: {
      nickname: '',
      province: '',
      city: '',
      grade: 1,
      semester: 1,
      textbookVersion: '人教版'
    },
    grades: [1, 2, 3, 4, 5, 6],
    semesters: [
      { id: 1, name: '上学期' },
      { id: 2, name: '下学期' }
    ],
    versions: ['人教版', '北师大版'],
    selectedVersionIndex: 0,
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadChildInfo(options.id);
    }
  },

  // 加载孩子信息
  async loadChildInfo(id) {
    try {
      this.setData({ loading: true });

      // 从本地存储中获取所有孩子信息
      const children = wx.getStorageSync('children') || [];
      const childInfo = children.find(child => child.id === parseInt(id));

      if (!childInfo) {
        // 如果本地没有找到，从服务器获取
        const result = await request.get(API.CHILD.GET, { id: parseInt(id) });
        if (result.status == 'success') {
          childInfo = result.data;
        } else {
          throw new Error('找不到该孩子的信息');
        }
      }

      // 找到教材版本的索引
      const versionIndex = this.data.versions.indexOf(childInfo.textbookVersion);
      
      this.setData({
        form: childInfo,
        selectedVersionIndex: versionIndex >= 0 ? versionIndex : 0
      });
    } catch (error) {
      console.error('加载孩子信息失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 表单字段更新
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  // 年级选择
  onGradeChange(e) {
    this.setData({
      'form.grade': this.data.grades[e.detail.value]
    });
  },

  // 教材版本选择
  handleVersionChange(e) {
    const index = e.detail.value;
    this.setData({
      'form.textbookVersion': this.data.versions[index],
      selectedVersionIndex: index
    });
  },

  // 取消
  handleCancel() {
    wx.navigateBack();
  },

  // 提交表单
  async handleSubmit() {
    if (this.data.submitting) return;
    
    try {
      // 表单验证
      const { form } = this.data;
      
      if (!form.nickname.trim()) {
        wx.showToast({
          title: '请输入孩子昵称',
          icon: 'none',
          duration: 2000
        });
        return;
      }

      if (!form.province || !form.city) {
        wx.showToast({
          title: '请选择所在地区',
          icon: 'none',
          duration: 2000
        });
        return;
      }

      // 先检查本地是否有重名
      const children = wx.getStorageSync('children') || [];
      const isNameExist = children.some(child => 
        child.nickname.toLowerCase() === form.nickname.toLowerCase().trim()
      );
      
      if (isNameExist) {
        wx.showToast({
          title: '该昵称已存在',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      this.setData({ submitting: true });
      
      // 调用添加孩子接口
      const result = await request.post(API.CHILD.CREATE, {
        nickname: form.nickname,
        province: form.province,
        city: form.city,
        grade: form.grade,
        semester: form.semester,
        textbook_version: form.textbookVersion === '人教版' ? 'rj' : 'bsd'
      });

      if (result.status === 'success') {
        // 更新全局状态
        const newChild = {
          ...result.data,
          textbookVersion: result.data.textbook_version === 'rj' ? '人教版' : '北师大版'
        };
        
        // 更新全局选中的孩子
        getApp().updateSelectedChild(newChild);
        
        // 重新获取孩子列表
        await getApp().fetchChildrenList();

        wx.showToast({
          title: '添加成功',
          icon: 'success',
          duration: 1500
        });

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);
      } else {
        throw new Error(result.message || '添加失败');
      }
    } catch (error) {
      console.error('添加孩子失败:', error);
      
      // 处理特定的错误码
      if (error.code === 3103) {
        wx.showToast({
          title: '该昵称已被使用',
          icon: 'none',
          duration: 2000
        });
      } else {
        wx.showToast({
          title: error.message || '添加失败',
          icon: 'none',
          duration: 2000
        });
      }
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 添加输入框失去焦点时的检查
  async handleNameBlur(e) {
    const name = e.detail.value.trim();
    if (!name) return;
    
    // 检查本地存储中是否有重名
    const children = wx.getStorageSync('children') || [];
    const isNameExist = children.some(child => 
      child.nickname.toLowerCase() === name.toLowerCase()
    );
    
    if (isNameExist) {
      wx.showToast({
        title: '该昵称已存在',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 添加地区选择处理方法
  onRegionChange(e) {
    const [province, city] = e.detail.value;
    this.setData({
      'form.province': province,
      'form.city': city
    });
  },

  // 添加学期选择处理方法
  onSemesterChange(e) {
    this.setData({
      'form.semester': this.data.semesters[e.detail.value].id
    });
  },

  // 删除孩子
  async handleDelete() {
    try {
      const result = await request.post(API.CHILD.DELETE, {
        id: this.data.id
      });
      
      if (result.status === 'success') {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (error) {
      console.error('删除失败:', error);
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
    }
  }
}); 