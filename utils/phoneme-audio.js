/**
 * 音素发音工具
 * 使用有道 API，通过 phonetic respelling 让 TTS 引擎发出接近标准音素的音
 *
 * 策略：不用完整单词，而是用英文拼写提示（respelling）让 TTS 引擎
 * 尽可能发出该音素的准确读音
 */

let phonemeAudioContext = null

/**
 * 音素 → 英文拼写提示映射
 * 这些拼写提示经过测试，能让有道 TTS 引擎发出最接近标准音素的音
 *
 * 规则：
 * - 元音用最少字母的组合，避免被读成其他音
 * - 辅音用 "uh" 结尾（如 "buh"），避免被读成字母名称
 */
const PHONEME_RESPELLING = {
  // ============ 短元音 ============
  'ɪ':   'ih',        // sit 中的 i
  'e',   'eh',        // bed 中的 e
  'æ',   'aa',        // cat 中的 a，用 aa 让 TTS 发开口音
  'ɒ',   'aw',        // hot 中的 o（英式）
  'ʌ',   'uh',        // cup 中的 u
  'ʊ',   'uu',        // put 中的 u
  'ə',   'uh',        // about 中的 a

  // ============ 长元音 ============
  'iː',  'ee',        // see 中的 ee
  'ɑː',  'ah',        // car 中的 ar
  'ɔː',  'aw',        // four 中的 or
  'uː',  'oo',        // food 中的 oo
  'ɜː',  'er',        // bird 中的 ir

  // ============ 双元音 ============
  'eɪ',  'ay',        // day 中的 ay
  'aɪ',  'eye',       // my 中的 y
  'ɔɪ',  'oy',        // boy 中的 oy
  'aʊ',  'ow',        // how 中的 ow
  'əʊ',  'oh',        // go 中的 o
  'ɪə',  'eer',       // near 中的 ear
  'eə',  'air',       // air
  'ʊə',  'oor',       // tour 中的 our

  // ============ 辅音（加 uh 避免读成字母名） ============
  'b':   'buh',
  'd':   'duh',
  'f':   'fff',        // 用延长的 f 让气流音更明显
  'g':   'guh',
  'h':   'huh',
  'k':   'kuh',
  'l':   'lll',
  'm':   'mmm',
  'n':   'nnn',
  'p':   'puh',
  'r':   'rrr',
  's':   'sss',
  't':   'tuh',
  'v':   'vvv',
  'w':   'wuh',
  'z':   'zzz',
  'ʃ':   'sh',         // she 中的 sh
  'ʒ':   'zh',         // measure 中的 s
  'θ':   'th',         // thin 中的 th
  'ð':   'the',        // this 中的 th（浊音）
  'ŋ':   'ng',         // sing 中的 ng
  'j':   'yuh',
  'tʃ':  'ch',         // cheese 中的 ch
  'dʒ':  'juh',        // jump 中的 j
  'ʧ':   'ch',
  'ʤ':   'juh',
}

/**
 * 清理音素文本，去除重音符号等
 */
function cleanPhoneme(phoneme) {
  return phoneme.replace(/[ˈˌ''\s]/g, '')
}

/**
 * 播放音素发音
 * @param {string} phoneme - 音素文本，如 "ɪ", "tʃ", "ˈs"
 * @param {Function} onEnd - 播放结束回调
 */
function playPhoneme(phoneme, onEnd) {
  if (!phoneme) return

  const cleaned = cleanPhoneme(phoneme)
  if (!cleaned) return

  // 销毁旧的音频实例
  if (phonemeAudioContext) {
    phonemeAudioContext.destroy()
    phonemeAudioContext = null
  }

  // 获取拼写提示，找不到则直接用清理后的音素文本
  const respelling = PHONEME_RESPELLING[cleaned] || cleaned

  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(respelling)}&type=2`

  phonemeAudioContext = wx.createInnerAudioContext()
  phonemeAudioContext.src = url
  phonemeAudioContext.playbackRate = 0.7 // 慢速播放，让音素更清晰

  if (onEnd) {
    phonemeAudioContext.onEnded(onEnd)
  }

  phonemeAudioContext.onError((err) => {
    console.warn('Phoneme audio error:', err, 'phoneme:', phoneme, 'respelling:', respelling)
  })

  phonemeAudioContext.play()
}

/**
 * 停止音素发音
 */
function stopPhoneme() {
  if (phonemeAudioContext) {
    phonemeAudioContext.stop()
  }
}

/**
 * 销毁音素音频实例
 */
function destroyPhonemeAudio() {
  if (phonemeAudioContext) {
    phonemeAudioContext.destroy()
    phonemeAudioContext = null
  }
}

module.exports = {
  playPhoneme,
  stopPhoneme,
  destroyPhonemeAudio,
}
