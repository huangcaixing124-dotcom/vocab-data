/**
 * 统计分析页
 */
const { getStatsOverview, getDailyStats, getHeatmapData, getStreakDays } = require('../../utils/record')

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
    heatmapWeeks: [],
    maxHeatmapValue: 1,
    // 打卡日历
    calendarYear: 2026,
    calendarMonth: 6,
    calendarDays: [],
    streakDays: 0,
    themeClass: '',
  },

  onShow() {
    this.setData({
      themeClass: getApp().globalData.isDarkMode === false ? 'theme-light' : '',
    })
    this._loadStats()
    this._initCalendar()
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

  // ============ 打卡日历 ============

  _initCalendar() {
    const now = new Date()
    this.setData({
      calendarYear: now.getFullYear(),
      calendarMonth: now.getMonth() + 1,
    })
    this._buildCalendar()
  },

  _buildCalendar() {
    const { calendarYear, calendarMonth, heatmapData } = this.data
    const firstDay = new Date(calendarYear, calendarMonth - 1, 1).getDay()
    const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate()
    const today = new Date()
    const todayStr = this._formatDate(today)

    const days = []
    // 填充月初空白
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, checked: false, isToday: false })
    }
    // 填充日期
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        day: d,
        checked: heatmapData[dateStr] > 0,
        isToday: dateStr === todayStr,
      })
    }

    const streakDays = getStreakDays()
    this.setData({ calendarDays: days, streakDays })
  },

  onPrevMonth() {
    let { calendarYear, calendarMonth } = this.data
    calendarMonth--
    if (calendarMonth < 1) { calendarMonth = 12; calendarYear-- }
    this.setData({ calendarYear, calendarMonth })
    this._buildCalendar()
  },

  onNextMonth() {
    let { calendarYear, calendarMonth } = this.data
    calendarMonth++
    if (calendarMonth > 12) { calendarMonth = 1; calendarYear++ }
    this.setData({ calendarYear, calendarMonth })
    this._buildCalendar()
  },
})
