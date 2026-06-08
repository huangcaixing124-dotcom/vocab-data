const { getFinishedChapters } = require('../../utils/storage')
const app = getApp()

Component({
  properties: {
    dict: { type: Object, value: null },
    dailyGoal: { type: Number, value: 20 },
  },
  data: {
    finishedCount: 0,
    progressPercent: 0,
    estimatedDays: 0,
  },
  lifetimes: {
    attached() {
      this._updateProgress()
    },
  },
  observers: {
    'dict, dailyGoal': function () {
      this._updateProgress()
    },
  },
  methods: {
    _updateProgress() {
      const { dict, dailyGoal } = this.data
      if (!dict) return
      const finished = getFinishedChapters(dict.id)
      const total = dict.chapterCount || 1
      const goal = dailyGoal || 20
      const remaining = dict.length - (finished.size * 20)
      const estimatedDays = remaining > 0 ? Math.ceil(remaining / goal) : 0
      this.setData({
        finishedCount: finished.size,
        progressPercent: Math.round((finished.size / total) * 100),
        estimatedDays: estimatedDays,
      })
    },
    onTap() {
      this.triggerEvent('select', { dict: this.data.dict })
    },
  },
})
