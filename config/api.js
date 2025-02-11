// 判断环境
const env = {
  develop: 'http://127.0.0.1:5000',
  production: 'https://api.yourdomain.com' // 生产环境域名
};

const BASE_URL = env.develop; // 开发环境使用本地服务器

export const API = {
  login: '/auth/login',  // 确保这个地址是正确的
  // 用户相关
  USER: {
    LOGIN: `${BASE_URL}/auth/login`,
    GET_USER_INFO: `${BASE_URL}/api/user/info`,
  },
  
  // 孩子管理
  CHILD: {
    CREATE: `${BASE_URL}/child/add`,
    LIST: `${BASE_URL}/child/get/all`,
    GET: `${BASE_URL}/child/get`,
    UPDATE: `${BASE_URL}/child/update`,
    DELETE: `${BASE_URL}/child/delete`,
    COUNT: `${BASE_URL}/child/count`,
    CHECK_NICKNAME: `${BASE_URL}/child/check-nickname`,
  },
  
  // 家庭群组
  FAMILY: {
    CREATE: `${BASE_URL}families`,
    GET_INFO: `${BASE_URL}/families`,
    INVITE: `${BASE_URL}/families/invite`,
    JOIN: `${BASE_URL}/families/join`,
    REMOVE_MEMBER: `${BASE_URL}/families/members/remove`,
  },
  
  // 听写功能
  DICTATION: {
    // 智能听写
    START_SMART: `${BASE_URL}/dictation/yuwen/smart`,
    // 获取学习进度
    GET_PROGRESS: `${BASE_URL}/dictation/progress`,
    // 获取听写统计
    GET_STATISTICS: {
      DAILY: `${BASE_URL}/dictation/stats/daily`,    // 获取今日统计
      OVERALL: `${BASE_URL}/dictation/stats/overall`, // 获取整体统计
      UNIT: `${BASE_URL}/dictation/stats/unit`       // 获取单元错误统计
    },
    // 获取听写配置
    GET_CONFIG: `${BASE_URL}/dictation/config/get`,
    // 更新听写配置
    UPDATE_CONFIG: `${BASE_URL}/dictation/config/update`,
    // 下载音频文件
    DOWNLOAD_AUDIO: (url) => url,
    // 获取课文列表
    GET_ALL_LESSONS: `${BASE_URL}/yuwen/lessons/all`,
    // 获取课文详情（包含词语列表）
    GET_LESSON_DETAIL: `${BASE_URL}/dictation/lesson/detail`,
    // 获取课文词语列表
    GET_LESSON_WORDS: `${BASE_URL}/yuwen/lesson/items`,
    // 开始智能听写
    START_SMART: `${BASE_URL}/dictation/smart/start`,
    // 获取听写进度
    GET_PROGRESS: `${BASE_URL}/dictation/progress`,
    // 提交听写结果
    SUBMIT_RESULT: `${BASE_URL}/dictation/submit`,
    // 开始听写
    START_LESSON: `${BASE_URL}/dictation/start`,
  },
  
  // 统计信息
  STATISTICS: {
    GET_SUMMARY: `${BASE_URL}/statistics/summary`,
    GET_DETAIL: `${BASE_URL}/statistics/detail`,
  }
}; 