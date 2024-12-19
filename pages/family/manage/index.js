// pages/family/manage/index.js
import request from '../../../utils/request';
import { API } from '../../../config/api';

Page({
  data: {
    familyInfo: null,
    loading: true
  },

  onShow() {
    this.loadFamilyInfo();
  },

  async loadFamilyInfo() {
    try {
      const result = await request.get(API.FAMILY.GET_INFO());
      this.setData({
        familyInfo: result.family,
        loading: false
      });
    } catch (error) {
      console.error('加载家庭信息失败:', error);
      this.setData({ loading: false });
    }
  },

  async inviteMember() {
    try {
      const result = await request.post(API.FAMILY.INVITE(this.data.familyInfo.id));
      
      // 显示邀请二维码
      wx.previewImage({
        urls: [result.qrCodeUrl],
        current: result.qrCodeUrl
      });
    } catch (error) {
      console.error('生成邀请失败:', error);
      wx.showToast({
        title: '生成邀请失败，请重试',
        icon: 'none'
      });
    }
  },

  async removeMember(e) {
    const { memberId } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认移除',
      content: '确定要移除该成员吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request.delete(
              API.FAMILY.REMOVE_MEMBER(this.data.familyInfo.id, memberId)
            );
            
            wx.showToast({
              title: '移除成功',
              icon: 'success'
            });
            
            this.loadFamilyInfo();
          } catch (error) {
            console.error('移除成员失败:', error);
            wx.showToast({
              title: '移除失败，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  }
});