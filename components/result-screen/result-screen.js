/**
 * 章节完成结果页组件
 */

Component({
  properties: {
    // 是否显示
    visible: { type: Boolean, value: false },
    // 用时（秒）
    time: { type: Number, value: 0 },
    // 正确按键数
    correctCount: { type: Number, value: 0 },
    // 错误按键数
    wrongCount: { type: Number, value: 0 },
    // 单词总数
    wordCount: { type: Number, value: 0 },
    // 全部正确的单词索引列表
    correctWordIndexes: { type: Array, value: [] },
    // 总单词数
    wordNumber: { type: Number, value: 20 },
    // 是否有下一章
    hasNextChapter: { type: Boolean, value: true },
    // 词典名称
    dictName: { type: String, value: '' },
    // 章节号
    chapter: { type: Number, value: 0 },
  },

  data: {
    accuracy: 0,
    wpm: 0,
    formattedTime: '00:00',
  },

  observers: {
    'correctCount, wrongCount, time, wordCount': function () {
      this._calcStats()
    },
  },

  methods: {
    _calcStats() {
      const { correctCount, wrongCount, time, wordCount } = this.data
      const total = correctCount + wrongCount
      const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0
      const minutes = time / 60
      const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0
      const mins = Math.floor(time / 60)
      const secs = time % 60
      const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

      this.setData({ accuracy, wpm, formattedTime })
    },

    onNextChapter() {
      this.triggerEvent('nextChapter')
    },

    onReviewChapter() {
      this.triggerEvent('reviewChapter')
    },

    onBackToGallery() {
      this.triggerEvent('backToGallery')
    },
  },
})
