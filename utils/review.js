/**
 * 复习系统
 * 移植自原版 src/utils/db/review-record.ts
 */

const storage = require('./storage')
const { getErrorWordData } = require('./record')
const { loadDictionary, getDictionary } = require('./dictionary')

/**
 * 生成复习词表
 * 排名算法：错误次数(60%) + 最近错误时间(40%)
 * @param {string} dictId - 词典 ID
 * @returns {Promise<Object>} 复习记录
 */
async function generateReviewRecord(dictId) {
  const errorData = getErrorWordData(dictId)

  if (errorData.length === 0) {
    return null
  }

  // 加载词典获取单词详情
  const words = await loadDictionary(dictId)
  const wordMap = {}
  words.forEach((w) => {
    wordMap[w.name] = w
  })

  // 计算排名分数
  const maxError = Math.max(...errorData.map((d) => d.errorCount))
  const now = Date.now()
  const maxTimeDiff = now - Math.min(...errorData.map((d) => d.latestErrorTime))

  const scoredWords = errorData.map((data) => {
    const errorScore = maxError > 0 ? data.errorCount / maxError : 0
    const timeScore = maxTimeDiff > 0 ? (now - data.latestErrorTime) / maxTimeDiff : 0
    const score = errorScore * 0.6 + timeScore * 0.4

    return {
      ...data,
      score,
      originData: wordMap[data.word] || { name: data.word, trans: [], usphone: '', ukphone: '' },
    }
  })

  // 按分数排序（分数高的排前面，即错误多且最近犯的）
  scoredWords.sort((a, b) => b.score - a.score)

  // 生成复习词表（取前 20 个或全部，以较多者为准）
  const reviewWords = scoredWords.slice(0, Math.max(20, scoredWords.length)).map((d) => d.originData)

  // 保存复习记录
  const record = {
    dict: dictId,
    index: 0,
    words: reviewWords,
  }

  const id = storage.addReviewRecord(record)
  return { ...record, id }
}

/**
 * 获取指定词典的活跃复习记录
 */
function getActiveReview(dictId) {
  return storage.getActiveReviewRecord(dictId)
}

/**
 * 更新复习进度
 */
function updateReviewProgress(reviewId, index) {
  storage.updateReviewRecord(reviewId, { index })
}

/**
 * 完成复习
 */
function finishReview(reviewId) {
  storage.updateReviewRecord(reviewId, { isFinished: true })
}

/**
 * 获取所有复习记录
 */
function getAllReviews() {
  return storage.getReviewRecords()
}

module.exports = {
  generateReviewRecord,
  getActiveReview,
  updateReviewProgress,
  finishReview,
  getAllReviews,
}
