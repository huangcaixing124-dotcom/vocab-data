/**
 * 本地存储工具 - 替代原版 Dexie/IndexedDB
 * 使用 wx.setStorageSync / wx.getStorageSync
 */

const { STORAGE_KEYS } = require('./constants')

/**
 * 通用存储读取
 */
function getStore(key, defaultValue = null) {
  try {
    const value = wx.getStorageSync(key)
    return value !== '' ? value : defaultValue
  } catch (e) {
    console.error('Storage get error:', key, e)
    return defaultValue
  }
}

/**
 * 通用存储写入
 */
function setStore(key, value) {
  try {
    wx.setStorageSync(key, value)
  } catch (e) {
    console.error('Storage set error:', key, e)
  }
}

/**
 * 通用存储删除
 */
function removeStore(key) {
  try {
    wx.removeStorageSync(key)
  } catch (e) {
    console.error('Storage remove error:', key, e)
  }
}

// ============ Word Records ============

/**
 * 获取所有单词记录
 */
function getWordRecords() {
  return getStore(STORAGE_KEYS.WORD_RECORDS, [])
}

/**
 * 添加单词记录
 * @returns {number} 新记录的 ID
 */
function addWordRecord(record) {
  const records = getWordRecords()
  const id = records.length > 0 ? records[records.length - 1].id + 1 : 1
  const newRecord = { ...record, id, timeStamp: Date.now() }
  records.push(newRecord)
  setStore(STORAGE_KEYS.WORD_RECORDS, records)
  return id
}

/**
 * 获取指定词典和章节的单词记录
 */
function getWordRecordsByDictAndChapter(dict, chapter) {
  const records = getWordRecords()
  return records.filter((r) => r.dict === dict && r.chapter === chapter)
}

/**
 * 获取有错误的单词记录
 */
function getErrorWordRecords() {
  const records = getWordRecords()
  return records.filter((r) => r.wrongCount > 0)
}

/**
 * 获取指定词典有错误的单词记录
 */
function getErrorWordRecordsByDict(dict) {
  const records = getWordRecords()
  return records.filter((r) => r.dict === dict && r.wrongCount > 0)
}

/**
 * 删除指定单词和词典的所有记录
 */
function deleteWordRecordsByWordAndDict(word, dict) {
  const records = getWordRecords()
  const filtered = records.filter((r) => !(r.word === word && r.dict === dict))
  setStore(STORAGE_KEYS.WORD_RECORDS, filtered)
}

/**
 * 删除指定记录 ID
 */
function deleteWordRecordById(id) {
  const records = getWordRecords()
  const filtered = records.filter((r) => r.id !== id)
  setStore(STORAGE_KEYS.WORD_RECORDS, filtered)
}

// ============ Chapter Records ============

/**
 * 获取所有章节记录
 */
function getChapterRecords() {
  return getStore(STORAGE_KEYS.CHAPTER_RECORDS, [])
}

/**
 * 添加章节记录
 * @returns {number} 新记录的 ID
 */
function addChapterRecord(record) {
  const records = getChapterRecords()
  const id = records.length > 0 ? records[records.length - 1].id + 1 : 1
  const newRecord = { ...record, id, timeStamp: Date.now() }
  records.push(newRecord)
  setStore(STORAGE_KEYS.CHAPTER_RECORDS, records)
  return id
}

/**
 * 获取指定词典的章节记录
 */
function getChapterRecordsByDict(dict) {
  const records = getChapterRecords()
  return records.filter((r) => r.dict === dict)
}

/**
 * 获取指定词典已完成的章节列表
 */
function getFinishedChapters(dict) {
  const records = getChapterRecordsByDict(dict)
  const finishedChapters = new Set()
  records.forEach((r) => {
    if (r.chapter !== null) {
      finishedChapters.add(r.chapter)
    }
  })
  return finishedChapters
}

// ============ Review Records ============

/**
 * 获取所有复习记录
 */
function getReviewRecords() {
  return getStore(STORAGE_KEYS.REVIEW_RECORDS, [])
}

/**
 * 添加复习记录
 * @returns {number} 新记录的 ID
 */
function addReviewRecord(record) {
  const records = getReviewRecords()
  const id = records.length > 0 ? records[records.length - 1].id + 1 : 1
  const newRecord = { ...record, id, createTime: Date.now(), isFinished: false }
  records.push(newRecord)
  setStore(STORAGE_KEYS.REVIEW_RECORDS, records)
  return id
}

/**
 * 更新复习记录
 */
function updateReviewRecord(id, updates) {
  const records = getReviewRecords()
  const index = records.findIndex((r) => r.id === id)
  if (index !== -1) {
    records[index] = { ...records[index], ...updates }
    setStore(STORAGE_KEYS.REVIEW_RECORDS, records)
  }
}

/**
 * 获取指定词典的未完成复习记录
 */
function getActiveReviewRecord(dict) {
  const records = getReviewRecords()
  return records.find((r) => r.dict === dict && !r.isFinished)
}

// ============ Config ============

/**
 * 获取配置
 */
function getConfig(key, defaultValue) {
  return getStore(key, defaultValue)
}

/**
 * 设置配置
 */
function setConfig(key, value) {
  setStore(key, value)
}

// ============ Data Export/Import ============

/**
 * 导出所有数据
 */
function exportAllData() {
  return {
    wordRecords: getWordRecords(),
    chapterRecords: getChapterRecords(),
    reviewRecords: getReviewRecords(),
    exportTime: Date.now(),
  }
}

/**
 * 导入数据
 */
function importData(data) {
  if (data.wordRecords) setStore(STORAGE_KEYS.WORD_RECORDS, data.wordRecords)
  if (data.chapterRecords) setStore(STORAGE_KEYS.CHAPTER_RECORDS, data.chapterRecords)
  if (data.reviewRecords) setStore(STORAGE_KEYS.REVIEW_RECORDS, data.reviewRecords)
}

/**
 * 清空所有数据
 */
function clearAllData() {
  setStore(STORAGE_KEYS.WORD_RECORDS, [])
  setStore(STORAGE_KEYS.CHAPTER_RECORDS, [])
  setStore(STORAGE_KEYS.REVIEW_RECORDS, [])
}

module.exports = {
  getStore,
  setStore,
  removeStore,
  getWordRecords,
  addWordRecord,
  getWordRecordsByDictAndChapter,
  getErrorWordRecords,
  getErrorWordRecordsByDict,
  deleteWordRecordsByWordAndDict,
  deleteWordRecordById,
  getChapterRecords,
  addChapterRecord,
  getChapterRecordsByDict,
  getFinishedChapters,
  getReviewRecords,
  addReviewRecord,
  updateReviewRecord,
  getActiveReviewRecord,
  getConfig,
  setConfig,
  exportAllData,
  importData,
  clearAllData,
}
