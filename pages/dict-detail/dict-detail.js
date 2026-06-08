/**
 * 词典详情页
 * 显示章节列表、错词列表、复习入口
 */
const app = getApp()
const { getDictionary } = require('../../utils/dictionary')
const { getFinishedChapters, getErrorWordRecordsByDict } = require('../../utils/storage')
const { getErrorWordData, getWordMastery } = require('../../utils/record')
const { generateReviewRecord, getActiveReview } = require('../../utils/review')
const { loadDictionary } = require('../../utils/dictionary')
const { getReviewDueCount } = require('../../utils/srs')

Page({
  data: {
    dictId: '',
    dictInfo: null,
    // Tab: 'chapters' | 'errors' | 'review'
    activeTab: 'chapters',
    // 章节列表
    chapters: [],
    // 错词列表
    errorWords: [],
    errorWordsCount: 0,
    // 当前活跃的复习记录
    activeReview: null,
    // 是否正在生成复习
    isGeneratingReview: false,
  },

  onLoad(options) {
    const dictId = options.id || 'cet4'
    const dictInfo = getDictionary(dictId)

    wx.setNavigationBarTitle({ title: dictInfo.name })

    this.setData({ dictId, dictInfo })
    this._loadChapters()
    this._loadErrorWords()
    this._checkActiveReview()
  },

  /**
   * 加载章节列表（含掌握度）
   */
  _loadChapters() {
    const { dictInfo, dictId } = this.data
    const finished = getFinishedChapters(dictId)

    // 加载词典单词以计算掌握度
    loadDictionary(dictId).then((words) => {
      const mastery = getWordMastery(dictId, words)
      const reviewDue = getReviewDueCount(words)
      const chapters = []
      const wordsPerChapter = 20

      for (let i = 0; i < dictInfo.chapterCount; i++) {
        const start = i * wordsPerChapter
        const end = Math.min(start + wordsPerChapter, words.length)
        let masteredInChapter = 0
        for (let j = start; j < end; j++) {
          if (mastery.words[words[j].name] === 'mastered') masteredInChapter++
        }
        chapters.push({
          index: i,
          label: i + 1,
          isFinished: finished.has(i),
          masteredCount: masteredInChapter,
          totalCount: end - start,
          masteryPercent: Math.round(masteredInChapter / (end - start) * 100),
        })
      }

      this.setData({
        chapters,
        totalMastered: mastery.mastered,
        totalLearning: mastery.learning,
        totalUntouched: mastery.untouched,
        totalWords: mastery.total,
        reviewDueCount: reviewDue,
      })
    }).catch(() => {
      // 回退：不显示掌握度
      const chapters = []
      for (let i = 0; i < dictInfo.chapterCount; i++) {
        chapters.push({ index: i, label: i + 1, isFinished: finished.has(i) })
      }
      this.setData({ chapters })
    })
  },

  /**
   * 加载错词列表
   */
  _loadErrorWords() {
    const errorData = getErrorWordData(this.data.dictId)
    this.setData({
      errorWords: errorData.slice(0, 50),
      errorWordsCount: errorData.length,
    })
  },

  /**
   * 检查活跃的复习记录
   */
  _checkActiveReview() {
    const review = getActiveReview(this.data.dictId)
    this.setData({ activeReview: review })
  },

  /**
   * 切换 Tab
   */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  /**
   * 点击章节
   */
  onChapterTap(e) {
    const chapter = e.currentTarget.dataset.chapter
    app.setAppConfig('currentDictId', this.data.dictId)
    app.setAppConfig('currentChapter', chapter)

    wx.switchTab({ url: '/pages/typing/typing' })
  },

  /**
   * 开始复习
   */
  async onStartReview() {
    this.setData({ isGeneratingReview: true })

    try {
      const review = await generateReviewRecord(this.data.dictId)
      if (review) {
        this.setData({ activeReview: review })
        // 跳转到复习页
        wx.navigateTo({
          url: `/pages/review/review?reviewId=${review.id}&dictId=${this.data.dictId}`,
        })
      } else {
        wx.showToast({ title: '没有错词需要复习', icon: 'none' })
      }
    } catch (err) {
      console.error('Generate review failed:', err)
      wx.showToast({ title: '生成复习失败', icon: 'none' })
    }

    this.setData({ isGeneratingReview: false })
  },

  /**
   * 继续复习
   */
  onResumeReview() {
    const { activeReview } = this.data
    if (activeReview) {
      wx.navigateTo({
        url: `/pages/review/review?reviewId=${activeReview.id}&dictId=${this.data.dictId}`,
      })
    }
  },

  /**
   * 开始练习
   */
  onStartPractice() {
    app.setAppConfig('currentDictId', this.data.dictId)
    app.setAppConfig('currentChapter', 0)
    wx.switchTab({ url: '/pages/typing/typing' })
  },
})
