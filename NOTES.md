# 项目实现说明

## 登录流程
1. 小程序启动时（app.js）
   - 调用 wx.login 获取临时登录凭证（code）
   - 将 code 发送到后端换取用户信息
   - 保存用户信息到 globalData

2. 登录页面（pages/login/index.js）
   ```javascript
   async handleLogin() {
     try {
       // 1. 获取登录码
       const { code } = await wx.login();
       
       // 2. 获取用户信息（需要用户确认）
       let userInfo = null;
       try {
         const res = await wx.getUserProfile({
           desc: '用于完善用户资料'
         });
         userInfo = res.userInfo;
       } catch (e) {
         console.log('用户拒绝授权获取信息');
         wx.showToast({
           title: '需要您的授权才能继续使用',
           icon: 'none'
         });
         return;
       }
       
       // 3. 调用后端接口
       const loginResult = await request({
         url: API.USER.LOGIN,
         method: 'POST',
         data: {
           code,
           userInfo
         }
       });
       
       if (loginResult.status === 'success') {
         // 保存登录信息
         wx.setStorageSync('token', loginResult.data.access_token);
         wx.setStorageSync('userInfo', loginResult.data.user);
         
         // 登录成功提示
         wx.showToast({
           title: '登录成功',
           icon: 'success',
           duration: 1500
         });
         
         // 延迟跳转
         setTimeout(() => {
           const pages = getCurrentPages();
           if (pages.length > 1) {
             wx.navigateBack();
           } else {
             wx.switchTab({
               url: '/pages/index/index'
             });
           }
         }, 1500);
       }
       
     } catch (error) {
       console.error('登录失败:', error);
       wx.showToast({
         title: '登录失败，请重试',
         icon: 'none'
       });
     }
   }
   ```

3. 登录流程说明
   - 用户点击登录按钮触发 handleLogin
   - 先调用 wx.login 获取临时登录凭证 code
   - 调用 wx.getUserProfile 获取用户信息（需要用户确认）
   - 将 code 和用户信息一起发送到后端
   - 后端验证并返回登录态（token）和用户信息
   - 前端保存 token 和用户信息到 Storage
   - 登录成功后延迟跳转（显示成功提示）

4. 注意事项
   - wx.getUserProfile 必须由用户触发，不能自动调用
   - 用户可能拒绝授权，需要处理拒绝的情况
   - token 要安全保存，请求时自动带上
   - 登录成功后的跳转要考虑页面栈的情况

## 环境配置（config/config.js）
- 通过 currentEnv 控制当前环境
- 环境包括：
  - develop: 开发环境（127.0.0.1:5000）
  - trial: 测试环境
  - release: 生产环境

## 网络请求（utils/request.js）
1. 统一请求配置
   - 基础URL从 CONFIG 中获取
   - 超时时间统一设置
   - 自动添加 token 到请求头

2. 错误处理
   - 401状态码：清除登录信息并跳转到登录页
   - 请求失败：显示错误信息

## API 接口（config/api.js）
- 所有接口地址统一管理
- 使用 BASE_URL 拼接完整接口地址
- 按功能模块划分接口：
  - USER: 用户相关接口
  - CHILD: 孩子管理接口
  - FAMILY: 家庭群组接口
  - DICTATION: 听写功能接口
  - STATISTICS: 统计信息接口

## 待办事项
- [ ] 完善错误处理机制
- [ ] 添加请求重试机制
- [ ] 优化登录态过期处理
- [ ] 添加请求loading状态
- [ ] 实现数据本地缓存

## 注意事项
1. 环境切换
   - 修改 config/config.js 中的 currentEnv 值
   - develop -> trial -> release

2. 接口调用
   - 统一使用 request 工具方法
   - 接口地址从 API 配置中获取
   - 注意处理异步请求的错误

3. 登录状态
   - token 存储在 Storage 中
   - 请求时自动带上 token
   - 注意处理登录态过期的情况 