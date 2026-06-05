/**
 * 打字练习页面 - 核心页面
 * 复刻原版 Typing 页的完整逻辑
 */

const app = getApp()
const { getDictionary, getChapterWords, loadDictionary } = require('../../utils/dictionary')
const { saveWordRecord, saveChapterRecord } = require('../../utils/record')
const { playPronunciation, playKeySound, playWrongSound, playCorrectSound, playTranslation, playPhoneme, playEnglishSentence, destroyAllSounds } = require('../../utils/pronunciation')
const { WRONG_COUNT_TO_SKIP, WRONG_RESET_DELAY } = require('../../utils/constants')

Page({
  data: {
    // 词典信息
    dictInfo: null,
    dictName: '',
    chapter: 0,

    // 单词列表
    words: [],
    // 当前单词索引
    currentIndex: 0,
    // 当前单词
    currentWord: null,
    // 前一个单词
    prevWord: null,
    // 后一个单词
    nextWord: null,

    // 当前输入的字母
    inputWord: '',
    // 当前输入的字母数组（给虚拟键盘用）
    inputLetters: [],
    // 每个字母的状态
    letterStates: [],
    // 是否有错误
    hasWrong: false,
    // 当前单词是否完成
    isWordFinished: false,
    // 是否已完成整个章节
    isChapterFinished: false,

    // 计时器
    isTyping: false,
    time: 0,
    formattedTime: '00:00',
    timerInterval: null,

    // 统计
    correctCount: 0,
    wrongCount: 0,
    wordCount: 0,
    correctWordIndexes: [],
    wordRecordIds: [],

    // 当前单词的错误次数
    currentWrongCount: 0,
    // 当前单词的字母计时
    currentLetterTimeArray: [],
    // 当前单词的字母错误记录
    currentLetterMistakes: {},
    // 是否显示跳过按钮
    isShowSkip: false,

    // 循环模式：每个单词已完成的循环次数
    loopCountMap: {},

    // 配置
    showPhonetic: true,
    phoneticType: 'us',
    showTranslation: true,
    showPrevNext: true,
    isIgnoreCase: true,
    dictationMode: 'none',
    randomLetterVisible: [],
    wordFontSize: 36,
    themeClass: '',

    // 加载状态
    isLoading: true,
    loadingText: '加载词典中...',
  },

  // 计时器引用
  _timerInterval: null,
  // 错误重置定时器
  _wrongResetTimer: null,
  // 当前输入时间戳
  _inputTimestamp: 0,

  onLoad() {
    this._initFromConfig()
  },

  onShow() {
    const g = app.globalData
    const currentDictId = g.currentDictId || 'cet4'
    const currentChapter = g.currentChapter || 0
    // 词典或章节变化时才重新加载
    if (currentDictId !== this.data.dictInfo?.id || currentChapter !== this.data.chapter) {
      this._loadChapter()
    }
  },

  onHide() {
    this._stopTimer()
  },

  onUnload() {
    this._stopTimer()
    destroyAllSounds()
    if (this._wrongResetTimer) clearTimeout(this._wrongResetTimer)
  },

  /**
   * 从全局配置初始化
   */
  _initFromConfig() {
    const g = app.globalData
    this.setData({
      phoneticType: g.phoneticConfig.type || 'us',
      showPhonetic: g.phoneticConfig.isOpen !== false,
      showTranslation: true,
      showPrevNext: g.isShowPrevAndNextWord !== false,
      isIgnoreCase: g.isIgnoreCase !== false,
      dictationMode: g.wordDictationConfig.isOpen ? (g.wordDictationConfig.type || 'hideAll') : 'none',
      wordFontSize: g.fontSizeConfig.word || 36,
      themeClass: g.isDarkMode === false ? 'theme-light' : '',
    })
  },

  /**
   * 加载章节数据
   */
  async _loadChapter() {
    const g = app.globalData
    const dictId = g.currentDictId || 'cet4'
    const chapter = g.currentChapter || 0
    const dictInfo = getDictionary(dictId)

    this.setData({
      isLoading: true,
      loadingText: '加载词典中...',
      dictInfo,
      dictName: dictInfo.name,
      chapter,
      isChapterFinished: false,
      isTyping: false,
      time: 0,
      formattedTime: '00:00',
      correctCount: 0,
      wrongCount: 0,
      wordCount: 0,
      correctWordIndexes: [],
      wordRecordIds: [],
      loopCountMap: {},
    })

    try {
      const allWords = await loadDictionary(dictId)
      const chapterWords = getChapterWords(allWords, chapter)

      if (chapterWords.length === 0) {
        wx.showToast({ title: '该章节没有单词', icon: 'none' })
        this.setData({ isLoading: false })
        return
      }

      // 随机模式
      let words = [...chapterWords]
      if (g.randomConfig && g.randomConfig.isOpen) {
        words = this._shuffleArray(words)
      }

      this.setData({
        words,
        isLoading: false,
      })

      this._setupCurrentWord(0, words)
    } catch (err) {
      console.error('Load dictionary failed:', err)
      const msg = err.message || '词典加载失败'
      this.setData({ isLoading: false, loadingText: '加载失败，请重试' })
      wx.showToast({ title: msg, icon: 'none', duration: 5000 })
    }
  },

  /**
   * 设置当前单词
   */
  _setupCurrentWord(index, words) {
    words = words || this.data.words
    if (index >= words.length) {
      this._finishChapter()
      return
    }

    const currentWord = words[index]
    const prevWord = index > 0 ? words[index - 1] : null
    const nextWord = index < words.length - 1 ? words[index + 1] : null

    // 随机隐藏字母（默写模式）
    let randomLetterVisible = []
    if (this.data.dictationMode === 'randomHide' && currentWord) {
      randomLetterVisible = currentWord.name.split('').map(() => Math.random() > 0.5)
    }

    this.setData({
      currentIndex: index,
      currentWord,
      prevWord,
      nextWord,
      inputWord: '',
      inputLetters: [],
      letterStates: currentWord ? currentWord.name.split('').map(() => 'normal') : [],
      hasWrong: false,
      isWordFinished: false,
      currentWrongCount: 0,
      currentLetterTimeArray: [],
      currentLetterMistakes: {},
      isShowSkip: false,
      randomLetterVisible,
    })

    // 自动播放发音
    const pronConfig = app.globalData.pronunciationConfig
    if (pronConfig && pronConfig.isOpen && currentWord) {
      setTimeout(() => {
        playPronunciation(currentWord.name, pronConfig.type || 'us', null, {
          rate: pronConfig.rate || 1,
          loop: pronConfig.isLoop || false,
        })
      }, 200)
    }
  },

  /**
   * 键盘输入处理
   */
  onKeyInput(e) {
    const { key } = e.detail
    const { currentWord, inputWord, isWordFinished, isTyping, isIgnoreCase, hasWrong } = this.data

    if (!currentWord || isWordFinished || hasWrong) return

    // 开始计时
    if (!isTyping) {
      this.setData({ isTyping: true })
      this._startTimer()
    }

    // 比较输入
    const expectedIndex = inputWord.length
    const expectedChar = currentWord.name[expectedIndex]

    if (!expectedChar) return

    const inputChar = key
    const isCorrect = isIgnoreCase
      ? inputChar.toLowerCase() === expectedChar.toLowerCase()
      : inputChar === expectedChar

    // 记录按键时间
    const now = Date.now()
    const letterTime = this._inputTimestamp ? now - this._inputTimestamp : 0
    this._inputTimestamp = now

    if (isCorrect) {
      this._handleCorrectInput(expectedIndex, letterTime)
    } else {
      this._handleWrongInput(expectedIndex, inputChar, letterTime)
    }
  },

  /**
   * 处理正确输入
   */
  _handleCorrectInput(index, letterTime) {
    const { inputWord, currentWord, letterStates, currentLetterTimeArray } = this.data

    // 播放按键音
    const keySoundsConfig = app.globalData.keySoundsConfig
    if (keySoundsConfig && keySoundsConfig.isOpen) {
      playKeySound()
    }

    const newInput = inputWord + currentWord.name[index]
    const newStates = [...letterStates]
    newStates[index] = 'correct'
    const newTimeArray = [...currentLetterTimeArray, letterTime]

    this.setData({
      inputWord: newInput,
      inputLetters: newInput.split(''),
      letterStates: newStates,
      correctCount: this.data.correctCount + 1,
      currentLetterTimeArray: newTimeArray,
    })

    // 检查单词是否完成
    if (newInput.length === currentWord.name.length) {
      this._onWordFinished()
    }
  },

  /**
   * 处理错误输入
   */
  _handleWrongInput(index, inputChar, letterTime) {
    const { letterStates, currentLetterMistakes, currentWrongCount } = this.data

    // 播放错误音
    const hintSoundsConfig = app.globalData.hintSoundsConfig
    if (hintSoundsConfig && hintSoundsConfig.isOpen && hintSoundsConfig.isOpenWrongSound) {
      playWrongSound()
    }

    // 记录错误
    const newStates = [...letterStates]
    newStates[index] = 'wrong'
    const newMistakes = { ...currentLetterMistakes }
    if (!newMistakes[index]) newMistakes[index] = []
    newMistakes[index].push(inputChar)

    const newWrongCount = currentWrongCount + 1

    this.setData({
      letterStates: newStates,
      hasWrong: true,
      wrongCount: this.data.wrongCount + 1,
      currentLetterMistakes: newMistakes,
      currentWrongCount: newWrongCount,
      isShowSkip: newWrongCount >= WRONG_COUNT_TO_SKIP,
    })

    // 300ms 后重置错误状态
    if (this._wrongResetTimer) clearTimeout(this._wrongResetTimer)
    this._wrongResetTimer = setTimeout(() => {
      this.setData({
        inputWord: '',
        inputLetters: [],
        letterStates: this.data.currentWord.name.split('').map(() => 'normal'),
        hasWrong: false,
      })
    }, WRONG_RESET_DELAY)
  },

  /**
   * 单词完成
   */
  _onWordFinished() {
    const { currentWord, currentLetterTimeArray, currentWrongCount, currentLetterMistakes, currentIndex, dictInfo, chapter } = this.data

    // 播放正确音
    const hintSoundsConfig = app.globalData.hintSoundsConfig
    if (hintSoundsConfig && hintSoundsConfig.isOpen && hintSoundsConfig.isOpenCorrectSound) {
      playCorrectSound()
    }

    this.setData({ isWordFinished: true })

    // 播放发音，播完后再切下一个单词
    const pronConfig = app.globalData.pronunciationConfig
    var that = this
    var goNext = function () {
      that._setupCurrentWord(currentLoopCount < loopTimes ? currentIndex : currentIndex + 1)
    }

    if (pronConfig && pronConfig.isOpen) {
      playPronunciation(currentWord.name, pronConfig.type || 'us', goNext, {
        rate: pronConfig.rate || 1,
        loop: false,
      })
      // 播放中文释义朗读（发音开始后 500ms）
      if (pronConfig.isTransRead && currentWord.trans && currentWord.trans.length > 0) {
        setTimeout(function () {
          playTranslation(currentWord.trans[0])
        }, 500)
      }
    } else {
      // 无发音时用短暂延迟
      setTimeout(goNext, 300)
    }

    // 保存单词记录
    const recordId = saveWordRecord({
      word: currentWord.name,
      dict: dictInfo.id,
      chapter,
      timing: currentLetterTimeArray,
      wrongCount: currentWrongCount,
      mistakes: currentLetterMistakes,
    })

    const newRecordIds = [...this.data.wordRecordIds, recordId]
    const newCorrectIndexes = [...this.data.correctWordIndexes]
    if (currentWrongCount === 0) {
      newCorrectIndexes.push(currentIndex)
    }

    this.setData({
      wordCount: this.data.wordCount + 1,
      wordRecordIds: newRecordIds,
      correctWordIndexes: newCorrectIndexes,
    })

    // 检查循环次数配置
    const loopConfig = app.globalData.loopWordConfig || { times: 1 }
    const loopTimes = loopConfig.times || 1
    const loopCountMap = { ...this.data.loopCountMap }
    const currentLoopCount = (loopCountMap[currentIndex] || 0) + 1
    loopCountMap[currentIndex] = currentLoopCount
    this.setData({ loopCountMap })

    // 注意：goNext 回调会在发音结束后自动调用，此处不需要 setTimeout
  },

  /**
   * 跳过当前单词
   */
  onSkipWord() {
    const { currentIndex } = this.data
    if (this._wrongResetTimer) clearTimeout(this._wrongResetTimer)
    this.setData({ hasWrong: false })
    this._setupCurrentWord(currentIndex + 1)
  },

  /**
   * 完成整个章节
   */
  _finishChapter() {
    this._stopTimer()

    const { dictInfo, chapter, time, correctCount, wrongCount, wordCount, correctWordIndexes, wordNumber, wordRecordIds } = this.data

    // 保存章节记录
    saveChapterRecord({
      dict: dictInfo.id,
      chapter,
      time,
      correctCount,
      wrongCount,
      wordCount,
      correctWordIndexes,
      wordNumber: wordCount,
      wordRecordIds,
    })

    this.setData({
      isChapterFinished: true,
      isTyping: false,
    })
  },

  /**
   * 开始计时
   */
  _startTimer() {
    if (this._timerInterval) return
    this._timerInterval = setInterval(() => {
      const newTime = this.data.time + 1
      const mins = Math.floor(newTime / 60)
      const secs = newTime % 60
      this.setData({
        time: newTime,
        formattedTime: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      })
    }, 1000)
  },

  /**
   * 停止计时
   */
  _stopTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval)
      this._timerInterval = null
    }
  },

  /**
   * 洗牌算法
   */
  _shuffleArray(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  },

  // ============ 结果页事件 ============

  onNextChapter() {
    const nextChapter = this.data.chapter + 1
    app.setAppConfig('currentChapter', nextChapter)
    this.setData({ isChapterFinished: false })
    this._loadChapter()
  },

  onReviewChapter() {
    // 重新加载当前章节
    this.setData({ isChapterFinished: false })
    this._loadChapter()
  },

  onBackToGallery() {
    wx.switchTab({ url: '/pages/gallery/gallery' })
  },

  /**
   * 手动播放发音
   */
  onPlaySound() {
    const { currentWord } = this.data
    if (!currentWord) return
    const pronConfig = app.globalData.pronunciationConfig
    playPronunciation(currentWord.name, pronConfig ? pronConfig.type : 'us', null, {
      rate: pronConfig ? (pronConfig.rate || 1) : 1,
      loop: false,
    })
  },

  /**
   * 点击音素播放该音素的发音
   */
  onPlayPhoneme(e) {
    const { phoneme } = e.detail
    if (phoneme) {
      playPhoneme(phoneme)
    }
  },

  onPlaySentence(e) {
    const { sentence } = e.detail
    if (sentence) {
      playEnglishSentence(sentence)
    }
  },
})
