// 环境配置
const ENV = {
  develop: {
    baseURL: 'http://127.0.0.1:5000',  // 开发环境
    timeout: 10000
  },
  trial: {
    baseURL: 'https://test-api.yourdomain.com',  // 测试环境
    timeout: 10000
  },
  release: {
    baseURL: 'https://api.yourdomain.com',  // 生产环境
    timeout: 10000
  }
};

// 当前环境，可以根据需要修改
const currentEnv = 'develop';

export const CONFIG = {
  ...ENV[currentEnv],
  // 其他全局配置
  version: '1.0.0',
  appName: '你的小程序名称'
};
