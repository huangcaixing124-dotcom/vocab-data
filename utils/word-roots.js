/**
 * 词根词缀数据加载
 * 数据格式: {word: [['text','type'], ['text','type','meaning'], ...]}
 * type: 'p'=prefix, 'r'=root, 's'=suffix
 */

var wordRootsData = null
var TYPE_MAP = { p: 'prefix', r: 'root', s: 'suffix' }

function loadWordRoots() {
  if (wordRootsData !== null) return wordRootsData
  try {
    wordRootsData = require('../../subpackages/data/word-roots.js')
    console.log('[WordRoots] Loaded:', Object.keys(wordRootsData).length, 'words')
  } catch (e) {
    console.log('[WordRoots] require failed:', e.message)
    wordRootsData = {}
  }
  return wordRootsData
}

function getWordRoot(word) {
  if (!word) return null
  var data = loadWordRoots()
  var raw = data[word.toLowerCase()]
  if (!raw || !Array.isArray(raw) || raw.length < 2) return null

  // 转换为组件需要的格式
  var parts = []
  for (var i = 0; i < raw.length; i++) {
    parts.push({
      text: raw[i][0],
      type: TYPE_MAP[raw[i][1]] || 'root',
      meaning: raw[i][2] || '',
    })
  }
  return { parts: parts }
}

module.exports = {
  loadWordRoots: loadWordRoots,
  getWordRoot: getWordRoot,
}
