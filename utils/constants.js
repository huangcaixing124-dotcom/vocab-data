/**
 * Qwerty-Learner 小程序常量
 */

// 每个章节的单词数量
const CHAPTER_LENGTH = 20

// 错误次数阈值，超过则显示跳过按钮
const WRONG_COUNT_TO_SKIP = 4

// 错误后清空输入的延迟时间（毫秒）
const WRONG_RESET_DELAY = 300

// 存储键名
const STORAGE_KEYS = {
  WORD_RECORDS: 'qwerty_word_records',
  CHAPTER_RECORDS: 'qwerty_chapter_records',
  REVIEW_RECORDS: 'qwerty_review_records',
  CURRENT_DICT: 'qwerty_current_dict',
  CURRENT_CHAPTER: 'qwerty_current_chapter',
  PRONUNCIATION_CONFIG: 'qwerty_pronunciation_config',
  KEY_SOUNDS_CONFIG: 'qwerty_key_sounds_config',
  HINT_SOUNDS_CONFIG: 'qwerty_hint_sounds_config',
  PHONETIC_CONFIG: 'qwerty_phonetic_config',
  RANDOM_CONFIG: 'qwerty_random_config',
  WORD_DICTATION_CONFIG: 'qwerty_word_dictation_config',
  FONT_SIZE_CONFIG: 'qwerty_font_size_config',
  IS_IGNORE_CASE: 'qwerty_is_ignore_case',
  IS_SHOW_PREV_NEXT: 'qwerty_is_show_prev_next',
  DARK_MODE: 'qwerty_dark_mode',
  LOOP_WORD_CONFIG: 'qwerty_loop_word_config',
  DAILY_GOAL: 'qwerty_daily_goal',
  SRS_DATA: 'qwerty_srs_data',
}

// 默认配置
const DEFAULT_CONFIG = {
  pronunciation: {
    isOpen: true,
    volume: 1,
    type: 'us', // 'us' | 'uk'
    rate: 1,
    isLoop: false,
    isTransRead: false,
  },
  keySounds: {
    isOpen: true,
    volume: 1,
  },
  hintSounds: {
    isOpen: true,
    volume: 1,
    isOpenWrongSound: true,
    isOpenCorrectSound: true,
  },
  phonetic: {
    isOpen: true,
    type: 'us', // 'us' | 'uk'
  },
  random: {
    isOpen: false,
  },
  wordDictation: {
    isOpen: false,
    type: 'hideAll', // 'hideAll' | 'hideVowel' | 'hideConsonant' | 'randomHide'
  },
  fontSize: {
    word: 36,
    phonetic: 16,
    translation: 14,
  },
  loopWord: {
    times: 1, // 1 | 3 | 5 | 8 | 999999
  },
  dailyGoal: {
    isOpen: true,
    target: 20, // 每日目标单词数
  },
  isIgnoreCase: true,
  isShowPrevAndNextWord: true,
  isDarkMode: false,
}

// 发音 API
const PRONUNCIATION_API = 'https://dict.youdao.com/dictvoice'

// 时间相关
const DISMISS_START_CARD_DATE_KEY = 'qwerty_dismiss_start_card_date'

module.exports = {
  CHAPTER_LENGTH,
  WRONG_COUNT_TO_SKIP,
  WRONG_RESET_DELAY,
  STORAGE_KEYS,
  DEFAULT_CONFIG,
  PRONUNCIATION_API,
  DISMISS_START_CARD_DATE_KEY,
}
