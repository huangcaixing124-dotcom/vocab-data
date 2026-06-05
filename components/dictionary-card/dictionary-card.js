const { getFinishedChapters } = require('../../utils/storage')

Component({
  properties: {
    dict: { type: Object, value: null },
  },
  data: {
    finishedCount: 0,
    progressPercent: 0,
  },
  lifetimes: {
    attached() {
      this._updateProgress()
    },
  },
  observers: {
    dict: function () {
      this._updateProgress()
    },
  },
  methods: {
    _updateProgress() {
      const { dict } = this.data
      if (!dict) return
      const finished = getFinishedChapters(dict.id)
      const total = dict.chapterCount || 1
      this.setData({
        finishedCount: finished.size,
        progressPercent: Math.round((finished.size / total) * 100),
      })
    },
    onTap() {
      this.triggerEvent('select', { dict: this.data.dict })
    },
  },
})
