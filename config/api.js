const BASE_URL = 'https://api.yourdomain.com';

export const API = {
  // 用户相关
  USER: {
    LOGIN: `${BASE_URL}/api/auth/login`,
    GET_USER_INFO: `${BASE_URL}/api/user/info`,
  },
  
  // 孩子管理
  CHILD: {
    CREATE: `${BASE_URL}/api/children`,
    LIST: `${BASE_URL}/api/children`,
    UPDATE: (id) => `${BASE_URL}/api/children/${id}`,
    DELETE: (id) => `${BASE_URL}/api/children/${id}`,
    CHECK_NICKNAME: `${BASE_URL}/api/children/check-nickname`,
  },
  
  // 家庭群组
  FAMILY: {
    CREATE: `${BASE_URL}/api/families`,
    GET_INFO: (id) => `${BASE_URL}/api/families/${id}`,
    INVITE: (id) => `${BASE_URL}/api/families/${id}/invite`,
    JOIN: (id) => `${BASE_URL}/api/families/${id}/join`,
    REMOVE_MEMBER: (id, memberId) => 
      `${BASE_URL}/api/families/${id}/members/${memberId}`,
  },
  
  // 听写功能
  DICTATION: {
    CREATE: `${BASE_URL}/api/dictations`,
    GET_WORDS: (mode, grade, unit) => 
      `${BASE_URL}/api/words?mode=${mode}&grade=${grade}&unit=${unit}`,
    SUBMIT_RESULT: (id) => `${BASE_URL}/api/dictations/${id}/result`,
    GET_AUDIO: (id) => `${BASE_URL}/api/dictations/${id}/audio`,
  },
  
  // 统计信息
  STATISTICS: {
    GET_SUMMARY: (childId) => 
      `${BASE_URL}/api/statistics/summary/${childId}`,
    GET_DETAIL: (dictationId) => 
      `${BASE_URL}/api/statistics/detail/${dictationId}`,
  }
}; 