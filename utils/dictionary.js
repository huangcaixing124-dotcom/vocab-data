/**
 * 词典注册表 & 加载器
 * 移植自原版 src/resources/dictionary.ts
 */

const { CHAPTER_LENGTH } = require('./constants')

// 预加载词典数据（模块级别 require）
var _allDictData = null
try {
  _allDictData = require('./textbook-data.js')
} catch (e) {
  console.warn('Failed to load textbook-data.js:', e)
}

// 词典元数据（按难度从低到高排列）
const dictionaries = [
  // ============ 中国考试（按难度递增） ============
  { id: 'zhongkao', name: '中考核心', description: '中考英语核心词汇', category: '中国考试', tags: ['中考'], url: '/dicts/ZhongKaoHeXin.json', length: 2140, language: 'en', languageCategory: 'en' },
  { id: 'chuZhongluan', name: '初中高频', description: '初中英语高频词', category: '中国考试', tags: ['初中'], url: '/dicts/ChuZhongluan_2_T.json', length: 1420, language: 'en', languageCategory: 'en' },
  { id: 'gaokao_xin', name: '高考真题核心', description: '高考真题核心高频词', category: '中国考试', tags: ['高考'], url: '/dicts/GaoKaoZhenTiHeXinGaoPin.json', length: 799, language: 'en', languageCategory: 'en' },
  { id: 'gaokao', name: '高考', description: '高考英语词库', category: '中国考试', tags: ['高考'], url: '/dicts/GaoKao_3500.json', length: 3899, language: 'en', languageCategory: 'en' },
  { id: 'gaoZhongluan', name: '高中高频', description: '高中英语高频词', category: '中国考试', tags: ['高中'], url: '/dicts/GaoZhongluan_2_T.json', length: 3668, language: 'en', languageCategory: 'en' },
  { id: 'cet4', name: 'CET-4', description: '大学英语四级词库', category: '中国考试', tags: ['大学英语'], url: '/subpackages/data/CET4_T.json', length: 2607, language: 'en', languageCategory: 'en' },
  { id: 'cet4-sub', name: 'CET-4-Sub', description: '单词的减法-四级', category: '中国考试', tags: ['大学英语'], url: '/dicts/DanCiDeJianFa_4.json', length: 1957, language: 'en', languageCategory: 'en' },
  { id: 'xinghuoqiaoji_4', name: '四级巧记速记', description: '四级巧记速记', category: '中国考试', tags: ['大学英语'], url: '/dicts/xinghuoqiaoji_4.json', length: 2522, language: 'en', languageCategory: 'en' },
  { id: 'pets3', name: 'PETS', description: '全国英语等级考试常考词汇', category: '中国考试', tags: ['PET'], url: '/dicts/PETS_3.json', length: 1942, language: 'en', languageCategory: 'en' },
  { id: 'cet6', name: 'CET-6', description: '大学英语六级词库', category: '中国考试', tags: ['大学英语'], url: '/subpackages/data/CET6_T.json', length: 2345, language: 'en', languageCategory: 'en' },
  { id: 'cet6-sub', name: 'CET-6-Sub', description: '单词的减法-六级', category: '中国考试', tags: ['大学英语'], url: '/dicts/DanCiDeJianFa_6.json', length: 1949, language: 'en', languageCategory: 'en' },
  { id: 'xinghuoqiaoji_6', name: '六级巧记速记', description: '六级巧记速记', category: '中国考试', tags: ['大学英语'], url: '/dicts/xinghuoqiaoji_6.json', length: 7520, language: 'en', languageCategory: 'en' },
  { id: 'kaoyanshanguo', name: '考研闪过', description: '考研闪过词汇 2023', category: '中国考试', tags: ['考研'], url: '/dicts/KaoYanShanGuo_2023.json', length: 1771, language: 'en', languageCategory: 'en' },
  { id: 'kaoyan', name: '考研', description: '研究生英语入学考试词库', category: '中国考试', tags: ['考研'], url: '/subpackages/data/KaoYan_3_T.json', length: 3728, language: 'en', languageCategory: 'en' },
  { id: 'kaoyan_2024', name: '考研 2024', description: '研究生英语入学考试词库 2024', category: '中国考试', tags: ['考研'], url: '/dicts/KaoYan_2024.json', length: 3731, language: 'en', languageCategory: 'en' },
  { id: 'level4', name: '专四', description: '英语专业四级词库', category: '中国考试', tags: ['大学英语'], url: '/dicts/Level4luan_2_T.json', length: 4025, language: 'en', languageCategory: 'en' },
  { id: 'level8', name: '专八', description: '英语专业八级词库', category: '中国考试', tags: ['大学英语'], url: '/dicts/Level8luan_2_T.json', length: 12197, language: 'en', languageCategory: 'en' },

  // ============ 国际考试（按难度递增） ============
  { id: 'bec2', name: 'BEC-2', description: '商务英语中级词库', category: '国际考试', tags: ['BEC'], url: '/dicts/BEC_2_T.json', length: 2754, language: 'en', languageCategory: 'en' },
  { id: 'bec3', name: 'BEC-3', description: '商务英语高级词库', category: '国际考试', tags: ['BEC'], url: '/dicts/BEC_3_T.json', length: 2865, language: 'en', languageCategory: 'en' },
  { id: 'ielts', name: 'IELTS', description: '雅思词库', category: '国际考试', tags: ['雅思'], url: '/dicts/IELTS_3_T.json', length: 3575, language: 'en', languageCategory: 'en' },
  { id: 'ielts_xdf7000', name: '雅思-新东方7000', description: '新东方雅思词汇 7000', category: '国际考试', tags: ['雅思'], url: '/dicts/IELTS_XDF_7000.json', length: 5567, language: 'en', languageCategory: 'en' },
  { id: 'toefl', name: 'TOEFL', description: '托福词库', category: '国际考试', tags: ['托福'], url: '/dicts/TOEFL_3_T.json', length: 4264, language: 'en', languageCategory: 'en' },
  { id: 'toefl_zhang', name: 'TOEFL-张红岩', description: '张红岩托福词频精选', category: '国际考试', tags: ['托福'], url: '/dicts/TOEFL_ZhangHongYan.json', length: 4032, language: 'en', languageCategory: 'en' },
  { id: 'sat', name: 'SAT', description: 'SAT 词库', category: '国际考试', tags: ['SAT'], url: '/dicts/SAT_3_T.json', length: 4464, language: 'en', languageCategory: 'en' },
  { id: 'gre3000', name: 'GRE3000', description: 'GRE 3000 词精选', category: '国际考试', tags: ['GRE'], url: '/dicts/GRE3000_3_T.json', length: 3041, language: 'en', languageCategory: 'en' },
  { id: 'gre', name: 'GRE', description: 'GRE 词库', category: '国际考试', tags: ['GRE'], url: '/dicts/GRE_3_T.json', length: 6515, language: 'en', languageCategory: 'en' },
  { id: 'gmat', name: 'GMAT', description: 'GMAT 词库', category: '国际考试', tags: ['GMAT'], url: '/dicts/GMAT_3_T.json', length: 3037, language: 'en', languageCategory: 'en' },

  // ============ 英语词汇（按难度递增） ============
  { id: 'top2000', name: 'Top 2000', description: '最高频2000词', category: '英语词汇', tags: ['高频'], url: '/dicts/top2000words.json', length: 1867, language: 'en', languageCategory: 'en' },
  { id: 'nce1', name: '新概念英语-1', description: '新概念英语第一册', category: '英语词汇', tags: ['新概念'], url: '/subpackages/data/NCE_1.json', length: 900, language: 'en', languageCategory: 'en' },
  { id: 'nce2', name: '新概念英语-2', description: '新概念英语第二册', category: '英语词汇', tags: ['新概念'], url: '/dicts/NCE_2.json', length: 858, language: 'en', languageCategory: 'en' },
  { id: 'nce3', name: '新概念英语-3', description: '新概念英语第三册', category: '英语词汇', tags: ['新概念'], url: '/dicts/NCE_3.json', length: 1052, language: 'en', languageCategory: 'en' },
  { id: 'nce4', name: '新概念英语-4', description: '新概念英语第四册', category: '英语词汇', tags: ['新概念'], url: '/dicts/NCE_4.json', length: 784, language: 'en', languageCategory: 'en' },
  { id: 'oxford3000', name: 'Oxford 3000', description: '牛津核心3000词', category: '英语词汇', tags: ['牛津'], url: '/dicts/Oxford3000.json', length: 1342, language: 'en', languageCategory: 'en' },
  { id: 'longman3000', name: 'Longman 3000', description: '朗文交际3000词', category: '英语词汇', tags: ['朗文'], url: '/dicts/Longman_Communication_3000.json', length: 3168, language: 'en', languageCategory: 'en' },
  { id: 'oxford5000', name: 'Oxford 5000', description: '牛津核心5000词', category: '英语词汇', tags: ['牛津'], url: '/dicts/Oxford5000.json', length: 5836, language: 'en', languageCategory: 'en' },
  { id: 'dancidemimi_1', name: '单词的秘密-1', description: '单词的秘密 上册', category: '英语词汇', tags: ['词汇'], url: '/dicts/DanCiDeMimi_1.json', length: 5657, language: 'en', languageCategory: 'en' },
  { id: 'dancidemimi_2', name: '单词的秘密-2', description: '单词的秘密 下册', category: '英语词汇', tags: ['词汇'], url: '/dicts/DanCiDeMimi_2.json', length: 3827, language: 'en', languageCategory: 'en' },
  { id: 'coca20000', name: 'COCA 20000', description: '美国当代英语语料库 20000 词', category: '英语词汇', tags: ['语料库'], url: '/dicts/coca20000.json', length: 20199, language: 'en', languageCategory: 'en' },

  { id: 'pep_3a', name: '三年级上册', description: '人教版小学三年级上册', category: '课本单词', tags: ['小学', '人教版'], url: '/subpackages/data/pep_3a.json', length: 56, language: 'en', languageCategory: 'en' },
  { id: 'pep_4a', name: '四年级上册', description: '人教版小学四年级上册', category: '课本单词', tags: ['小学', '人教版'], url: '/subpackages/data/pep_4a.json', length: 69, language: 'en', languageCategory: 'en' },
  { id: 'pep_5a', name: '五年级上册', description: '人教版小学五年级上册', category: '课本单词', tags: ['小学', '人教版'], url: '/subpackages/data/pep_5a.json', length: 98, language: 'en', languageCategory: 'en' },
  { id: 'pep_6a', name: '六年级上册', description: '人教版小学六年级上册', category: '课本单词', tags: ['小学', '人教版'], url: '/subpackages/data/pep_6a.json', length: 105, language: 'en', languageCategory: 'en' },
  { id: 'pep_junior_7_up', name: '七年级上册', description: '人教版初中七年级上册', category: '课本单词', tags: ['初中', '人教版'], url: '/subpackages/data/pep_junior_7_up.json', length: 181, language: 'en', languageCategory: 'en' },
  { id: 'pep_junior_8_up', name: '八年级上册', description: '人教版初中八年级上册', category: '课本单词', tags: ['初中', '人教版'], url: '/subpackages/data/pep_junior_8_up.json', length: 193, language: 'en', languageCategory: 'en' },
  { id: 'pep_junior_9', name: '九年级全一册', description: '人教版初中九年级全一册', category: '课本单词', tags: ['初中', '人教版'], url: '/subpackages/data/pep_junior_9.json', length: 196, language: 'en', languageCategory: 'en' },
  { id: 'pep_3b', name: '三年级下册', description: '人教版小学三年级下册', category: '课本单词', tags: ['小学', '人教版'], url: '/subpackages/data/pep_3b.json', length: 67, language: 'en', languageCategory: 'en' },
  { id: 'pep_4b', name: '四年级下册', description: '人教版小学四年级下册', category: '课本单词', tags: ['小学', '人教版'], url: '/subpackages/data/pep_4b.json', length: 65, language: 'en', languageCategory: 'en' },
  { id: 'pep_5b', name: '五年级下册', description: '人教版小学五年级下册', category: '课本单词', tags: ['小学', '人教版'], url: '/subpackages/data/pep_5b.json', length: 88, language: 'en', languageCategory: 'en' },
  { id: 'pep_6b', name: '六年级下册', description: '人教版小学六年级下册', category: '课本单词', tags: ['小学', '人教版'], url: '/subpackages/data/pep_6b.json', length: 61, language: 'en', languageCategory: 'en' },
  { id: 'pep_junior_7_down', name: '七年级下册', description: '人教版初中七年级下册', category: '课本单词', tags: ['初中', '人教版'], url: '/subpackages/data/pep_junior_7_down.json', length: 192, language: 'en', languageCategory: 'en' },
  { id: 'pep_junior_8_down', name: '八年级下册', description: '人教版初中八年级下册', category: '课本单词', tags: ['初中', '人教版'], url: '/subpackages/data/pep_junior_8_down.json', length: 215, language: 'en', languageCategory: 'en' },
  { id: 'pep_senior_1', name: '高中必修一', description: '人教版高中英语必修第一册', category: '课本单词', tags: ['高中', '人教版'], url: '/subpackages/data/pep_senior_1.json', length: 153, language: 'en', languageCategory: 'en' },
  { id: 'pep_senior_2', name: '高中必修二', description: '人教版高中英语必修第二册', category: '课本单词', tags: ['高中', '人教版'], url: '/subpackages/data/pep_senior_2.json', length: 129, language: 'en', languageCategory: 'en' },
  { id: 'pep_senior_3', name: '高中必修三', description: '人教版高中英语必修第三册', category: '课本单词', tags: ['高中', '人教版'], url: '/subpackages/data/pep_senior_3.json', length: 140, language: 'en', languageCategory: 'en' },
  { id: 'yilin_3_up', name: '译林三年级上', description: '译林牛津版小学三年级上册', category: '课本单词', tags: ['小学', '译林版'], url: '/subpackages/data/yilin_3_up.json', length: 59, language: 'en', languageCategory: 'en' },
  { id: 'yilin_4_up', name: '译林四年级上', description: '译林牛津版小学四年级上册', category: '课本单词', tags: ['小学', '译林版'], url: '/subpackages/data/yilin_4_up.json', length: 63, language: 'en', languageCategory: 'en' },
  { id: 'yilin_5_up', name: '译林五年级上', description: '译林牛津版小学五年级上册', category: '课本单词', tags: ['小学', '译林版'], url: '/subpackages/data/yilin_5_up.json', length: 52, language: 'en', languageCategory: 'en' },
  { id: 'yilin_6_up', name: '译林六年级上', description: '译林牛津版小学六年级上册', category: '课本单词', tags: ['小学', '译林版'], url: '/subpackages/data/yilin_6_up.json', length: 53, language: 'en', languageCategory: 'en' },
  { id: 'yilin_7_up', name: '译林七年级上', description: '译林牛津版初中七年级上册', category: '课本单词', tags: ['初中', '译林版'], url: '/subpackages/data/yilin_7_up.json', length: 80, language: 'en', languageCategory: 'en' },
  { id: 'yilin_8_up', name: '译林八年级上', description: '译林牛津版初中八年级上册', category: '课本单词', tags: ['初中', '译林版'], url: '/subpackages/data/yilin_8_up.json', length: 80, language: 'en', languageCategory: 'en' },
  { id: 'yilin_9_up', name: '译林九年级上', description: '译林牛津版初中九年级上册', category: '课本单词', tags: ['初中', '译林版'], url: '/subpackages/data/yilin_9_up.json', length: 77, language: 'en', languageCategory: 'en' },
  { id: 'yilin_3_down', name: '译林三年级下', description: '译林牛津版小学三年级下册', category: '课本单词', tags: ['小学', '译林版'], url: '/subpackages/data/yilin_3_down.json', length: 59, language: 'en', languageCategory: 'en' },
  { id: 'yilin_4_down', name: '译林四年级下', description: '译林牛津版小学四年级下册', category: '课本单词', tags: ['小学', '译林版'], url: '/subpackages/data/yilin_4_down.json', length: 55, language: 'en', languageCategory: 'en' },
  { id: 'yilin_5_down', name: '译林五年级下', description: '译林牛津版小学五年级下册', category: '课本单词', tags: ['小学', '译林版'], url: '/subpackages/data/yilin_5_down.json', length: 56, language: 'en', languageCategory: 'en' },
  { id: 'yilin_6_down', name: '译林六年级下', description: '译林牛津版小学六年级下册', category: '课本单词', tags: ['小学', '译林版'], url: '/subpackages/data/yilin_6_down.json', length: 54, language: 'en', languageCategory: 'en' },
  { id: 'yilin_7_down', name: '译林七年级下', description: '译林牛津版初中七年级下册', category: '课本单词', tags: ['初中', '译林版'], url: '/subpackages/data/yilin_7_down.json', length: 80, language: 'en', languageCategory: 'en' },
  { id: 'yilin_8_down', name: '译林八年级下', description: '译林牛津版初中八年级下册', category: '课本单词', tags: ['初中', '译林版'], url: '/subpackages/data/yilin_8_down.json', length: 78, language: 'en', languageCategory: 'en' },
  { id: 'yilin_9_down', name: '译林九年级下', description: '译林牛津版初中九年级下册', category: '课本单词', tags: ['初中', '译林版'], url: '/subpackages/data/yilin_9_down.json', length: 58, language: 'en', languageCategory: 'en' },
  { id: 'yilin_1', name: '译林必修一', description: '译林版高中英语必修第一册', category: '课本单词', tags: ['高中', '译林版'], url: '/subpackages/data/yilin_1.json', length: 40, language: 'en', languageCategory: 'en' },
  { id: 'yilin_2', name: '译林必修二', description: '译林版高中英语必修第二册', category: '课本单词', tags: ['高中', '译林版'], url: '/subpackages/data/yilin_2.json', length: 40, language: 'en', languageCategory: 'en' },
  { id: 'yilin_3', name: '译林必修三', description: '译林版高中英语必修第三册', category: '课本单词', tags: ['高中', '译林版'], url: '/subpackages/data/yilin_3.json', length: 40, language: 'en', languageCategory: 'en' },
  { id: 'yilin_sel_1', name: '译林选修一', description: '译林版高中英语选择性必修第一册', category: '课本单词', tags: ['高中', '译林版'], url: '/subpackages/data/yilin_sel_1.json', length: 40, language: 'en', languageCategory: 'en' },
  { id: 'yilin_sel_2', name: '译林选修二', description: '译林版高中英语选择性必修第二册', category: '课本单词', tags: ['高中', '译林版'], url: '/subpackages/data/yilin_sel_2.json', length: 40, language: 'en', languageCategory: 'en' },
  { id: 'yilin_sel_3', name: '译林选修三', description: '译林版高中英语选择性必修第三册', category: '课本单词', tags: ['高中', '译林版'], url: '/subpackages/data/yilin_sel_3.json', length: 39, language: 'en', languageCategory: 'en' },
  { id: 'yilin_sel_4', name: '译林选修四', description: '译林版高中英语选择性必修第四册', category: '课本单词', tags: ['高中', '译林版'], url: '/subpackages/data/yilin_sel_4.json', length: 40, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_3_up', name: '外研三年级上', description: '外研版小学三年级上册', category: '课本单词', tags: ['小学', '外研版'], url: '/subpackages/data/waiyan_3_up.json', length: 61, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_4_up', name: '外研四年级上', description: '外研版小学四年级上册', category: '课本单词', tags: ['小学', '外研版'], url: '/subpackages/data/waiyan_4_up.json', length: 53, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_5_up', name: '外研五年级上', description: '外研版小学五年级上册', category: '课本单词', tags: ['小学', '外研版'], url: '/subpackages/data/waiyan_5_up.json', length: 54, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_6_up', name: '外研六年级上', description: '外研版小学六年级上册', category: '课本单词', tags: ['小学', '外研版'], url: '/subpackages/data/waiyan_6_up.json', length: 57, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_7_up', name: '外研七年级上', description: '外研版初中七年级上册', category: '课本单词', tags: ['初中', '外研版'], url: '/subpackages/data/waiyan_7_up.json', length: 110, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_8_up', name: '外研八年级上', description: '外研版初中八年级上册', category: '课本单词', tags: ['初中', '外研版'], url: '/subpackages/data/waiyan_8_up.json', length: 99, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_9_up', name: '外研九年级上', description: '外研版初中九年级上册', category: '课本单词', tags: ['初中', '外研版'], url: '/subpackages/data/waiyan_9_up.json', length: 100, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_3_down', name: '外研三年级下', description: '外研版小学三年级下册', category: '课本单词', tags: ['小学', '外研版'], url: '/subpackages/data/waiyan_3_down.json', length: 49, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_4_down', name: '外研四年级下', description: '外研版小学四年级下册', category: '课本单词', tags: ['小学', '外研版'], url: '/subpackages/data/waiyan_4_down.json', length: 55, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_5_down', name: '外研五年级下', description: '外研版小学五年级下册', category: '课本单词', tags: ['小学', '外研版'], url: '/subpackages/data/waiyan_5_down.json', length: 59, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_6_down', name: '外研六年级下', description: '外研版小学六年级下册', category: '课本单词', tags: ['小学', '外研版'], url: '/subpackages/data/waiyan_6_down.json', length: 34, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_7_down', name: '外研七年级下', description: '外研版初中七年级下册', category: '课本单词', tags: ['初中', '外研版'], url: '/subpackages/data/waiyan_7_down.json', length: 100, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_8_down', name: '外研八年级下', description: '外研版初中八年级下册', category: '课本单词', tags: ['初中', '外研版'], url: '/subpackages/data/waiyan_8_down.json', length: 99, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_9_down', name: '外研九年级下', description: '外研版初中九年级下册', category: '课本单词', tags: ['初中', '外研版'], url: '/subpackages/data/waiyan_9_down.json', length: 99, language: 'en', languageCategory: 'en' },
  // 外研版高中
  { id: 'waiyan_1', name: '外研必修一', description: '外研版高中英语必修第一册', category: '课本单词', tags: ['高中', '外研版'], url: '/subpackages/data/waiyan_1.json', length: 60, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_2', name: '外研必修二', description: '外研版高中英语必修第二册', category: '课本单词', tags: ['高中', '外研版'], url: '/subpackages/data/waiyan_2.json', length: 60, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_3', name: '外研必修三', description: '外研版高中英语必修第三册', category: '课本单词', tags: ['高中', '外研版'], url: '/subpackages/data/waiyan_3.json', length: 60, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_sel_1', name: '外研选修一', description: '外研版高中英语选择性必修第一册', category: '课本单词', tags: ['高中', '外研版'], url: '/subpackages/data/waiyan_sel_1.json', length: 60, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_sel_2', name: '外研选修二', description: '外研版高中英语选择性必修第二册', category: '课本单词', tags: ['高中', '外研版'], url: '/subpackages/data/waiyan_sel_2.json', length: 60, language: 'en', languageCategory: 'en' },
  { id: 'waiyan_sel_3', name: '外研选修三', description: '外研版高中英语选择性必修第三册', category: '课本单词', tags: ['高中', '外研版'], url: '/subpackages/data/waiyan_sel_3.json', length: 60, language: 'en', languageCategory: 'en' },
  { id: 'bsd_1', name: '北师大必修一', description: '北师大版高中英语必修第一册', category: '课本单词', tags: ['高中', '北师大版'], url: '/subpackages/data/bsd_1.json', length: 30, language: 'en', languageCategory: 'en' },
  { id: 'bsd_2', name: '北师大必修二', description: '北师大版高中英语必修第二册', category: '课本单词', tags: ['高中', '北师大版'], url: '/subpackages/data/bsd_2.json', length: 30, language: 'en', languageCategory: 'en' },
  { id: 'bsd_3', name: '北师大必修三', description: '北师大版高中英语必修第三册', category: '课本单词', tags: ['高中', '北师大版'], url: '/subpackages/data/bsd_3.json', length: 30, language: 'en', languageCategory: 'en' },
  { id: 'bsd_sel_1', name: '北师大选修一', description: '北师大版高中英语选择性必修第一册', category: '课本单词', tags: ['高中', '北师大版'], url: '/subpackages/data/bsd_sel_1.json', length: 30, language: 'en', languageCategory: 'en' },
  { id: 'bsd_sel_2', name: '北师大选修二', description: '北师大版高中英语选择性必修第二册', category: '课本单词', tags: ['高中', '北师大版'], url: '/subpackages/data/bsd_sel_2.json', length: 30, language: 'en', languageCategory: 'en' },
  { id: 'bsd_sel_3', name: '北师大选修三', description: '北师大版高中英语选择性必修第三册', category: '课本单词', tags: ['高中', '北师大版'], url: '/subpackages/data/bsd_sel_3.json', length: 30, language: 'en', languageCategory: 'en' },
  { id: 'renai_7_up', name: '仁爱七年级上', description: '仁爱科普版初中七年级上册', category: '课本单词', tags: ['初中', '仁爱版'], url: '/subpackages/data/renai_7_up.json', length: 80, language: 'en', languageCategory: 'en' },
  { id: 'renai_8_up', name: '仁爱八年级上', description: '仁爱科普版初中八年级上册', category: '课本单词', tags: ['初中', '仁爱版'], url: '/subpackages/data/renai_8_up.json', length: 80, language: 'en', languageCategory: 'en' },
  { id: 'renai_9_full', name: '仁爱九年级全一册', description: '仁爱科普版初中九年级全一册', category: '课本单词', tags: ['初中', '仁爱版'], url: '/subpackages/data/renai_9_full.json', length: 80, language: 'en', languageCategory: 'en' },
  { id: 'renai_7_down', name: '仁爱七年级下', description: '仁爱科普版初中七年级下册', category: '课本单词', tags: ['初中', '仁爱版'], url: '/subpackages/data/renai_7_down.json', length: 79, language: 'en', languageCategory: 'en' },
  { id: 'renai_8_down', name: '仁爱八年级下', description: '仁爱科普版初中八年级下册', category: '课本单词', tags: ['初中', '仁爱版'], url: '/subpackages/data/renai_8_down.json', length: 79, language: 'en', languageCategory: 'en' },
  { id: 'oxford_3_up', name: '沪教三年级上', description: '沪教牛津版小学三年级上册', category: '课本单词', tags: ['小学', '沪教版'], url: '/subpackages/data/oxford_3_up.json', length: 80, language: 'en', languageCategory: 'en' },
  { id: 'oxford_4_up', name: '沪教四年级上', description: '沪教牛津版小学四年级上册', category: '课本单词', tags: ['小学', '沪教版'], url: '/subpackages/data/oxford_4_up.json', length: 80, language: 'en', languageCategory: 'en' },
  { id: 'oxford_5_up', name: '沪教五年级上', description: '沪教牛津版小学五年级上册', category: '课本单词', tags: ['小学', '沪教版'], url: '/subpackages/data/oxford_5_up.json', length: 77, language: 'en', languageCategory: 'en' },
  { id: 'oxford_6_up', name: '沪教六年级上', description: '沪教牛津版小学六年级上册', category: '课本单词', tags: ['小学', '沪教版'], url: '/subpackages/data/oxford_6_up.json', length: 73, language: 'en', languageCategory: 'en' },
  { id: 'oxford_3_down', name: '沪教三年级下', description: '沪教牛津版小学三年级下册', category: '课本单词', tags: ['小学', '沪教版'], url: '/subpackages/data/oxford_3_down.json', length: 76, language: 'en', languageCategory: 'en' },
  { id: 'oxford_4_down', name: '沪教四年级下', description: '沪教牛津版小学四年级下册', category: '课本单词', tags: ['小学', '沪教版'], url: '/subpackages/data/oxford_4_down.json', length: 79, language: 'en', languageCategory: 'en' },
  { id: 'oxford_5_down', name: '沪教五年级下', description: '沪教牛津版小学五年级下册', category: '课本单词', tags: ['小学', '沪教版'], url: '/subpackages/data/oxford_5_down.json', length: 77, language: 'en', languageCategory: 'en' },
  { id: 'oxford_6_down', name: '沪教六年级下', description: '沪教牛津版小学六年级下册', category: '课本单词', tags: ['小学', '沪教版'], url: '/subpackages/data/oxford_6_down.json', length: 79, language: 'en', languageCategory: 'en' },
]
// ID 到词典的映射
const idDictionaryMap = {}
dictionaries.forEach((dict) => {
  idDictionaryMap[dict.id] = {
    ...dict,
    chapterCount: Math.ceil(dict.length / CHAPTER_LENGTH),
  }
})

// 语言分类
const languageCategories = [
  { key: 'en', name: '英语' },
]

/**
 * 获取所有词典
 */
function getAllDictionaries() {
  return dictionaries.map((dict) => ({
    ...dict,
    chapterCount: Math.ceil(dict.length / CHAPTER_LENGTH),
  }))
}

/**
 * 根据 ID 获取词典
 */
function getDictionary(id) {
  return idDictionaryMap[id] || idDictionaryMap['cet4']
}

/**
 * 按分类获取词典
 */
function getDictionariesByCategory(category) {
  return dictionaries
    .filter((d) => d.category === category)
    .map((dict) => ({
      ...dict,
      chapterCount: Math.ceil(dict.length / CHAPTER_LENGTH),
    }))
}

/**
 * 按语言分类获取词典
 */
function getDictionariesByLanguage(languageCategory) {
  return dictionaries
    .filter((d) => d.languageCategory === languageCategory)
    .map((dict) => ({
      ...dict,
      chapterCount: Math.ceil(dict.length / CHAPTER_LENGTH),
    }))
}

/**
 * 获取所有分类
 */
function getCategories() {
  const categories = []
  const seen = new Set()
  dictionaries.forEach((d) => {
    if (!seen.has(d.category)) {
      seen.add(d.category)
      categories.push(d.category)
    }
  })
  return categories
}

/**
 * 获取词典的章节单词切片
 * @param {Array} words - 完整单词列表
 * @param {number} chapter - 章节索引（从 0 开始）
 * @returns {Array} 该章节的单词列表
 */
function getChapterWords(words, chapter) {
  const start = chapter * CHAPTER_LENGTH
  const end = start + CHAPTER_LENGTH
  return words.slice(start, end)
}

/**
 * 加载词典数据
 * @param {string} dictId - 词典 ID
 * @returns {Promise<Array>} 单词列表
 */
function loadDictionary(dictId) {
  const dict = getDictionary(dictId)
  if (!dict) return Promise.reject(new Error('词典不存在: ' + dictId))

  return new Promise((resolve, reject) => {
    // 1. 从本地缓存读取
    const cacheKey = 'dict_cache_' + dictId
    const cached = wx.getStorageSync(cacheKey)
    if (cached && Array.isArray(cached) && cached.length > 0) {
      resolve(cached)
      return
    }

    // 2. 从预加载的词典数据读取
    if (_allDictData && _allDictData[dictId]) {
      var rawData = _allDictData[dictId]
      var words
      if (Array.isArray(rawData) && rawData.length > 0) {
        if (typeof rawData[0] === 'string') {
          words = rawData.map(function (w) {
            return { name: w[0], trans: w[1] ? [w[1]] : [], usphone: '', ukphone: '' }
          })
        } else if (Array.isArray(rawData[0])) {
          words = rawData.map(function (w) {
            return { name: w[0], trans: w[1] ? [w[1]] : [], usphone: w[2] || '', ukphone: '' }
          })
        } else if (typeof rawData[0] === 'object') {
          words = rawData
        }
        if (words) {
          wx.setStorageSync(cacheKey, words)
          resolve(words)
          return
        }
      }
    }

    // 3. 课本词典：从 JS 模块读取
    if (dictId.startsWith('pep_')) {
      try {
        var textbookData = require('./textbook-data.js')
        var rawData = textbookData[dictId]
        if (rawData && Array.isArray(rawData)) {
          var words = rawData.map(function (w) {
            return { name: w[0], trans: w[1] ? [w[1]] : [], usphone: '', ukphone: '' }
          })
          wx.setStorageSync(cacheKey, words)
          resolve(words)
          return
        }
      } catch (e) {}
    }

    // 4. 其他词典：从文件系统读取
    try {
      const fs = wx.getFileSystemManager()
      const fileName = dict.url.split('/').pop()
      const paths = [
        dict.url.replace(/^\//, ''),
        dict.url,
        '/subpackages/data/' + fileName,
        wx.env.USER_DATA_PATH + '/dicts/' + fileName,
      ]
      for (const filePath of paths) {
        try {
          const data = fs.readFileSync(filePath, 'utf8')
          const words = JSON.parse(data)
          if (Array.isArray(words) && words.length > 0) {
            wx.setStorageSync(cacheKey, words)
            resolve(words)
            return
          }
        } catch (e2) {}
      }
    } catch (e) {}

    reject(new Error('词典加载失败'))
  })
}

/**
 * 预下载词典到本地（已弃用，词典数据已内置）
 */
function downloadDictionary(dictId) {
  return Promise.reject(new Error('词典数据已内置，无需下载'))
}

module.exports = {
  dictionaries,
  idDictionaryMap,
  languageCategories,
  getAllDictionaries,
  getDictionary,
  getDictionariesByCategory,
  getDictionariesByLanguage,
  getCategories,
  getChapterWords,
  loadDictionary,
  downloadDictionary,
}
