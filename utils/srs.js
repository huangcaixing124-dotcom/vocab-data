/**
 * 间隔重复系统 (Spaced Repetition System)
 * 简化版 SM-2 算法
 */

var { STORAGE_KEYS } = require('./constants')

/**
 * 获取所有 SRS 数据
 */
function getSRSData() {
  try {
    var data = wx.getStorageSync(STORAGE_KEYS.SRS_DATA)
    return (data && typeof data === 'object') ? data : {}
  } catch (e) {
    return {}
  }
}

function saveSRSData(data) {
  try {
    wx.setStorageSync(STORAGE_KEYS.SRS_DATA, data)
  } catch (e) {}
}

/**
 * 获取单词的 SRS 信息
 * @returns {{ interval: number, ease: number, nextReview: number, reviewCount: number }}
 */
function getWordSRS(word) {
  var data = getSRSData()
  return data[word] || null
}

/**
 * 更新单词的 SRS 数据
 * @param {string} word - 单词
 * @param {boolean} isCorrect - 本次是否正确（无错误）
 */
function updateSRS(word, isCorrect) {
  if (!word) return
  var data = getSRSData()
  var entry = data[word] || { interval: 0, ease: 2.5, nextReview: 0, reviewCount: 0 }
  var now = Date.now()

  if (isCorrect) {
    if (entry.interval === 0) {
      // 首次正确：1天后复习
      entry.interval = 1
    } else {
      // 复习正确：interval × ease
      entry.interval = Math.round(entry.interval * entry.ease)
    }
    entry.ease = Math.min(3.0, entry.ease + 0.1)
  } else {
    // 错误：重置为1天，降低 ease
    entry.interval = 1
    entry.ease = Math.max(1.3, entry.ease - 0.2)
  }

  entry.nextReview = now + entry.interval * 86400000 // days -> ms
  entry.reviewCount++
  data[word] = entry
  saveSRSData(data)
}

/**
 * 获取今日待复习的单词列表
 * @param {Array} allWords - 词典中所有单词 [{name, trans, ...}]
 * @returns {Array} 需要复习的单词
 */
function getReviewDueWords(allWords) {
  if (!allWords || allWords.length === 0) return []
  var data = getSRSData()
  var now = Date.now()
  var due = []
  for (var i = 0; i < allWords.length; i++) {
    var word = allWords[i].name
    var entry = data[word]
    if (entry && entry.nextReview <= now) {
      due.push(allWords[i])
    }
  }
  return due
}

/**
 * 获取今日待复习数量
 */
function getReviewDueCount(allWords) {
  return getReviewDueWords(allWords).length
}

module.exports = {
  getSRSData: getSRSData,
  getWordSRS: getWordSRS,
  updateSRS: updateSRS,
  getReviewDueWords: getReviewDueWords,
  getReviewDueCount: getReviewDueCount,
}
