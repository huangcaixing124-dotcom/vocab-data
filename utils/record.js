/**
 * 练习记录管理
 * 对标原版 src/utils/db/record.ts
 */

const storage = require('./storage')

/**
 * 保存单词练习记录
 */
function saveWordRecord({ word, dict, chapter, timing, wrongCount, mistakes }) {
  return storage.addWordRecord({
    word,
    dict,
    chapter,
    timing: timing || [],
    wrongCount: wrongCount || 0,
    mistakes: mistakes || {},
  })
}

/**
 * 保存章节完成记录
 */
function saveChapterRecord({
  dict,
  chapter,
  time,
  correctCount,
  wrongCount,
  wordCount,
  correctWordIndexes,
  wordNumber,
  wordRecordIds,
}) {
  return storage.addChapterRecord({
    dict,
    chapter,
    time,
    correctCount: correctCount || 0,
    wrongCount: wrongCount || 0,
    wordCount: wordCount || 0,
    correctWordIndexes: correctWordIndexes || [],
    wordNumber: wordNumber || 0,
    wordRecordIds: wordRecordIds || [],
  })
}

/**
 * 合并字母错误记录
 */
function mergeLetterMistake(m1, m2) {
  const merged = { ...m1 }
  for (const key in m2) {
    if (merged[key]) {
      merged[key] = merged[key].concat(m2[key])
    } else {
      merged[key] = [...m2[key]]
    }
  }
  return merged
}

/**
 * 获取错词数据（带分析）
 */
function getErrorWordData(dict) {
  const records = dict
    ? storage.getErrorWordRecordsByDict(dict)
    : storage.getErrorWordRecords()

  // 按 word + dict 分组
  const groupMap = {}
  records.forEach((record) => {
    const key = `${record.word}::${record.dict}`
    if (!groupMap[key]) {
      groupMap[key] = {
        word: record.word,
        dict: record.dict,
        records: [],
        errorCount: 0,
        errorLetters: {},
        latestErrorTime: 0,
      }
    }
    const group = groupMap[key]
    group.records.push(record)
    group.errorCount += record.wrongCount

    if (record.timeStamp > group.latestErrorTime) {
      group.latestErrorTime = record.timeStamp
    }

    // 合并字母错误统计
    if (record.mistakes) {
      for (const letterIdx in record.mistakes) {
        if (!group.errorLetters[letterIdx]) {
          group.errorLetters[letterIdx] = 0
        }
        group.errorLetters[letterIdx] += record.mistakes[letterIdx].length
      }
    }
  })

  return Object.values(groupMap).sort((a, b) => b.errorCount - a.errorCount)
}

/**
 * 获取统计概览数据
 */
function getStatsOverview() {
  const chapterRecords = storage.getChapterRecords()
  const wordRecords = storage.getWordRecords()

  const totalWords = wordRecords.length
  const totalChapters = chapterRecords.length
  let totalTime = 0
  let totalCorrect = 0
  let totalWrong = 0

  chapterRecords.forEach((r) => {
    totalTime += r.time || 0
    totalCorrect += r.correctCount || 0
    totalWrong += r.wrongCount || 0
  })

  const accuracy = totalCorrect + totalWrong > 0
    ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
    : 0

  return {
    totalWords,
    totalChapters,
    totalTime,
    totalCorrect,
    totalWrong,
    accuracy,
  }
}

/**
 * 获取每日练习数据（最近 N 天）
 */
function getDailyStats(days = 30) {
  const chapterRecords = storage.getChapterRecords()
  const now = new Date()
  const dailyMap = {}

  // 初始化最近 N 天
  for (let i = 0; i < days; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const key = formatDate(date)
    dailyMap[key] = { date: key, wordCount: 0, chapterCount: 0, totalTime: 0, correct: 0, wrong: 0 }
  }

  chapterRecords.forEach((record) => {
    const key = formatDate(new Date(record.timeStamp))
    if (dailyMap[key]) {
      dailyMap[key].wordCount += record.wordCount || 0
      dailyMap[key].chapterCount += 1
      dailyMap[key].totalTime += record.time || 0
      dailyMap[key].correct += record.correctCount || 0
      dailyMap[key].wrong += record.wrongCount || 0
    }
  })

  return Object.values(dailyMap).reverse()
}

/**
 * 获取热力图数据（一年内）
 */
function getHeatmapData() {
  const chapterRecords = storage.getChapterRecords()
  const heatmap = {}

  chapterRecords.forEach((record) => {
    const key = formatDate(new Date(record.timeStamp))
    if (!heatmap[key]) {
      heatmap[key] = 0
    }
    heatmap[key] += record.wordCount || 0
  })

  return heatmap
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

module.exports = {
  saveWordRecord,
  saveChapterRecord,
  mergeLetterMistake,
  getErrorWordData,
  getStatsOverview,
  getDailyStats,
  getHeatmapData,
  formatDate,
}
