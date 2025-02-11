import request from '../../../../utils/request';
import { API } from '../../../../config/api';
import { TextbookVersionUtil } from '../../../../config/constants';

const app = getApp();

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
    versions: TextbookVersionUtil.getSupportedVersions(),
    loading: false,
    isEdit: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ 
        id: options.id,
        isEdit: true 
      });
      this.loadChildInfo(options.id);
      wx.setNavigationBarTitle({
        title: '编辑孩子'
      });
    }
  },

  // 加载孩子信息
  async loadChildInfo(id) {
    try {
      this.setData({ loading: true });
      
      // 先从本地缓存获取孩子列表
      const localChildren = wx.getStorageSync('children') || [];
      let child = localChildren.find(c => c.id === Number(id));

      if (!child) {
        // 本地没有找到，从服务器获取
        const result = await request.get(API.CHILD.GET, { id: Number(id) });
        if (result.status === 'success' && result.data) {
          child = result.data;
        } else {
          throw new Error('找不到该孩子的信息');
        }
      }

      if (child) {
        this.setData({
          form: {
            nickname: child.nickname || '',
            province: child.province || '',
            city: child.city || '',
            grade: Number(child.grade) || 1,
            semester: child.semester || 1,
            textbookVersion: child.textbookVersion || '人教版'
          }
        });
      }
    } catch (error) {
      console.error('获取孩子信息失败:', error);
      wx.showToast({
        title: error.message || '获取孩子信息失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 提交表单
  async handleSubmit() {
    const { form, id, loading } = this.data;
    if (loading) return;

    try {
      // 表单验证
      if (!form.nickname.trim()) {
        throw new Error('请输入孩子昵称');
      }

      this.setData({ loading: true });

      const params = {
        nickname: form.nickname.trim(),
        grade: Number(form.grade),
        semester: form.semester,
        textbook_version: TextbookVersionUtil.formatVersion(form.textbookVersion)  // 保存代号
      };

      // 调用API
      const result = await request.post(
        id ? API.CHILD.UPDATE : API.CHILD.CREATE,
        id ? { ...params, id: Number(id) } : params
      );

      if (!result) {
        throw new Error('服务器响应异常');
      }

      if (result.status === 'success') {
        // 标记需要更新孩子列表
        app.markChildrenNeedUpdate();
        
        // 更新本地缓存
        const localChildren = wx.getStorageSync('children') || [];
        const updatedChild = {
          id: result.data.id || id,
          ...params,
          textbookVersion: TextbookVersionUtil.parseVersion(params.textbook_version)  // 转换为显示用的中文名称
        };

        if (id) {
          // 更新现有孩子
          const index = localChildren.findIndex(c => c.id === Number(id));
          if (index > -1) {
            localChildren[index] = updatedChild;
          }
        } else {
          // 添加新孩子
          localChildren.push(updatedChild);
        }
        
        wx.setStorageSync('children', localChildren);

        // 如果是当前选中的孩子，也更新选中的孩子信息
        const selectedChild = app.globalData.selectedChild;
        if (selectedChild && selectedChild.id === Number(id)) {
          app.updateSelectedChild(updatedChild);
        }

        // 如果还没有选中的孩子，自动选中新添加的孩子
        if (!app.globalData.selectedChild) {
          app.updateSelectedChild(updatedChild);
        }

        wx.showToast({
          title: id ? '更新成功' : '添加成功',
          icon: 'success'
        });

        // 返回并刷新列表页
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        if (prevPage && prevPage.loadChildren) {
          prevPage.loadChildren();
        }
        wx.navigateBack();
      } else {
        throw new Error(result.message || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 表单输入处理
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  // 取消
  handleCancel() {
    wx.navigateBack();
  },

  // 地区选择
  onRegionChange(e) {
    const [province, city] = e.detail.value;
    this.setData({
      'form.province': province,
      'form.city': city
    });
  },

  // 年级选择
  onGradeChange(e) {
    this.setData({
      'form.grade': this.data.grades[e.detail.value]
    });
  },

  // 学期选择
  onSemesterChange(e) {
    this.setData({
      'form.semester': this.data.semesters[e.detail.value].id
    });
  },

  // 教材版本选择
  onVersionChange(e) {
    this.setData({
      'form.textbookVersion': this.data.versions[e.detail.value]
    });
  }
}); 