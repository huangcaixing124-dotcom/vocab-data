/**
 * 错题本页面
 */
const { getErrorWordData } = require('../../utils/record')
const { deleteWordRecordsByWordAndDict } = require('../../utils/storage')
const { playPronunciation } = require('../../utils/pronunciation')
const { getDictionary } = require('../../utils/dictionary')

Page({
  data: {
    errorWords: [],
    filteredWords: [],
    sortOrder: 'desc', // 'asc' | 'desc'
    searchKeyword: '',
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    // 详情弹窗
    showDetail: false,
    detailWord: null,
    themeClass: '',
  },

  onShow() {
    this.setData({
      themeClass: getApp().globalData.isDarkMode === false ? 'theme-light' : '',
    })
    this._loadErrorWords()
  },

  _loadErrorWords() {
    const errorData = getErrorWordData()
    this.setData({ errorWords: errorData })
    this._applyFilter()
  },

  _applyFilter() {
    const { errorWords, sortOrder, searchKeyword, currentPage, pageSize } = this.data

    let filtered = [...errorWords]

    // 搜索过滤
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase()
      filtered = filtered.filter((w) => w.word.toLowerCase().includes(kw))
    }

    // 排序
    filtered.sort((a, b) =>
      sortOrder === 'desc' ? b.errorCount - a.errorCount : a.errorCount - b.errorCount
    )

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const page = Math.min(currentPage, totalPages)
    const start = (page - 1) * pageSize
    const paged = filtered.slice(start, start + pageSize)

    this.setData({
      filteredWords: paged,
      totalPages,
      currentPage: page,
    })
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value, currentPage: 1 })
    this._applyFilter()
  },

  onToggleSort() {
    this.setData({
      sortOrder: this.data.sortOrder === 'desc' ? 'asc' : 'desc',
      currentPage: 1,
    })
    this._applyFilter()
  },

  onPrevPage() {
    if (this.data.currentPage > 1) {
      this.setData({ currentPage: this.data.currentPage - 1 })
      this._applyFilter()
    }
  },

  onNextPage() {
    if (this.data.currentPage < this.data.totalPages) {
      this.setData({ currentPage: this.data.currentPage + 1 })
      this._applyFilter()
    }
  },

  /**
   * 查看错词详情
   */
  onViewDetail(e) {
    const { word, dict } = e.currentTarget.dataset
    const detail = this.data.errorWords.find((w) => w.word === word && w.dict === dict)
    if (detail) {
      const dictInfo = getDictionary(dict)
      this.setData({
        showDetail: true,
        detailWord: { ...detail, dictName: dictInfo ? dictInfo.name : dict },
      })
    }
  },

  onCloseDetail() {
    this.setData({ showDetail: false, detailWord: null })
  },

  onPlayWordSound(e) {
    const word = e.currentTarget.dataset.word
    if (word) playPronunciation(word, 'us')
  },

  /**
   * 删除错词记录
   */
  onDeleteWord(e) {
    const { word, dict } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: `删除 "${word}" 的所有练习记录？`,
      success: (res) => {
        if (res.confirm) {
          deleteWordRecordsByWordAndDict(word, dict)
          this.setData({ showDetail: false, detailWord: null })
          this._loadErrorWords()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      },
    })
  },
})
