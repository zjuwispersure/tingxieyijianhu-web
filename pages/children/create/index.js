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
      textbookVersion: ''
    },
    grades: [1, 2, 3, 4, 5, 6],
    semesters: [
      { id: 1, name: '上学期' },
      { id: 2, name: '下学期' }
    ],
    textbooks: [
      { id: 'rj', name: '人教版' },
      { id: 'bsd', name: '北师大版' }
    ],
    selectedTextbookIndex: 0
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadChildInfo(options.id);
    }
  },

  async loadChildInfo(id) {
    try {
      const result = await request.get(`${API.CHILD.UPDATE(id)}`);
      const textbookIndex = this.data.textbooks.findIndex(
        item => item.id === result.child.textbookVersion
      );
      
      this.setData({
        form: result.child,
        selectedTextbookIndex: textbookIndex >= 0 ? textbookIndex : 0
      });
    } catch (error) {
      console.error('加载孩子信息失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  onRegionChange(e) {
    const [province, city] = e.detail.value;
    this.setData({
      'form.province': province,
      'form.city': city
    });
  },

  onGradeChange(e) {
    this.setData({
      'form.grade': this.data.grades[e.detail.value]
    });
  },

  onSemesterChange(e) {
    this.setData({
      'form.semester': this.data.semesters[e.detail.value].id
    });
  },

  onTextbookChange(e) {
    const index = e.detail.value;
    this.setData({
      'form.textbookVersion': this.data.textbooks[index].id,
      selectedTextbookIndex: index
    });
  },

  getTextbookName() {
    const { textbookVersion } = this.data.form;
    const textbook = this.data.textbooks.find(item => item.id === textbookVersion);
    return textbook ? textbook.name : '请选择教材版本';
  },

  async handleSubmit() {
    try {
      const { form, id } = this.data;
      
      // 表单验证
      if (!form.nickname) {
        wx.showToast({
          title: '请输入昵称',
          icon: 'none'
        });
        return;
      }

      if (!form.province || !form.city) {
        wx.showToast({
          title: '请选择学校省市',
          icon: 'none'
        });
        return;
      }

      if (!form.textbookVersion) {
        wx.showToast({
          title: '请选择教材版本',
          icon: 'none'
        });
        return;
      }

      // 校验昵称是否重复
      if (!id) {
        const checkResult = await request.get(API.CHILD.CHECK_NICKNAME, {
          nickname: form.nickname
        });
        
        if (checkResult.exists) {
          wx.showToast({
            title: '昵称已存在',
            icon: 'none'
          });
          return;
        }
      }

      // 提交表单
      if (id) {
        await request.put(API.CHILD.UPDATE(id), form);
      } else {
        await request.post(API.CHILD.CREATE, form);
      }

      wx.showToast({
        title: id ? '修改成功' : '创建成功',
        icon: 'success'
      });

      // 返回列表页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (error) {
      console.error('提交失败:', error);
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      });
    }
  }
}); 