/**
 * Example Sentence Utility
 * Priority: pre-generated local JSON > runtime API fallback
 */

var CACHE_KEY = 'qwerty_example_cache'
var NONE_MARKER = '__NONE__'
var memCache = null
var sentenceData = null

function getCache() {
  if (memCache) return memCache
  try {
    var data = wx.getStorageSync(CACHE_KEY)
    memCache = (data && typeof data === 'object') ? data : {}
  } catch (e) {
    memCache = {}
  }
  return memCache
}

function saveCache(cache) {
  memCache = cache
  try {
    wx.setStorageSync(CACHE_KEY, cache)
  } catch (e) {}
}

/**
 * Load pre-generated sentence data from local JSON
 */
function loadSentenceData() {
  if (sentenceData !== null) return sentenceData
  try {
    sentenceData = require('../../dicts/sentence-data.json')
  } catch (e) {
    sentenceData = {}
  }
  return sentenceData
}

/**
 * Get example sentence for a word
 */
function getExampleSentence(word) {
  if (!word) return Promise.resolve(null)

  var w = word.toLowerCase().trim()
  var data = loadSentenceData()

  // 1. Pre-generated data (instant, no network)
  if (data[w] && data[w].sentence) {
    return Promise.resolve({
      sentence: data[w].sentence,
      parts: parseParts(data[w].sentence, word),
      cn: data[w].cn || null,
    })
  }

  // 2. Local cache
  var cache = getCache()
  if (cache[w] === NONE_MARKER) {
    return Promise.resolve(null)
  }
  if (cache[w] && cache[w] !== NONE_MARKER) {
    var cached = cache[w]
    return Promise.resolve({ sentence: cached, parts: parseParts(cached, word), cn: null })
  }

  // 3. Runtime API fallback
  return new Promise(function (resolve) {
    wx.request({
      url: 'https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(w),
      dataType: 'json',
      timeout: 15000,
      success: function (res) {
        var sentence = null
        if (res.statusCode === 200 && Array.isArray(res.data) && res.data.length > 0) {
          var meanings = res.data[0].meanings || []
          for (var i = 0; i < meanings.length; i++) {
            var defs = meanings[i].definitions || []
            for (var j = 0; j < defs.length; j++) {
              if (defs[j].example) {
                sentence = defs[j].example
                break
              }
            }
            if (sentence) break
          }
        }
        cache[w] = sentence || NONE_MARKER
        saveCache(cache)
        if (sentence) {
          resolve({ sentence: sentence, parts: parseParts(sentence, word), cn: null })
        } else {
          resolve(null)
        }
      },
      fail: function () {
        cache[w] = NONE_MARKER
        saveCache(cache)
        resolve(null)
      },
    })
  })
}

function parseParts(sentence, word) {
  var lower = sentence.toLowerCase()
  var wl = word.toLowerCase()
  var idx = lower.indexOf(wl)
  if (idx === -1) {
    return [{ text: sentence, hl: false }]
  }
  var parts = []
  if (idx > 0) {
    parts.push({ text: sentence.substring(0, idx), hl: false })
  }
  parts.push({ text: sentence.substring(idx, idx + word.length), hl: true })
  var after = sentence.substring(idx + word.length)
  if (after) {
    parts.push({ text: after, hl: false })
  }
  return parts
}

module.exports = {
  getExampleSentence: getExampleSentence,
}
