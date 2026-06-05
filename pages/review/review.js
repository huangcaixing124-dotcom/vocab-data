/**
 * 复习练习页
 * 复用打字练习的核心逻辑，词表来源改为 reviewRecord
 */
const app = getApp()
const { getReviewRecords } = require('../../utils/storage')
const { saveWordRecord } = require('../../utils/record')
const { updateReviewProgress, finishReview } = require('../../utils/review')
const { playPronunciation, playKeySound, playWrongSound, playCorrectSound, playPhoneme, playEnglishSentence, destroyAllSounds } = require('../../utils/pronunciation')
const { WRONG_COUNT_TO_SKIP, WRONG_RESET_DELAY } = require('../../utils/constants')

Page({
  data: {
    reviewId: 0,
    dictId: '',
    words: [],
    currentIndex: 0,
    currentWord: null,
    prevWord: null,
    nextWord: null,
    inputWord: '',
    inputLetters: [],
    letterStates: [],
    hasWrong: false,
    isWordFinished: false,
    isFinished: false,
    isTyping: false,
    time: 0,
    formattedTime: '00:00',
    correctCount: 0,
    wrongCount: 0,
    wordCount: 0,
    correctWordIndexes: [],
    currentWrongCount: 0,
    currentLetterTimeArray: [],
    currentLetterMistakes: {},
    isShowSkip: false,
    isLoading: true,
    // 配置
    phoneticType: 'us',
    showPhonetic: true,
    showTranslation: true,
    isIgnoreCase: true,
    wordFontSize: 36,
    themeClass: '',
  },

  _timerInterval: null,
  _wrongResetTimer: null,
  _inputTimestamp: 0,

  onLoad(options) {
    const reviewId = parseInt(options.reviewId)
    const dictId = options.dictId || ''
    const g = app.globalData

    this.setData({
      reviewId,
      dictId,
      phoneticType: g.phoneticConfig.type || 'us',
      showPhonetic: g.phoneticConfig.isOpen !== false,
      isIgnoreCase: g.isIgnoreCase !== false,
      wordFontSize: g.fontSizeConfig.word || 36,
      themeClass: g.isDarkMode === false ? 'theme-light' : '',
    })

    this._loadReviewWords(reviewId)
  },

  onUnload() {
    this._stopTimer()
    destroyAllSounds()
    if (this._wrongResetTimer) clearTimeout(this._wrongResetTimer)
  },

  _loadReviewWords(reviewId) {
    const records = getReviewRecords()
    const review = records.find((r) => r.id === reviewId)

    if (!review || !review.words || review.words.length === 0) {
      wx.showToast({ title: '复习数据不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    const startIndex = review.index || 0
    const words = review.words

    this.setData({ words, isLoading: false })

    if (startIndex >= words.length) {
      this._finishReviewPage()
      return
    }

    this._setupCurrentWord(startIndex)
  },

  _setupCurrentWord(index) {
    const { words } = this.data
    if (index >= words.length) {
      this._finishReviewPage()
      return
    }

    const currentWord = words[index]
    const prevWord = index > 0 ? words[index - 1] : null
    const nextWord = index < words.length - 1 ? words[index + 1] : null

    this.setData({
      currentIndex: index,
      currentWord,
      prevWord,
      nextWord,
      inputWord: '',
      inputLetters: [],
      letterStates: currentWord.name.split('').map(() => 'normal'),
      hasWrong: false,
      isWordFinished: false,
      currentWrongCount: 0,
      currentLetterTimeArray: [],
      currentLetterMistakes: {},
      isShowSkip: false,
    })

    // 更新复习进度
    updateReviewProgress(this.data.reviewId, index)

    // 自动发音
    const pronConfig = app.globalData.pronunciationConfig
    if (pronConfig && pronConfig.isOpen && currentWord) {
      setTimeout(() => {
        playPronunciation(currentWord.name, pronConfig.type || 'us')
      }, 200)
    }
  },

  onKeyInput(e) {
    const { key } = e.detail
    const { currentWord, inputWord, isWordFinished, isTyping, isIgnoreCase, hasWrong } = this.data

    if (!currentWord || isWordFinished || hasWrong) return

    if (!isTyping) {
      this.setData({ isTyping: true })
      this._startTimer()
    }

    const expectedIndex = inputWord.length
    const expectedChar = currentWord.name[expectedIndex]
    if (!expectedChar) return

    const isCorrect = isIgnoreCase
      ? key.toLowerCase() === expectedChar.toLowerCase()
      : key === expectedChar

    const now = Date.now()
    const letterTime = this._inputTimestamp ? now - this._inputTimestamp : 0
    this._inputTimestamp = now

    if (isCorrect) {
      const newInput = inputWord + currentWord.name[expectedIndex]
      const newStates = [...this.data.letterStates]
      newStates[expectedIndex] = 'correct'
      const newTimeArray = [...this.data.currentLetterTimeArray, letterTime]

      if (app.globalData.keySoundsConfig.isOpen) playKeySound()

      this.setData({
        inputWord: newInput,
        inputLetters: newInput.split(''),
        letterStates: newStates,
        correctCount: this.data.correctCount + 1,
        currentLetterTimeArray: newTimeArray,
      })

      if (newInput.length === currentWord.name.length) {
        this._onWordFinished()
      }
    } else {
      if (app.globalData.hintSoundsConfig.isOpen && app.globalData.hintSoundsConfig.isOpenWrongSound) {
        playWrongSound()
      }

      const newStates = [...this.data.letterStates]
      newStates[expectedIndex] = 'wrong'
      const newMistakes = { ...this.data.currentLetterMistakes }
      if (!newMistakes[expectedIndex]) newMistakes[expectedIndex] = []
      newMistakes[expectedIndex].push(key)
      const newWrongCount = this.data.currentWrongCount + 1

      this.setData({
        letterStates: newStates,
        hasWrong: true,
        wrongCount: this.data.wrongCount + 1,
        currentLetterMistakes: newMistakes,
        currentWrongCount: newWrongCount,
        isShowSkip: newWrongCount >= WRONG_COUNT_TO_SKIP,
      })

      if (this._wrongResetTimer) clearTimeout(this._wrongResetTimer)
      this._wrongResetTimer = setTimeout(() => {
        this.setData({
          inputWord: '',
          inputLetters: [],
          letterStates: this.data.currentWord.name.split('').map(() => 'normal'),
          hasWrong: false,
        })
      }, WRONG_RESET_DELAY)
    }
  },

  _onWordFinished() {
    const { currentWord, currentLetterTimeArray, currentWrongCount, currentLetterMistakes, currentIndex, dictId } = this.data

    if (app.globalData.hintSoundsConfig.isOpen && app.globalData.hintSoundsConfig.isOpenCorrectSound) {
      playCorrectSound()
    }

    this.setData({ isWordFinished: true })

    playPronunciation(currentWord.name, app.globalData.pronunciationConfig.type || 'us')

    saveWordRecord({
      word: currentWord.name,
      dict: dictId,
      chapter: null,
      timing: currentLetterTimeArray,
      wrongCount: currentWrongCount,
      mistakes: currentLetterMistakes,
    })

    const newCorrectIndexes = [...this.data.correctWordIndexes]
    if (currentWrongCount === 0) {
      newCorrectIndexes.push(currentIndex)
    }

    this.setData({
      wordCount: this.data.wordCount + 1,
      correctWordIndexes: newCorrectIndexes,
    })

    setTimeout(() => {
      this._setupCurrentWord(currentIndex + 1)
    }, 300)
  },

  onSkipWord() {
    const { currentIndex } = this.data
    if (this._wrongResetTimer) clearTimeout(this._wrongResetTimer)
    this.setData({ hasWrong: false })
    this._setupCurrentWord(currentIndex + 1)
  },

  _finishReviewPage() {
    this._stopTimer()
    finishReview(this.data.reviewId)
    this.setData({ isFinished: true, isTyping: false })
  },

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

  _stopTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval)
      this._timerInterval = null
    }
  },

  onPlaySound() {
    const { currentWord } = this.data
    if (!currentWord) return
    playPronunciation(currentWord.name, app.globalData.pronunciationConfig.type || 'us')
  },

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

  onBackToGallery() {
    wx.navigateBack()
  },

  onRestartReview() {
    this.setData({ isFinished: false, currentIndex: 0, time: 0, formattedTime: '00:00', correctCount: 0, wrongCount: 0, wordCount: 0, correctWordIndexes: [] })
    this._setupCurrentWord(0)
  },
})
