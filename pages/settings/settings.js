/**
 * 设置页面
 */
const app = getApp()
const { exportAllData, importData, clearAllData } = require('../../utils/storage')

Page({
  data: {
    // 发音
    pronunciationOpen: true,
    pronunciationType: 'us',
    pronunciationRate: 1,
    pronunciationLoop: false,
    transRead: false,

    // 按键音
    keySoundsOpen: true,

    // 提示音
    hintSoundsOpen: true,

    // 音标
    phoneticOpen: true,
    phoneticType: 'us',

    // 默写模式
    dictationOpen: false,
    dictationType: 'hideAll',

    // 随机顺序
    randomOpen: false,

    // 忽略大小写
    ignoreCase: true,

    // 显示前后单词
    showPrevNext: true,

    // 循环次数
    loopTimes: 1,

    // 字体大小
    wordFontSize: 36,

    // 每日目标
    dailyGoalTarget: 20,
    dailyGoalIndex: 1,

    // 主题
    isDarkMode: true,

    // picker 索引
    pronunciationTypeIndex: 0,
    pronunciationRateIndex: 2,
    phoneticTypeIndex: 0,
    dictationTypeIndex: 0,
    loopTimesIndex: 0,
    fontSizeIndex: 1,

    // 选项列表
    pronunciationTypes: [
      { value: 'us', label: '美音' },
      { value: 'uk', label: '英音' },
    ],
    dictationTypes: [
      { value: 'hideAll', label: '隐藏全部' },
      { value: 'hideVowel', label: '隐藏元音' },
      { value: 'hideConsonant', label: '隐藏辅音' },
      { value: 'randomHide', label: '随机隐藏' },
    ],
    loopTimesOptions: [
      { value: 1, label: '1 次' },
      { value: 3, label: '3 次' },
      { value: 5, label: '5 次' },
      { value: 8, label: '8 次' },
      { value: 999999, label: '无限' },
    ],
    fontSizeOptions: [
      { value: 28, label: '小' },
      { value: 36, label: '中' },
      { value: 44, label: '大' },
      { value: 52, label: '特大' },
    ],
    dailyGoalOptions: [
      { value: 10, label: '10 词/天' },
      { value: 20, label: '20 词/天' },
      { value: 30, label: '30 词/天' },
      { value: 50, label: '50 词/天' },
      { value: 100, label: '100 词/天' },
    ],
    rateOptions: [
      { value: 0.5, label: '0.5x' },
      { value: 0.75, label: '0.75x' },
      { value: 1, label: '1x' },
      { value: 1.25, label: '1.25x' },
      { value: 1.5, label: '1.5x' },
    ],
  },

  onLoad() {
    this._loadConfig()
  },

  onShow() {
    this._loadConfig()
  },

  _loadConfig() {
    const g = app.globalData
    const pronType = g.pronunciationConfig.type || 'us'
    const pronRate = g.pronunciationConfig.rate || 1
    const phonType = g.phoneticConfig.type || 'us'
    const dictType = g.wordDictationConfig.type || 'hideAll'
    const loopT = g.loopWordConfig.times || 1
    const fontS = g.fontSizeConfig.word || 36

    this.setData({
      pronunciationOpen: g.pronunciationConfig.isOpen,
      pronunciationType: pronType,
      pronunciationRate: pronRate,
      pronunciationLoop: g.pronunciationConfig.isLoop || false,
      transRead: g.pronunciationConfig.isTransRead || false,
      keySoundsOpen: g.keySoundsConfig.isOpen,
      hintSoundsOpen: g.hintSoundsConfig.isOpen,
      phoneticOpen: g.phoneticConfig.isOpen,
      phoneticType: phonType,
      dictationOpen: g.wordDictationConfig.isOpen,
      dictationType: dictType,
      randomOpen: g.randomConfig.isOpen,
      ignoreCase: g.isIgnoreCase,
      showPrevNext: g.isShowPrevAndNextWord,
      loopTimes: loopT,
      wordFontSize: fontS,
      dailyGoalTarget: g.dailyGoal ? g.dailyGoal.target : 20,
      isDarkMode: g.isDarkMode !== false,
      themeClass: g.isDarkMode === false ? 'theme-light' : '',
      // 计算 picker 索引
      pronunciationTypeIndex: pronType === 'uk' ? 1 : 0,
      pronunciationRateIndex: [0.5, 0.75, 1, 1.25, 1.5].indexOf(pronRate),
      phoneticTypeIndex: phonType === 'uk' ? 1 : 0,
      dictationTypeIndex: ['hideAll', 'hideVowel', 'hideConsonant', 'randomHide'].indexOf(dictType),
      loopTimesIndex: [1, 3, 5, 8, 999999].indexOf(loopT),
      fontSizeIndex: [28, 36, 44, 52].indexOf(fontS),
    })
  },

  // ============ 开关切换 ============

  onPronunciationToggle(e) {
    const val = e.detail.value
    this.setData({ pronunciationOpen: val })
    app.setAppConfig('pronunciationConfig', {
      ...app.globalData.pronunciationConfig,
      isOpen: val,
    })
  },

  onPronunciationTypeChange(e) {
    const idx = parseInt(e.detail.value)
    const type = this.data.pronunciationTypes[idx].value
    this.setData({ pronunciationType: type, pronunciationTypeIndex: idx })
    app.setAppConfig('pronunciationConfig', {
      ...app.globalData.pronunciationConfig,
      type,
    })
  },

  onPronunciationRateChange(e) {
    const idx = parseInt(e.detail.value)
    const rate = this.data.rateOptions[idx].value
    this.setData({ pronunciationRate: rate, pronunciationRateIndex: idx })
    app.setAppConfig('pronunciationConfig', {
      ...app.globalData.pronunciationConfig,
      rate,
    })
  },

  onPronunciationLoopToggle(e) {
    const val = e.detail.value
    this.setData({ pronunciationLoop: val })
    app.setAppConfig('pronunciationConfig', {
      ...app.globalData.pronunciationConfig,
      isLoop: val,
    })
  },

  onTransReadToggle(e) {
    const val = e.detail.value
    this.setData({ transRead: val })
    app.setAppConfig('pronunciationConfig', {
      ...app.globalData.pronunciationConfig,
      isTransRead: val,
    })
  },

  onKeySoundsToggle(e) {
    const val = e.detail.value
    this.setData({ keySoundsOpen: val })
    app.setAppConfig('keySoundsConfig', {
      ...app.globalData.keySoundsConfig,
      isOpen: val,
    })
  },

  onHintSoundsToggle(e) {
    const val = e.detail.value
    this.setData({ hintSoundsOpen: val })
    app.setAppConfig('hintSoundsConfig', {
      ...app.globalData.hintSoundsConfig,
      isOpen: val,
    })
  },

  onPhoneticToggle(e) {
    const val = e.detail.value
    this.setData({ phoneticOpen: val })
    app.setAppConfig('phoneticConfig', {
      ...app.globalData.phoneticConfig,
      isOpen: val,
    })
  },

  onPhoneticTypeChange(e) {
    const idx = parseInt(e.detail.value)
    const type = this.data.pronunciationTypes[idx].value
    this.setData({ phoneticType: type, phoneticTypeIndex: idx })
    app.setAppConfig('phoneticConfig', {
      ...app.globalData.phoneticConfig,
      type,
    })
  },

  onDictationToggle(e) {
    const val = e.detail.value
    this.setData({ dictationOpen: val })
    app.setAppConfig('wordDictationConfig', {
      isOpen: val,
      type: this.data.dictationType,
    })
  },

  onDictationTypeChange(e) {
    const idx = parseInt(e.detail.value)
    const type = this.data.dictationTypes[idx].value
    this.setData({ dictationType: type, dictationTypeIndex: idx })
    app.setAppConfig('wordDictationConfig', {
      ...app.globalData.wordDictationConfig,
      type,
    })
  },

  onRandomToggle(e) {
    const val = e.detail.value
    this.setData({ randomOpen: val })
    app.setAppConfig('randomConfig', { isOpen: val })
  },

  onIgnoreCaseToggle(e) {
    const val = e.detail.value
    this.setData({ ignoreCase: val })
    app.setAppConfig('isIgnoreCase', val)
  },

  onShowPrevNextToggle(e) {
    const val = e.detail.value
    this.setData({ showPrevNext: val })
    app.setAppConfig('isShowPrevAndNextWord', val)
  },

  onLoopTimesChange(e) {
    const idx = parseInt(e.detail.value)
    const times = this.data.loopTimesOptions[idx].value
    this.setData({ loopTimes: times, loopTimesIndex: idx })
    app.setAppConfig('loopWordConfig', { times })
  },

  onFontSizeChange(e) {
    const idx = parseInt(e.detail.value)
    const size = this.data.fontSizeOptions[idx].value
    this.setData({ wordFontSize: size, fontSizeIndex: idx })
    app.setAppConfig('fontSizeConfig', {
      ...app.globalData.fontSizeConfig,
      word: size,
    })
  },

  onDailyGoalBlur(e) {
    var val = parseInt(e.detail.value) || 20
    if (val < 1) val = 1
    if (val > 500) val = 500
    this.setData({ dailyGoalTarget: val })
    app.setAppConfig('dailyGoal', {
      isOpen: true,
      target: val,
    })
  },

  onDarkModeToggle(e) {
    const val = e.detail.value
    this.setData({
      isDarkMode: val,
      themeClass: val ? '' : 'theme-light',
    })
    app.setAppConfig('isDarkMode', val)
    app.globalData.isDarkMode = val
    wx.showToast({
      title: val ? '已切换深色模式' : '已切换浅色模式',
      icon: 'none',
    })
  },

  _applyTheme(isDark) {
    // 通过全局事件通知其他页面切换主题
    app.globalData.isDarkMode = isDark
    wx.showToast({
      title: isDark ? '已切换深色模式' : '已切换浅色模式',
      icon: 'none',
    })
  },

  // ============ 数据管理 ============

  onExportData() {
    const data = exportAllData()
    wx.setClipboardData({
      data: JSON.stringify(data),
      success() {
        wx.showToast({ title: '数据已复制到剪贴板', icon: 'none' })
      },
    })
  },

  onImportData() {
    wx.showModal({
      title: '导入数据',
      content: '请将导出的 JSON 数据粘贴到剪贴板，然后点击确定导入',
      success: (res) => {
        if (res.confirm) {
          wx.getClipboardData({
            success(clipRes) {
              try {
                const data = JSON.parse(clipRes.data)
                if (data.wordRecords || data.chapterRecords) {
                  importData(data)
                  wx.showToast({ title: '导入成功', icon: 'success' })
                } else {
                  wx.showToast({ title: '数据格式不正确', icon: 'none' })
                }
              } catch (e) {
                wx.showToast({ title: '数据解析失败', icon: 'none' })
              }
            },
          })
        }
      },
    })
  },

  onClearData() {
    wx.showModal({
      title: '清空数据',
      content: '确定要清空所有练习记录吗？此操作不可撤销！',
      confirmColor: '#fc8181',
      success(res) {
        if (res.confirm) {
          clearAllData()
          wx.showToast({ title: '数据已清空', icon: 'success' })
        }
      },
    })
  },

  // 跳转统计页
  onGoAnalysis() {
    wx.navigateTo({ url: '/pages/analysis/analysis' })
  },
})
