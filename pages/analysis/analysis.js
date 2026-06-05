/**
 * 统计分析页
 */
const { getStatsOverview, getDailyStats, getHeatmapData } = require('../../utils/record')

Page({
  data: {
    overview: {
      totalWords: 0,
      totalChapters: 0,
      totalTime: 0,
      totalCorrect: 0,
      totalWrong: 0,
      accuracy: 0,
    },
    formattedTotalTime: '0分钟',
    dailyStats: [],
    heatmapData: {},
    // 热力图网格
    heatmapWeeks: [],
    maxHeatmapValue: 1,
  },

  onShow() {
    this._loadStats()
  },

  _loadStats() {
    const overview = getStatsOverview()
    const dailyStats = getDailyStats(30)
    const heatmapData = getHeatmapData()

    // 格式化总时间
    const totalMinutes = Math.floor(overview.totalTime / 60)
    const totalHours = Math.floor(totalMinutes / 60)
    const formattedTotalTime = totalHours > 0
      ? `${totalHours}小时${totalMinutes % 60}分钟`
      : `${totalMinutes}分钟`

    // 构建热力图网格
    const heatmapWeeks = this._buildHeatmapGrid(heatmapData)
    const maxHeatmapValue = Math.max(1, ...Object.values(heatmapData))

    this.setData({
      overview,
      formattedTotalTime,
      dailyStats,
      heatmapData,
      heatmapWeeks,
      maxHeatmapValue,
    })
  },

  /**
   * 构建热力图网格（最近 12 周）
   */
  _buildHeatmapGrid(heatmapData) {
    const weeks = []
    const today = new Date()

    // 找到本周的周日
    const dayOfWeek = today.getDay()
    const endOfWeek = new Date(today)
    endOfWeek.setDate(today.getDate() + (6 - dayOfWeek))

    for (let w = 11; w >= 0; w--) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(endOfWeek)
        date.setDate(endOfWeek.getDate() - (w * 7 + (6 - d)))
        const key = this._formatDate(date)
        const value = heatmapData[key] || 0
        week.push({
          date: key,
          value,
          level: this._getHeatLevel(value, Math.max(1, ...Object.values(heatmapData))),
        })
      }
      weeks.push(week)
    }

    return weeks
  },

  _getHeatLevel(value, max) {
    if (value === 0) return 0
    const ratio = value / max
    if (ratio <= 0.25) return 1
    if (ratio <= 0.5) return 2
    if (ratio <= 0.75) return 3
    return 4
  },

  _formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },
})
