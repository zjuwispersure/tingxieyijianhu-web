export const formMixin = {
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

  // 表单验证
  validateForm() {
    const { form, id } = this.data;

    if (!id && !form.nickname.trim()) {
      wx.showToast({
        title: '请输入孩子昵称',
        icon: 'none'
      });
      return false;
    }

    if (!form.textbookVersion) {
      wx.showToast({
        title: '请选择教材版本',
        icon: 'none'
      });
      return false;
    }

    if (!form.grade) {
      wx.showToast({
        title: '请选择年级',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 提交成功处理
  handleSubmitSuccess(data) {
    const { id } = this.data;
    // 更新本地存储的选中孩子
    if (id) {
      const app = getApp();
      const selectedChild = app.globalData.selectedChild;
      if (selectedChild && selectedChild.id === id) {
        app.globalData.selectedChild = data;
        wx.setStorageSync('selectedChild', data);
      }
    }

    wx.showToast({
      title: id ? '修改成功' : '添加成功',
      icon: 'success'
    });
    
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  // 提交错误处理
  handleSubmitError(error) {
    const { id } = this.data;
    console.error(id ? '修改失败:' : '添加失败:', error);
    wx.showToast({
      title: error.message || '操作失败，请重试',
      icon: 'none'
    });
  }
}; 