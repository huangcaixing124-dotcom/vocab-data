/**
 * 背单词小程序常量
 */

// 每个章节的单词数量
const CHAPTER_LENGTH = 20

// 错误次数阈值，超过则显示跳过按钮
const WRONG_COUNT_TO_SKIP = 4

// 错误后清空输入的延迟时间（毫秒）
const WRONG_RESET_DELAY = 300

// 存储键名
const STORAGE_KEYS = {
  WORD_RECORDS: 'vocab_word_records',
  CHAPTER_RECORDS: 'vocab_chapter_records',
  REVIEW_RECORDS: 'vocab_review_records',
  CURRENT_DICT: 'vocab_current_dict',
  CURRENT_CHAPTER: 'vocab_current_chapter',
  PRONUNCIATION_CONFIG: 'vocab_pronunciation_config',
  KEY_SOUNDS_CONFIG: 'vocab_key_sounds_config',
  HINT_SOUNDS_CONFIG: 'vocab_hint_sounds_config',
  PHONETIC_CONFIG: 'vocab_phonetic_config',
  RANDOM_CONFIG: 'vocab_random_config',
  WORD_DICTATION_CONFIG: 'vocab_word_dictation_config',
  FONT_SIZE_CONFIG: 'vocab_font_size_config',
  IS_IGNORE_CASE: 'vocab_is_ignore_case',
  IS_SHOW_PREV_NEXT: 'vocab_is_show_prev_next',
  DARK_MODE: 'vocab_dark_mode',
  LOOP_WORD_CONFIG: 'vocab_loop_word_config',
  DAILY_GOAL: 'vocab_daily_goal',
  SRS_DATA: 'vocab_srs_data',
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
const DISMISS_START_CARD_DATE_KEY = 'vocab_dismiss_start_card_date'

module.exports = {
  CHAPTER_LENGTH,
  WRONG_COUNT_TO_SKIP,
  WRONG_RESET_DELAY,
  STORAGE_KEYS,
  DEFAULT_CONFIG,
  PRONUNCIATION_API,
  DISMISS_START_CARD_DATE_KEY,
}
