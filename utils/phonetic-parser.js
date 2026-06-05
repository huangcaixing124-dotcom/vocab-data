/**
 * IPA 音标解析工具
 * 将音标字符串拆分为单个音素，并标注类型（元音/辅音/双元音/重音）
 */

// 音素分类定义
var PHONEME_TYPES = {
  SHORT_VOWEL: 'shortVowel',
  LONG_VOWEL: 'longVowel',
  DIPHTHONG: 'diphthong',
  CONSONANT: 'consonant',
  STRESS: 'stress',
}

// 双元音（必须在长元音和单元音之前匹配）
var DIPHTHONGS = ['eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'əʊ', 'ɪə', 'eə', 'ʊə']

// 长元音（带 ː 符号）
var LONG_VOWELS = ['iː', 'ɑː', 'ɔː', 'uː', 'ɜː', 'aː', 'eː', 'oː', 'øː']

// 短元音（含美式 IPA 变体 ɛ/ɑ/ɔ/ɚ/ɝ/ɜ）
var SHORT_VOWELS = ['ɪ', 'e', 'ɛ', 'æ', 'ɒ', 'ɑ', 'ɔ', 'ʌ', 'ʊ', 'ə', 'ɚ', 'ɝ', 'ɜ', 'a', 'i', 'o', 'u', 'y', 'ø']

// 双辅音（塞擦音）
var AFFRICATES = ['tʃ', 'dʒ']

// 单辅音
var CONSONANTS = ['b', 'd', 'f', 'g', 'ɡ', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'z', 'ʃ', 'ʒ', 'θ', 'ð', 'ŋ', 'j']

// 重音符号
var STRESS_MARKS = ['ˈ', 'ˌ', "'"]

/**
 * 判断音素类型
 */
function getPhonemeType(phoneme) {
  if (STRESS_MARKS.indexOf(phoneme) >= 0) return PHONEME_TYPES.STRESS
  if (DIPHTHONGS.indexOf(phoneme) >= 0) return PHONEME_TYPES.DIPHTHONG
  if (LONG_VOWELS.indexOf(phoneme) >= 0) return PHONEME_TYPES.LONG_VOWEL
  if (AFFRICATES.indexOf(phoneme) >= 0) return PHONEME_TYPES.CONSONANT
  if (SHORT_VOWELS.indexOf(phoneme) >= 0) return PHONEME_TYPES.SHORT_VOWEL
  if (CONSONANTS.indexOf(phoneme) >= 0) return PHONEME_TYPES.CONSONANT
  return PHONEME_TYPES.CONSONANT
}

/**
 * 解析音标字符串为音素数组
 * @param {string} phonetic - 音标字符串
 * @returns {Array} 音素数组
 */
function parsePhonetic(phonetic) {
  if (!phonetic) return []

  var str = phonetic.replace(/^[/\s]+|[/\s]+$/g, '')
  if (!str) return []

  // 标准化非标准 IPA 变体
  str = str.replace(/əu/g, 'əʊ')  // NCE_1 uses əu for GOAT vowel

  var result = []
  var i = 0

  while (i < str.length) {
    var remaining = str.slice(i)
    var matched = false
    var j, item

    // 1. 双元音
    for (j = 0; j < DIPHTHONGS.length; j++) {
      item = DIPHTHONGS[j]
      if (remaining.indexOf(item) === 0) {
        result.push({ text: item, type: PHONEME_TYPES.DIPHTHONG })
        i += item.length
        matched = true
        break
      }
    }
    if (matched) continue

    // 2. 长元音
    for (j = 0; j < LONG_VOWELS.length; j++) {
      item = LONG_VOWELS[j]
      if (remaining.indexOf(item) === 0) {
        result.push({ text: item, type: PHONEME_TYPES.LONG_VOWEL })
        i += item.length
        matched = true
        break
      }
    }
    if (matched) continue

    // 3. 双辅音（塞擦音）
    for (j = 0; j < AFFRICATES.length; j++) {
      item = AFFRICATES[j]
      if (remaining.indexOf(item) === 0) {
        result.push({ text: item, type: PHONEME_TYPES.CONSONANT })
        i += item.length
        matched = true
        break
      }
    }
    if (matched) continue

    // 4. 重音符号（单独作为一个 token，不与后续字符合并）
    var ch = str[i]
    if (STRESS_MARKS.indexOf(ch) >= 0) {
      result.push({ text: ch, type: PHONEME_TYPES.STRESS })
      i++
      continue
    }

    // 5. 单字符匹配
    var type = getPhonemeType(ch)
    result.push({ text: ch, type: type })
    i++
  }

  return result
}

/**
 * 获取音素类型对应的 CSS 类名
 */
function getPhonemeClass(type) {
  if (type === PHONEME_TYPES.SHORT_VOWEL) return 'phoneme-short-vowel'
  if (type === PHONEME_TYPES.LONG_VOWEL) return 'phoneme-long-vowel'
  if (type === PHONEME_TYPES.DIPHTHONG) return 'phoneme-diphthong'
  if (type === PHONEME_TYPES.STRESS) return 'phoneme-stress'
  return 'phoneme-consonant'
}

/**
 * 获取音素类型对应的中文名称
 */
function getPhonemeTypeName(type) {
  if (type === PHONEME_TYPES.SHORT_VOWEL) return '短元音'
  if (type === PHONEME_TYPES.LONG_VOWEL) return '长元音'
  if (type === PHONEME_TYPES.DIPHTHONG) return '双元音'
  if (type === PHONEME_TYPES.STRESS) return '重读'
  return '辅音'
}

module.exports = {
  PHONEME_TYPES: PHONEME_TYPES,
  parsePhonetic: parsePhonetic,
  getPhonemeClass: getPhonemeClass,
  getPhonemeTypeName: getPhonemeTypeName,
}
