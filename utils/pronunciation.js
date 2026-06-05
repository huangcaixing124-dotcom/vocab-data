/**
 * 发音工具
 * 使用有道词典发音 API (HTTPS) + wx.createInnerAudioContext()
 */

const { PRONUNCIATION_API } = require('./constants')

let audioContext = null
let currentUrl = ''

/**
 * 获取发音 URL
 * @param {string} word - 单词
 * @param {string} type - 发音类型 'us' | 'uk'
 */
function getSoundUrl(word, type) {
  if (!word) return ''
  const audioType = type === 'uk' ? 1 : 2
  return `${PRONUNCIATION_API}?audio=${encodeURIComponent(word)}&type=${audioType}`
}

/**
 * 播放单词发音
 * @param {string} word - 单词
 * @param {string} type - 发音类型 'us' | 'uk'
 * @param {Function} onEnd - 播放结束回调
 * @param {Object} options - 额外选项 { rate, loop }
 * @returns {Object} audioContext
 */
function playPronunciation(word, type, onEnd, options) {
  if (!word) return null

  const url = getSoundUrl(word, type)
  const rate = (options && options.rate) || 1
  const loop = (options && options.loop) || false

  // 如果是同一个 URL，重新播放
  if (audioContext && currentUrl === url) {
    audioContext.stop()
    audioContext.offEnded()
    audioContext.playbackRate = rate
    audioContext.loop = loop
    if (onEnd && !loop) {
      audioContext.onEnded(onEnd)
    }
    audioContext.play()
    return audioContext
  }

  // 销毁旧的音频实例
  if (audioContext) {
    audioContext.destroy()
    audioContext = null
  }

  audioContext = wx.createInnerAudioContext()
  audioContext.src = url
  audioContext.playbackRate = rate
  audioContext.loop = loop
  currentUrl = url

  if (onEnd && !loop) {
    audioContext.onEnded(onEnd)
  }

  audioContext.onError((err) => {
    console.warn('Audio play error:', err)
  })

  audioContext.play()
  return audioContext
}

/**
 * 停止发音
 */
function stopPronunciation() {
  if (audioContext) {
    audioContext.stop()
  }
}

/**
 * 销毁音频实例
 */
function destroyPronunciation() {
  if (audioContext) {
    audioContext.destroy()
    audioContext = null
    currentUrl = ''
  }
}

// ============ 按键音效 ============

let keySoundContext = null
let wrongSoundContext = null
let correctSoundContext = null
let translationAudioContext = null
var sentenceAudioContext = null

/**
 * 播放按键音
 */
function playKeySound() {
  try {
    if (!keySoundContext) {
      keySoundContext = wx.createInnerAudioContext()
      keySoundContext.src = '/assets/sounds/key.wav'
    }
    keySoundContext.stop()
    keySoundContext.play()
  } catch (e) {
    // ignore
  }
}

/**
 * 播放错误音
 */
function playWrongSound() {
  try {
    if (!wrongSoundContext) {
      wrongSoundContext = wx.createInnerAudioContext()
      wrongSoundContext.src = '/assets/sounds/wrong.wav'
    }
    wrongSoundContext.stop()
    wrongSoundContext.play()
  } catch (e) {
    // ignore
  }
}

/**
 * 播放正确音
 */
function playCorrectSound() {
  try {
    if (!correctSoundContext) {
      correctSoundContext = wx.createInnerAudioContext()
      correctSoundContext.src = '/assets/sounds/correct.wav'
    }
    correctSoundContext.stop()
    correctSoundContext.play()
  } catch (e) {
    // ignore
  }
}

/**
 * 播放中文释义朗读（使用有道 API）
 * @param {string} text - 中文文本
 */
function playTranslation(text) {
  if (!text) return
  try {
    if (translationAudioContext) {
      translationAudioContext.destroy()
      translationAudioContext = null
    }
    translationAudioContext = wx.createInnerAudioContext()
    translationAudioContext.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&le=zh`
    translationAudioContext.onError((err) => {
      console.warn('Translation audio error:', err)
    })
    translationAudioContext.play()
  } catch (e) {
    // ignore
  }
}

/**
 * 销毁所有音效实例
 */
function destroyAllSounds() {
  ;[keySoundContext, wrongSoundContext, correctSoundContext, translationAudioContext, sentenceAudioContext].forEach((ctx) => {
    if (ctx) {
      try { ctx.destroy() } catch (e) { /* ignore */ }
    }
  })
  keySoundContext = null
  wrongSoundContext = null
  correctSoundContext = null
  translationAudioContext = null
  sentenceAudioContext = null
  destroyPronunciation()
}

// ============ 例句发音 ============

/**
 * Play English sentence pronunciation via Youdao TTS
 * @param {string} sentence - English sentence
 */
function playEnglishSentence(sentence) {
  if (!sentence) return
  try {
    if (sentenceAudioContext) {
      sentenceAudioContext.destroy()
      sentenceAudioContext = null
    }
    sentenceAudioContext = wx.createInnerAudioContext()
    // Use local TTS server via machine IP (localhost won't work from simulator/phone)
    var ttsUrl = 'http://192.168.2.44:8765/tts?text=' + encodeURIComponent(sentence)
    sentenceAudioContext.src = ttsUrl
    sentenceAudioContext.playbackRate = 0.85
    sentenceAudioContext.onError(function (err) {
      console.warn('Sentence audio error:', err)
    })
    sentenceAudioContext.play()
  } catch (e) {
    // ignore
  }
}

// ============ 音素发音（本地音频文件） ============

var phonemeAudioContext = null

// IPA symbol -> local audio file mapping
// Mix of IPA dataset (real pronunciation) and Edge-TTS (supplementary)
var PHONEME_AUDIO = {}
// Short vowels (IPA dataset)
PHONEME_AUDIO['\u026A'] = '/assets/sounds/phonemes/ih.mp3'           // ɪ
PHONEME_AUDIO['e'] = '/assets/sounds/phonemes/eh.mp3'                // e
PHONEME_AUDIO['\u00E6'] = '/assets/sounds/phonemes/ae.mp3'           // æ
PHONEME_AUDIO['\u0252'] = '/assets/sounds/phonemes/open_o.mp3'       // ɒ
PHONEME_AUDIO['\u028C'] = '/assets/sounds/phonemes/wedge.mp3'        // ʌ (Edge-TTS)
PHONEME_AUDIO['\u028A'] = '/assets/sounds/phonemes/upsilon.mp3'      // ʊ
PHONEME_AUDIO['\u0259'] = '/assets/sounds/phonemes/schwa.mp3'        // ə
// IPA variant vowels (real IPA audio)
PHONEME_AUDIO['\u025B'] = '/assets/sounds/phonemes/epsilon.mp3'      // ɛ
PHONEME_AUDIO['\u0251'] = '/assets/sounds/phonemes/a_open.mp3'       // ɑ
PHONEME_AUDIO['\u0254'] = '/assets/sounds/phonemes/open_o_back.mp3'  // ɔ
PHONEME_AUDIO['\u025A'] = '/assets/sounds/phonemes/schwa.mp3'        // ɚ
PHONEME_AUDIO['\u025D'] = '/assets/sounds/phonemes/er.mp3'           // ɝ
PHONEME_AUDIO['\u025C'] = '/assets/sounds/phonemes/er.mp3'           // ɜ
// ASCII vowel fallbacks
PHONEME_AUDIO['i'] = '/assets/sounds/phonemes/i.mp3'                 // i (IPA dataset)
PHONEME_AUDIO['o'] = '/assets/sounds/phonemes/oh.mp3'                // o
PHONEME_AUDIO['u'] = '/assets/sounds/phonemes/u.mp3'                 // u (IPA dataset)
PHONEME_AUDIO['a'] = '/assets/sounds/phonemes/ae.mp3'                // a
// Long vowels (Edge-TTS)
PHONEME_AUDIO['i\u02D0'] = '/assets/sounds/phonemes/i_long.mp3'      // iː
PHONEME_AUDIO['\u0251\u02D0'] = '/assets/sounds/phonemes/a_long.mp3' // ɑː
PHONEME_AUDIO['\u0254\u02D0'] = '/assets/sounds/phonemes/o_long.mp3' // ɔː
PHONEME_AUDIO['u\u02D0'] = '/assets/sounds/phonemes/u_long.mp3'      // uː
PHONEME_AUDIO['\u025C\u02D0'] = '/assets/sounds/phonemes/er_long.mp3' // ɜː
// Diphthongs (Edge-TTS)
PHONEME_AUDIO['e\u026A'] = '/assets/sounds/phonemes/ay.mp3'          // eɪ
PHONEME_AUDIO['a\u026A'] = '/assets/sounds/phonemes/eye.mp3'         // aɪ
PHONEME_AUDIO['\u0254\u026A'] = '/assets/sounds/phonemes/oy.mp3'     // ɔɪ
PHONEME_AUDIO['a\u028A'] = '/assets/sounds/phonemes/ow.mp3'          // aʊ
PHONEME_AUDIO['o\u028A'] = '/assets/sounds/phonemes/oh.mp3'          // oʊ
PHONEME_AUDIO['\u026A\u0259'] = '/assets/sounds/phonemes/eer.mp3'    // ɪə
PHONEME_AUDIO['e\u0259'] = '/assets/sounds/phonemes/air.mp3'         // eə
PHONEME_AUDIO['\u028A\u0259'] = '/assets/sounds/phonemes/oor.mp3'    // ʊə
// Consonants (IPA dataset - real pronunciation, higher quality)
PHONEME_AUDIO['b'] = '/assets/sounds/phonemes/b.mp3'
PHONEME_AUDIO['d'] = '/assets/sounds/phonemes/d.mp3'
PHONEME_AUDIO['f'] = '/assets/sounds/phonemes/f.mp3'
PHONEME_AUDIO['g'] = '/assets/sounds/phonemes/g.mp3'
PHONEME_AUDIO['\u0261'] = '/assets/sounds/phonemes/g.mp3'            // ɡ
PHONEME_AUDIO['h'] = '/assets/sounds/phonemes/h.mp3'
PHONEME_AUDIO['k'] = '/assets/sounds/phonemes/k.mp3'
PHONEME_AUDIO['l'] = '/assets/sounds/phonemes/l.mp3'
PHONEME_AUDIO['m'] = '/assets/sounds/phonemes/m.mp3'
PHONEME_AUDIO['n'] = '/assets/sounds/phonemes/n.mp3'
PHONEME_AUDIO['p'] = '/assets/sounds/phonemes/p.mp3'
PHONEME_AUDIO['r'] = '/assets/sounds/phonemes/r.mp3'
PHONEME_AUDIO['\u0279'] = '/assets/sounds/phonemes/r.mp3'            // ɹ
PHONEME_AUDIO['s'] = '/assets/sounds/phonemes/s.mp3'
PHONEME_AUDIO['t'] = '/assets/sounds/phonemes/t.mp3'
PHONEME_AUDIO['v'] = '/assets/sounds/phonemes/v.mp3'
PHONEME_AUDIO['w'] = '/assets/sounds/phonemes/w.mp3'
PHONEME_AUDIO['z'] = '/assets/sounds/phonemes/z.mp3'
PHONEME_AUDIO['\u0283'] = '/assets/sounds/phonemes/esh.mp3'          // ʃ (IPA dataset)
PHONEME_AUDIO['\u0292'] = '/assets/sounds/phonemes/ezh.mp3'          // ʒ (IPA dataset)
PHONEME_AUDIO['\u03B8'] = '/assets/sounds/phonemes/theta.mp3'        // θ
PHONEME_AUDIO['\u00F0'] = '/assets/sounds/phonemes/eth.mp3'          // ð
PHONEME_AUDIO['\u014B'] = '/assets/sounds/phonemes/eng.mp3'          // ŋ (IPA dataset)
PHONEME_AUDIO['j'] = '/assets/sounds/phonemes/y.mp3'                 // j (palatal, IPA dataset)
PHONEME_AUDIO['t\u0283'] = '/assets/sounds/phonemes/ch.mp3'          // tʃ (Edge-TTS)
PHONEME_AUDIO['d\u0292'] = '/assets/sounds/phonemes/j_d.mp3'         // dʒ (Edge-TTS "judge")

/**
 * Play IPA phoneme - ipachart.app audio for consonants+vowels, skip unsupported
 */
// Consonants WITHOUT local audio (skip these)
var NO_AUDIO = {}
'sz'.split('').forEach(function(c) { NO_AUDIO[c] = true })
NO_AUDIO['\u0283'] = true  // ʃ
NO_AUDIO['\u0292'] = true  // ʒ
NO_AUDIO['\u03B8'] = true  // θ
NO_AUDIO['\u00F0'] = true  // ð
NO_AUDIO['\u014B'] = true  // ŋ
NO_AUDIO['t\u0283'] = true // tʃ
NO_AUDIO['d\u0292'] = true // dʒ

function playPhoneme(phoneme, onEnd) {
  if (!phoneme) return

  var cleaned = phoneme.replace(/[\u02C8\u02CC'\s\u200B]/g, '')
  if (!cleaned) return

  cleaned = cleaned
    .replace(/\u03B5/g, '\u025B')
    .replace(/\u02B3/g, '')

  if (!cleaned) return

  if (NO_AUDIO[cleaned]) return

  // 元音：播放本地音素音频
  var audioSrc = PHONEME_AUDIO[cleaned]
  if (!audioSrc) return

  if (phonemeAudioContext) {
    phonemeAudioContext.destroy()
    phonemeAudioContext = null
  }

  phonemeAudioContext = wx.createInnerAudioContext()
  phonemeAudioContext.src = audioSrc
  if (onEnd) phonemeAudioContext.onEnded(onEnd)
  phonemeAudioContext.onError(function (err) {
    console.warn('Phoneme audio error:', err)
  })
  phonemeAudioContext.play()
}

module.exports = {
  getSoundUrl,
  playPronunciation,
  stopPronunciation,
  destroyPronunciation,
  playKeySound,
  playWrongSound,
  playCorrectSound,
  playTranslation,
  playEnglishSentence,
  playPhoneme,
  destroyAllSounds,
}
