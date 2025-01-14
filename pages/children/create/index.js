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
    const { form, id } = this.data;
    
    // 表单验证
    if (!form.nickname.trim()) {
      wx.showToast({
        title: '请输入孩子昵称',
        icon: 'none'
      });
      return;
    }

    if (!form.province || !form.city) {
      wx.showToast({
        title: '请选择所在地区',
        icon: 'none'
      });
      return;
    }

    try {
      this.setData({ loading: true });
      
      // 构造请求参数
      const params = {
        nickname: form.nickname,
        province: form.province,
        city: form.city,
        grade: form.grade,
        semester: form.semester,
        textbook_version: form.textbookVersion === '人教版' ? 'rj' : 'bsd'
      };

      let result;
      if (id) {
        // 更新
        result = await request.post(API.CHILD.UPDATE, {
          id,
          ...params
        });
      } else {
        // 创建
        result = await request.post(API.CHILD.CREATE, params);
        
        if (result.status === 'success') {
          // 构造完整的孩子信息
          const newChild = {
            id: result.data.child_id,
            family_id: result.data.family_id,
            nickname: form.nickname,
            province: form.province,
            city: form.city,
            grade: form.grade,
            semester: form.semester,
            textbook_version: params.textbook_version,
            textbookVersion: form.textbookVersion  // 保存转换后的版本名称
          };

          // 更新本地存储的孩子列表
          const children = wx.getStorageSync('children') || [];
          children.push(newChild);
          wx.setStorageSync('children', children);

          // 如果是第一个孩子，设为选中状态
          if (children.length === 1) {
            getApp().updateSelectedChild(newChild);
          }

          wx.showToast({
            title: '添加成功',
            icon: 'success'
          });

          // 延迟跳转
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          throw new Error(result.message || '添加失败');
        }
      }
    } catch (error) {
      console.error('添加失败:', error);
      wx.showToast({
        title: error.message || '操作失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
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