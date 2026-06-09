/**
 * 背单词小程序
 * 全局应用入口 - 状态管理（替代 Jotai）
 */

const { STORAGE_KEYS, DEFAULT_CONFIG } = require('./utils/constants')
const { getConfig, setConfig } = require('./utils/storage')

App({
  globalData: {
    // 当前词典 ID
    currentDictId: 'cet4',
    // 当前章节
    currentChapter: 0,
    // 发音配置
    pronunciationConfig: { ...DEFAULT_CONFIG.pronunciation },
    // 按键音配置
    keySoundsConfig: { ...DEFAULT_CONFIG.keySounds },
    // 提示音配置
    hintSoundsConfig: { ...DEFAULT_CONFIG.hintSounds },
    // 音标配置
    phoneticConfig: { ...DEFAULT_CONFIG.phonetic },
    // 随机顺序配置
    randomConfig: { ...DEFAULT_CONFIG.random },
    // 默写配置
    wordDictationConfig: { ...DEFAULT_CONFIG.wordDictation },
    // 字体大小配置
    fontSizeConfig: { ...DEFAULT_CONFIG.fontSize },
    // 循环次数配置
    loopWordConfig: { ...DEFAULT_CONFIG.loopWord },
    // 是否忽略大小写
    isIgnoreCase: DEFAULT_CONFIG.isIgnoreCase,
    // 是否显示前后单词
    isShowPrevAndNextWord: DEFAULT_CONFIG.isShowPrevAndNextWord,
    // 是否深色模式
    isDarkMode: false,
    // 每日目标
    dailyGoal: { ...DEFAULT_CONFIG.dailyGoal },
  },

  onLaunch() {
    // 从本地存储恢复配置
    this._loadConfig()
  },

  _preloadExamDicts() {
    var examIds = ['cet4', 'cet6', 'kaoyan', 'nce1']
    var that = this
    examIds.forEach(function (id) {
      try {
        var data = require('./utils/dict-' + id + '.js')
        if (data && Array.isArray(data)) {
          that.globalData['dict_' + id] = data.map(function (w) {
            return { name: w[0], trans: w[1] ? [w[1]] : [], usphone: w[2] || '', ukphone: '' }
          })
        }
      } catch (e) {
        // require failed at app level too
      }
    })
  },

  /**
   * 从本地存储加载所有配置
   */
  _loadConfig() {
    const g = this.globalData
    g.currentDictId = getConfig(STORAGE_KEYS.CURRENT_DICT, 'cet4')
    g.currentChapter = getConfig(STORAGE_KEYS.CURRENT_CHAPTER, 0)
    g.pronunciationConfig = getConfig(STORAGE_KEYS.PRONUNCIATION_CONFIG, { ...DEFAULT_CONFIG.pronunciation })
    g.keySoundsConfig = getConfig(STORAGE_KEYS.KEY_SOUNDS_CONFIG, { ...DEFAULT_CONFIG.keySounds })
    g.hintSoundsConfig = getConfig(STORAGE_KEYS.HINT_SOUNDS_CONFIG, { ...DEFAULT_CONFIG.hintSounds })
    g.phoneticConfig = getConfig(STORAGE_KEYS.PHONETIC_CONFIG, { ...DEFAULT_CONFIG.phonetic })
    g.randomConfig = getConfig(STORAGE_KEYS.RANDOM_CONFIG, { ...DEFAULT_CONFIG.random })
    g.wordDictationConfig = getConfig(STORAGE_KEYS.WORD_DICTATION_CONFIG, { ...DEFAULT_CONFIG.wordDictation })
    g.fontSizeConfig = getConfig(STORAGE_KEYS.FONT_SIZE_CONFIG, { ...DEFAULT_CONFIG.fontSize })
    g.loopWordConfig = getConfig(STORAGE_KEYS.LOOP_WORD_CONFIG, { ...DEFAULT_CONFIG.loopWord })
    g.dailyGoal = getConfig(STORAGE_KEYS.DAILY_GOAL, { ...DEFAULT_CONFIG.dailyGoal })
    g.isIgnoreCase = getConfig(STORAGE_KEYS.IS_IGNORE_CASE, true)
    g.isShowPrevAndNextWord = getConfig(STORAGE_KEYS.IS_SHOW_PREV_NEXT, true)

    // 深色模式跟随系统
    try {
      const res = wx.getSystemInfoSync()
      g.isDarkMode = res.theme === 'dark'
    } catch (e) {
      g.isDarkMode = false
    }
  },

  /**
   * 设置配置并持久化
   */
  setAppConfig(key, value) {
    this.globalData[key] = value

    // 持久化到本地存储
    const keyMap = {
      currentDictId: STORAGE_KEYS.CURRENT_DICT,
      currentChapter: STORAGE_KEYS.CURRENT_CHAPTER,
      pronunciationConfig: STORAGE_KEYS.PRONUNCIATION_CONFIG,
      keySoundsConfig: STORAGE_KEYS.KEY_SOUNDS_CONFIG,
      hintSoundsConfig: STORAGE_KEYS.HINT_SOUNDS_CONFIG,
      phoneticConfig: STORAGE_KEYS.PHONETIC_CONFIG,
      randomConfig: STORAGE_KEYS.RANDOM_CONFIG,
      wordDictationConfig: STORAGE_KEYS.WORD_DICTATION_CONFIG,
      fontSizeConfig: STORAGE_KEYS.FONT_SIZE_CONFIG,
      loopWordConfig: STORAGE_KEYS.LOOP_WORD_CONFIG,
      dailyGoal: STORAGE_KEYS.DAILY_GOAL,
      isIgnoreCase: STORAGE_KEYS.IS_IGNORE_CASE,
      isShowPrevAndNextWord: STORAGE_KEYS.IS_SHOW_PREV_NEXT,
      isDarkMode: STORAGE_KEYS.DARK_MODE,
    }

    if (keyMap[key]) {
      setConfig(keyMap[key], value)
    }
  },

  /**
   * 获取配置
   */
  getAppConfig(key) {
    return this.globalData[key]
  },
})
