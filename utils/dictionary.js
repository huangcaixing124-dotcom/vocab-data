/**
 * 词典注册表 & 加载器
 * 移植自原版 src/resources/dictionary.ts
 */

const { CHAPTER_LENGTH } = require('./constants')

// 词典元数据
const dictionaries = [
  // ============ 中国考试 ============
  { id: 'cet4', name: 'CET-4', description: '大学英语四级词库', category: '中国考试', tags: ['大学英语'], url: '/dicts/CET4_T.json', length: 2607, language: 'en', languageCategory: 'en' },
  { id: 'cet6', name: 'CET-6', description: '大学英语六级词库', category: '中国考试', tags: ['大学英语'], url: '/dicts/CET6_T.json', length: 2345, language: 'en', languageCategory: 'en' },
  { id: 'kaoyan', name: '考研', description: '研究生英语入学考试词库', category: '中国考试', tags: ['考研'], url: '/dicts/KaoYan_3_T.json', length: 3728, language: 'en', languageCategory: 'en' },
  { id: 'kaoyan_2024', name: '考研 2024', description: '研究生英语入学考试词库 2024', category: '中国考试', tags: ['考研'], url: '/dicts/KaoYan_2024.json', length: 3731, language: 'en', languageCategory: 'en' },
  { id: 'kaoyanshanguo', name: '考研闪过', description: '考研闪过词汇 2023', category: '中国考试', tags: ['考研'], url: '/dicts/KaoYanShanGuo_2023.json', length: 1771, language: 'en', languageCategory: 'en' },
  { id: 'xinghuoqiaoji_4', name: '四级巧记速记', description: '四级巧记速记', category: '中国考试', tags: ['大学英语'], url: '/dicts/xinghuoqiaoji_4.json', length: 2522, language: 'en', languageCategory: 'en' },
  { id: 'xinghuoqiaoji_6', name: '六级巧记速记', description: '六级巧记速记', category: '中国考试', tags: ['大学英语'], url: '/dicts/xinghuoqiaoji_6.json', length: 7520, language: 'en', languageCategory: 'en' },
  { id: 'cet4-sub', name: 'CET-4-Sub', description: '单词的减法-四级', category: '中国考试', tags: ['大学英语'], url: '/dicts/DanCiDeJianFa_4.json', length: 1957, language: 'en', languageCategory: 'en' },
  { id: 'cet6-sub', name: 'CET-6-Sub', description: '单词的减法-六级', category: '中国考试', tags: ['大学英语'], url: '/dicts/DanCiDeJianFa_6.json', length: 1949, language: 'en', languageCategory: 'en' },
  { id: 'level4', name: '专四', description: '英语专业四级词库', category: '中国考试', tags: ['大学英语'], url: '/dicts/Level4luan_2_T.json', length: 4025, language: 'en', languageCategory: 'en' },
  { id: 'level8', name: '专八', description: '英语专业八级词库', category: '中国考试', tags: ['大学英语'], url: '/dicts/Level8luan_2_T.json', length: 12197, language: 'en', languageCategory: 'en' },
  { id: 'pets3', name: 'PETS', description: '全国英语等级考试常考词汇', category: '中国考试', tags: ['PET'], url: '/dicts/PETS_3.json', length: 1942, language: 'en', languageCategory: 'en' },
  { id: 'gaokao', name: '高考', description: '高考英语词库', category: '中国考试', tags: ['高考'], url: '/dicts/GaoKao_3500.json', length: 3899, language: 'en', languageCategory: 'en' },
  { id: 'gaokao_xin', name: '高考真题核心', description: '高考真题核心高频词', category: '中国考试', tags: ['高考'], url: '/dicts/GaoKaoZhenTiHeXinGaoPin.json', length: 799, language: 'en', languageCategory: 'en' },
  { id: 'zhongkao', name: '中考核心', description: '中考英语核心词汇', category: '中国考试', tags: ['中考'], url: '/dicts/ZhongKaoHeXin.json', length: 2140, language: 'en', languageCategory: 'en' },
  { id: 'chuZhongluan', name: '初中高频', description: '初中英语高频词', category: '中国考试', tags: ['初中'], url: '/dicts/ChuZhongluan_2_T.json', length: 1420, language: 'en', languageCategory: 'en' },
  { id: 'gaoZhongluan', name: '高中高频', description: '高中英语高频词', category: '中国考试', tags: ['高中'], url: '/dicts/GaoZhongluan_2_T.json', length: 3668, language: 'en', languageCategory: 'en' },

  // ============ 国际考试 ============
  { id: 'toefl', name: 'TOEFL', description: '托福词库', category: '国际考试', tags: ['托福'], url: '/dicts/TOEFL_3_T.json', length: 4264, language: 'en', languageCategory: 'en' },
  { id: 'toefl_zhang', name: 'TOEFL-张红岩', description: '张红岩托福词频精选', category: '国际考试', tags: ['托福'], url: '/dicts/TOEFL_ZhangHongYan.json', length: 4032, language: 'en', languageCategory: 'en' },
  { id: 'ielts', name: 'IELTS', description: '雅思词库', category: '国际考试', tags: ['雅思'], url: '/dicts/IELTS_3_T.json', length: 3575, language: 'en', languageCategory: 'en' },
  { id: 'ielts_xdf7000', name: '雅思-新东方7000', description: '新东方雅思词汇 7000', category: '国际考试', tags: ['雅思'], url: '/dicts/IELTS_XDF_7000.json', length: 5567, language: 'en', languageCategory: 'en' },
  { id: 'gre', name: 'GRE', description: 'GRE 词库', category: '国际考试', tags: ['GRE'], url: '/dicts/GRE_3_T.json', length: 6515, language: 'en', languageCategory: 'en' },
  { id: 'gre3000', name: 'GRE3000', description: 'GRE 3000 词精选', category: '国际考试', tags: ['GRE'], url: '/dicts/GRE3000_3_T.json', length: 3041, language: 'en', languageCategory: 'en' },
  { id: 'sat', name: 'SAT', description: 'SAT 词库', category: '国际考试', tags: ['SAT'], url: '/dicts/SAT_3_T.json', length: 4464, language: 'en', languageCategory: 'en' },
  { id: 'bec2', name: 'BEC-2', description: '商务英语中级词库', category: '国际考试', tags: ['BEC'], url: '/dicts/BEC_2_T.json', length: 2754, language: 'en', languageCategory: 'en' },
  { id: 'bec3', name: 'BEC-3', description: '商务英语高级词库', category: '国际考试', tags: ['BEC'], url: '/dicts/BEC_3_T.json', length: 2865, language: 'en', languageCategory: 'en' },
  { id: 'gmat', name: 'GMAT', description: 'GMAT 词库', category: '国际考试', tags: ['GMAT'], url: '/dicts/GMAT_3_T.json', length: 3037, language: 'en', languageCategory: 'en' },

  // ============ 英语词汇 ============
  { id: 'nce1', name: '新概念英语-1', description: '新概念英语第一册', category: '英语词汇', tags: ['新概念'], url: '/dicts/NCE_1.json', length: 900, language: 'en', languageCategory: 'en' },
  { id: 'nce2', name: '新概念英语-2', description: '新概念英语第二册', category: '英语词汇', tags: ['新概念'], url: '/dicts/NCE_2.json', length: 858, language: 'en', languageCategory: 'en' },
  { id: 'nce3', name: '新概念英语-3', description: '新概念英语第三册', category: '英语词汇', tags: ['新概念'], url: '/dicts/NCE_3.json', length: 1052, language: 'en', languageCategory: 'en' },
  { id: 'nce4', name: '新概念英语-4', description: '新概念英语第四册', category: '英语词汇', tags: ['新概念'], url: '/dicts/NCE_4.json', length: 784, language: 'en', languageCategory: 'en' },
  { id: 'oxford3000', name: 'Oxford 3000', description: '牛津核心3000词', category: '英语词汇', tags: ['牛津'], url: '/dicts/Oxford3000.json', length: 1342, language: 'en', languageCategory: 'en' },
  { id: 'oxford5000', name: 'Oxford 5000', description: '牛津核心5000词', category: '英语词汇', tags: ['牛津'], url: '/dicts/Oxford5000.json', length: 5836, language: 'en', languageCategory: 'en' },
  { id: 'longman3000', name: 'Longman 3000', description: '朗文交际3000词', category: '英语词汇', tags: ['朗文'], url: '/dicts/Longman_Communication_3000.json', length: 3168, language: 'en', languageCategory: 'en' },
  { id: 'top2000', name: 'Top 2000', description: '最高频2000词', category: '英语词汇', tags: ['高频'], url: '/dicts/top2000words.json', length: 1867, language: 'en', languageCategory: 'en' },
  { id: 'coca20000', name: 'COCA 20000', description: '美国当代英语语料库 20000 词', category: '英语词汇', tags: ['语料库'], url: '/dicts/coca20000.json', length: 20199, language: 'en', languageCategory: 'en' },
  { id: 'dancidemimi_1', name: '单词的秘密-1', description: '单词的秘密 上册', category: '英语词汇', tags: ['词汇'], url: '/dicts/DanCiDeMimi_1.json', length: 5657, language: 'en', languageCategory: 'en' },
  { id: 'dancidemimi_2', name: '单词的秘密-2', description: '单词的秘密 下册', category: '英语词汇', tags: ['词汇'], url: '/dicts/DanCiDeMimi_2.json', length: 3827, language: 'en', languageCategory: 'en' },
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

    // 2. 从小程序包内读取
    try {
      const fs = wx.getFileSystemManager()
      const fileName = dict.url.replace('/dicts/', '')
      // 真机上正确的相对路径是 dicts/xxx.json（无前缀斜杠）
      const paths = [
        'dicts/' + fileName,         // dicts/CET4_T.json（真机正确格式）
        dict.url.replace(/^\//, ''), // dicts/CET4_T.json（去掉开头斜杠）
        dict.url,                    // /dicts/CET4_T.json
        fileName,                    // CET4_T.json
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
        } catch (e) {
          continue
        }
      }
    } catch (e) {
      // 文件系统不可用
    }

    // 3. 从 CDN 下载（jsdelivr 国内速度较好）
    const cdnUrl = 'https://cdn.jsdelivr.net/gh/RealKai42/qwerty-learner@gh-pages' + dict.url
    wx.request({
      url: cdnUrl,
      dataType: 'json',
      success(res) {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          try {
            wx.setStorageSync(cacheKey, res.data)
          } catch (e) {
            console.warn('缓存写入失败:', e)
          }
          resolve(res.data)
        } else {
          reject(new Error('词典数据格式错误'))
        }
      },
      fail() {
        // 备用源：raw.githubusercontent.com
        wx.request({
          url: 'https://raw.githubusercontent.com/RealKai42/qwerty-learner/gh-pages' + dict.url,
          dataType: 'json',
          success(res) {
            if (res.statusCode === 200 && Array.isArray(res.data)) {
              try { wx.setStorageSync(cacheKey, res.data) } catch (e) {}
              resolve(res.data)
            } else {
              reject(new Error('词典数据格式错误'))
            }
          },
          fail() {
            reject(new Error('词典加载失败，请在 mp.weixin.qq.com 后台添加 cdn.jsdelivr.net 到服务器域名白名单'))
          },
        })
      },
    })
  })
}

/**
 * 预下载词典到本地
 */
function downloadDictionary(dictId) {
  const dict = getDictionary(dictId)
  if (!dict) return Promise.reject(new Error('Dictionary not found'))

  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://raw.githubusercontent.com/RealKai42/qwerty-learner/gh-pages' + dict.url,
      success(res) {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          const fs = wx.getFileSystemManager()
          const dirPath = `${wx.env.USER_DATA_PATH}/dicts`

          try {
            fs.mkdirSync(dirPath, true)
          } catch (e) {
            // 目录已存在
          }

          const filePath = `${dirPath}/${dict.url.replace('/dicts/', '')}`
          fs.writeFileSync(filePath, JSON.stringify(res.data), 'utf8')
          wx.setStorageSync('dict_cache_' + dictId, res.data)
          resolve(res.data)
        } else {
          reject(new Error('Invalid data'))
        }
      },
      fail: reject,
    })
  })
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
