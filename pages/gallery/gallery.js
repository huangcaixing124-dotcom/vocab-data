/**
 * 词典选择页 - 统一搜索（词典 + 单词）
 */
const app = getApp()
const { getCategories, getDictionariesByCategory, getAllDictionaries, loadDictionary } = require('../../utils/dictionary')
const { CHAPTER_LENGTH } = require('../../utils/constants')

var SEARCHABLE_DICTS = [
  { id: 'cet4', name: 'CET-4' },
  { id: 'cet6', name: 'CET-6' },
  { id: 'kaoyan', name: '考研' },
  { id: 'nce1', name: '新概念1' },
]

Page({
  data: {
    categories: [],
    currentCategory: '',
    dictionaries: [],
    allDictionaries: [],
    currentDictId: '',
    searchKeyword: '',
    themeClass: '',
    isSearching: false,
    searchDictResults: [],
    searchWordResults: [],
    dailyGoalTarget: 20,
    refreshKey: 0,
    publisherTags: [],
    currentPublisher: '',
  },

  _allWords: null,
  _wordsReady: false,

  onLoad() {
    this.setData({
      categories: getCategories(),
      currentCategory: getCategories()[0] || '',
      currentDictId: app.globalData.currentDictId || 'cet4',
      allDictionaries: getAllDictionaries(),
      themeClass: app.globalData.isDarkMode === false ? 'theme-light' : '',
    })
    this._filterDictionaries(this.data.currentCategory)
    this._loadAllWords()
  },

  onShow() {
    var goal = app.globalData.dailyGoal ? app.globalData.dailyGoal.target : 20
    this.setData({
      currentDictId: app.globalData.currentDictId,
      themeClass: app.globalData.isDarkMode === false ? 'theme-light' : '',
      dailyGoalTarget: goal,
    })
    // 强制刷新词典列表（使卡片重新计算预估天数）
    this._filterDictionaries(this.data.currentCategory)
  },

  onCategoryTap(e) {
    this.setData({ currentCategory: e.currentTarget.dataset.category, isSearching: false, searchKeyword: '', currentPublisher: '' })
    this._filterDictionaries(this.data.currentCategory)
  },

  onPublisherTap(e) {
    this.setData({ currentPublisher: e.currentTarget.dataset.publisher })
    this._filterDictionaries(this.data.currentCategory)
  },

  _filterDictionaries(category) {
    var dicts = getDictionariesByCategory(category)
    // 如果是课本单词分类，提取版本标签并筛选
    if (category === '课本单词') {
      var tags = {}
      dicts.forEach(function (d) {
        if (d.tags) {
          d.tags.forEach(function (t) {
            if (t !== '小学' && t !== '初中' && t !== '高中') {
              tags[t] = true
            }
          })
        }
      })
      var currentPublisher = this.data.currentPublisher
      if (currentPublisher) {
        dicts = dicts.filter(function (d) {
          return d.tags && d.tags.indexOf(currentPublisher) >= 0
        })
      }
      this.setData({ publisherTags: Object.keys(tags), dictionaries: dicts })
    } else {
      this.setData({ publisherTags: [], dictionaries: dicts })
    }
  },

  /**
   * 通过 loadDictionary 异步加载 4 个词典的全部单词
   * loadDictionary 内部有缓存，不会重复请求
   */
  _loadAllWords() {
    if (this._allWords) return
    this._allWords = []
    var that = this
    var done = 0

    SEARCHABLE_DICTS.forEach(function (sd) {
      loadDictionary(sd.id).then(function (words) {
        if (!Array.isArray(words)) return
        for (var j = 0; j < words.length; j++) {
          var w = words[j]
          if (w && w.name) {
            that._allWords.push({
              name: w.name,
              trans: Array.isArray(w.trans) ? w.trans[0] : (w.trans || ''),
              dictId: sd.id,
              dictName: sd.name,
              wordIndex: j,
            })
          }
        }
        done++
        if (done === SEARCHABLE_DICTS.length) {
          that._wordsReady = true
          // Words loaded
        }
      }).catch(function (err) {
        console.warn('[Gallery] Failed to load', sd.id, err)
        done++
        if (done === SEARCHABLE_DICTS.length) {
          that._wordsReady = true
          // Partial load
        }
      })
    })
  },

  onSearchInput(e) {
    var keyword = e.detail.value.toLowerCase().trim()
    this.setData({ searchKeyword: keyword })

    if (!keyword) {
      this.setData({ isSearching: false })
      this._filterDictionaries(this.data.currentCategory)
      return
    }

    // 搜词典
    var dictResults = this.data.allDictionaries.filter(function (d) {
      return d.name.toLowerCase().indexOf(keyword) >= 0 ||
        d.description.toLowerCase().indexOf(keyword) >= 0
    })

    // 搜索单词
    var wordResults = []
    if (this._allWords) {
      for (var i = 0; i < this._allWords.length && wordResults.length < 20; i++) {
        var w = this._allWords[i]
        if (w.name.toLowerCase().indexOf(keyword) >= 0 ||
            w.trans.indexOf(keyword) >= 0) {
          wordResults.push(w)
        }
      }
    }

    this.setData({
      isSearching: true,
      searchDictResults: dictResults,
      searchWordResults: wordResults,
    })
  },

  onWordTap(e) {
    var item = e.currentTarget.dataset.item
    if (!item) return
    app.setAppConfig('currentDictId', item.dictId)
    app.setAppConfig('currentChapter', Math.floor(item.wordIndex / CHAPTER_LENGTH))
    app.globalData.currentWordName = item.name
    wx.switchTab({ url: '/pages/typing/typing' })
  },

  onDictSelect(e) {
    wx.navigateTo({ url: '/pages/dict-detail/dict-detail?id=' + e.detail.dict.id })
  },

  onClearSearch() {
    this.setData({ searchKeyword: '', isSearching: false })
    this._filterDictionaries(this.data.currentCategory)
  },
})
