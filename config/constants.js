// 教材版本映射关系
export const TEXTBOOK_VERSION = {
  // 中文名到代号的映射
  CN_TO_CODE: {
    '人教版': 'renjiaoban',
    '北师大版': 'beishidaban',
    '苏教版': 'sujiaob',
    '语文版': 'yuwenban',
    '部编版': 'bubianban'
  },
  // 代号到中文名的映射
  CODE_TO_CN: {
    'renjiaoban': '人教版',
    'beishidaban': '北师大版',
    'sujiaob': '苏教版',
    'yuwenban': '语文版',
    'bubianban': '部编版'
  }
};

// 教材版本相关的工具方法
export const TextbookVersionUtil = {
  // 转换教材版本为代号
  formatVersion(cnVersion) {
    return TEXTBOOK_VERSION.CN_TO_CODE[cnVersion] || 'renjiaoban';
  },

  // 转换代号为教材版本中文名
  parseVersion(code) {
    return TEXTBOOK_VERSION.CODE_TO_CN[code] || '人教版';
  },

  // 获取所有支持的教材版本（中文名列表）
  getSupportedVersions() {
    return Object.keys(TEXTBOOK_VERSION.CN_TO_CODE);
  }
}; 