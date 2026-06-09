/**
 * Word display panel component
 * Shows current word, phonetics (clickable), translation, example sentence, and typing state
 */

var phoneticParser = require('../../utils/phonetic-parser')
var parsePhonetic = phoneticParser.parsePhonetic
var getPhonemeClass = phoneticParser.getPhonemeClass
var exampleSentenceUtil = require('../../utils/example-sentence')
var getExampleSentence = exampleSentenceUtil.getExampleSentence

Component({
  properties: {
    word: { type: Object, value: null },
    inputWord: { type: String, value: '' },
    letterStates: { type: Array, value: [] },
    hasWrong: { type: Boolean, value: false },
    isFinished: { type: Boolean, value: false },
    phoneticType: { type: String, value: 'us' },
    showPhonetic: { type: Boolean, value: true },
    showTranslation: { type: Boolean, value: true },
    prevWord: { type: Object, value: null },
    nextWord: { type: Object, value: null },
    showPrevNext: { type: Boolean, value: true },
    dictationMode: { type: String, value: 'none' },
    randomLetterVisible: { type: Array, value: [] },
    fontSize: { type: Number, value: 36 },
    wordRoot: { type: Object, value: null },
  },

  data: {
    letters: [],
    phonetic: '',
    phonemes: [],
    sentenceParts: [],
    sentenceCn: '',
    isLoadingSentence: false,
  },

  _lastWordName: '',
  _pendingSentence: null,

  observers: {
    'word, inputWord, letterStates, dictationMode, randomLetterVisible': function () {
      this._updateLetters()
      this._updatePhonetic()
    },
    'word': function (word) {
      this._fetchSentence(word)
    },
    'isFinished': function (val) {
      if (val && this._pendingSentence) {
        this.setData({ sentenceParts: this._pendingSentence.parts || [] })
      }
      // Don't clear sentenceParts when isFinished becomes false
      // because sentence should show alongside the word
    },
  },

  methods: {
    _updateLetters() {
      var word = this.data.word
      var inputWord = this.data.inputWord
      var letterStates = this.data.letterStates
      var dictationMode = this.data.dictationMode
      var randomLetterVisible = this.data.randomLetterVisible

      if (!word || !word.name) {
        this.setData({ letters: [] })
        return
      }

      var wordName = word.name
      var letters = []
      for (var index = 0; index < wordName.length; index++) {
        var char = wordName[index]
        var state = letterStates[index] || 'normal'
        var isTyped = index < inputWord.length

        var visible = true
        if (dictationMode === 'hideAll') {
          visible = isTyped
        } else if (dictationMode === 'hideVowel') {
          visible = ('aeiouAEIOU'.indexOf(char) < 0) || isTyped
        } else if (dictationMode === 'hideConsonant') {
          visible = ('aeiouAEIOU'.indexOf(char) >= 0) || isTyped
        } else if (dictationMode === 'randomHide') {
          visible = (randomLetterVisible[index] !== false) || isTyped
        }

        letters.push({
          char: visible ? char : '_',
          originalChar: char,
          state: state,
          isTyped: isTyped,
          visible: visible,
          isCurrentInput: index === inputWord.length,
        })
      }
      this.setData({ letters: letters })
    },

    _updatePhonetic() {
      var word = this.data.word
      var phoneticType = this.data.phoneticType
      if (!word) {
        this.setData({ phonetic: '', phonemes: [] })
        return
      }
      var phonetic = (phoneticType === 'uk' && word.ukphone) ? word.ukphone : word.usphone
      var parsed = parsePhonetic(phonetic)
      var phonemes = []
      for (var i = 0; i < parsed.length; i++) {
        phonemes.push({
          text: parsed[i].text,
          type: parsed[i].type,
          cssClass: getPhonemeClass(parsed[i].type),
        })
      }
      this.setData({ phonetic: phonetic || '', phonemes: phonemes })
    },

    _fetchSentence(word) {
      if (!word || !word.name) {
        this._pendingSentence = null
        this._lastWordName = ''
        this.setData({ sentenceParts: [] })
        return
      }
      if (word.name === this._lastWordName) return
      this._lastWordName = word.name
      this._pendingSentence = null

      var self = this
      getExampleSentence(word.name).then(function (result) {
        if (self._lastWordName !== word.name) return
        if (result && result.parts && result.parts.length > 0) {
          self._pendingSentence = result
          // Defer setData to next tick to avoid rendering conflicts
          setTimeout(function () {
            if (self._lastWordName !== word.name) return
            self.setData({
              sentenceParts: result.parts || [],
              sentenceCn: result.cn || '',
            })
          }, 50)
        }
      })
    },

    onPhonemeTap(e) {
      var phoneme = e.currentTarget.dataset.phoneme
      if (phoneme) {
        this.triggerEvent('playPhoneme', { phoneme: phoneme })
      }
    },

    onPlaySound() {
      this.triggerEvent('playSound')
    },

    onPlaySentence() {
      if (this._pendingSentence && this._pendingSentence.sentence) {
        this.triggerEvent('playSentence', { sentence: this._pendingSentence.sentence })
      }
    },
  },
})
