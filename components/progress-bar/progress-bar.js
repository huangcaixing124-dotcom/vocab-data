Component({
  properties: {
    current: { type: Number, value: 0 },
    total: { type: Number, value: 20 },
  },
  data: {
    percent: 0,
  },
  lifetimes: {
    attached() {
      const percent = this.data.total > 0
        ? Math.round((this.data.current / this.data.total) * 100)
        : 0
      this.setData({ percent })
    },
  },
  observers: {
    'current, total': function () {
      const percent = this.data.total > 0
        ? Math.round((this.data.current / this.data.total) * 100)
        : 0
      this.setData({ percent })
    },
  },
})
