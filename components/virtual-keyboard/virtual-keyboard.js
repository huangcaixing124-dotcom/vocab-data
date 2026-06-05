/**
 * 虚拟 QWERTY 键盘组件
 * 这是小程序版的核心新增组件，替代原版的物理键盘输入
 */

Component({
  properties: {
    // 当前期望输入的字母
    expectedLetter: {
      type: String,
      value: '',
    },
    // 已输入的字母列表
    inputLetters: {
      type: Array,
      value: [],
    },
    // 当前是否有错误状态
    hasWrong: {
      type: Boolean,
      value: false,
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    // 键盘布局
    rows: [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    ],
    // 当前按下的键
    pressedKey: '',
    // 最近正确/错误的键（用于动画反馈）
    feedbackKey: '',
    feedbackType: '', // 'correct' | 'wrong'
  },

  methods: {
    /**
     * 键盘按键触摸开始
     */
    onKeyTouchStart(e) {
      if (this.data.disabled) return

      const key = e.currentTarget.dataset.key
      this.setData({ pressedKey: key })
    },

    /**
     * 键盘按键触摸结束 - 触发输入
     */
    onKeyTap(e) {
      if (this.data.disabled) return

      const key = e.currentTarget.dataset.key
      this.setData({ pressedKey: '' })

      // 触发输入事件
      this.triggerEvent('input', { key })

      // 触觉反馈
      wx.vibrateShort({ type: 'light' })
    },

    /**
     * 键盘按键触摸取消
     */
    onKeyTouchEnd() {
      this.setData({ pressedKey: '' })
    },

    /**
     * 空格键点击
     */
    onSpaceTap() {
      if (this.data.disabled) return
      this.triggerEvent('input', { key: ' ' })
      wx.vibrateShort({ type: 'light' })
    },

    /**
     * 设置按键反馈（正确/错误动画）
     */
    setFeedback(key, type) {
      this.setData({ feedbackKey: key, feedbackType: type })
      setTimeout(() => {
        this.setData({ feedbackKey: '', feedbackType: '' })
      }, 300)
    },
  },

  observers: {
    /**
     * 监听错误状态，触发震动反馈
     */
    hasWrong(val) {
      if (val) {
        wx.vibrateShort({ type: 'heavy' })
      }
    },
    /**
     * 监听输入变化，触发按键反馈动画
     */
    inputLetters(newVal, oldVal) {
      if (!oldVal || newVal.length <= oldVal.length) return
      const lastKey = newVal[newVal.length - 1]
      if (lastKey) {
        this.setFeedback(lastKey, 'correct')
      }
    },
  },
})
