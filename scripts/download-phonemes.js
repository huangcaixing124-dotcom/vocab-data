/**
 * IPA Phoneme Audio Downloader
 * Downloads IPA phoneme audio files from Wikimedia Commons
 *
 * Usage: node scripts/download-phonemes.js
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

const PHONEMES_DIR = path.join(__dirname, '..', 'assets', 'sounds', 'phonemes')

// IPA phoneme -> Wikimedia Commons filename mapping
// Each entry maps an IPA symbol to its Wikimedia Commons filename (without .ogg extension)
const PHONEME_FILES = {
  // Short vowels
  '\u026A': 'RP_i\u026A.ogg',           // ɪ
  'e': 'en-us-e.ogg',                     // e (use American English version)
  '\u00E6': 'en-us-\u00E6.ogg',          // æ
  '\u0252': 'RP_\u0252.ogg',             // ɒ
  '\u028C': 'en-us-\u028C.ogg',          // ʌ
  '\u028A': 'en-us-\u028A.ogg',          // ʊ
  '\u0259': 'en-us-\u0259.ogg',          // ə

  // Long vowels
  'i\u02D0': 'en-us-i\u02D0.ogg',       // iː
  '\u0251\u02D0': 'en-us-\u0251\u02D0.ogg', // ɑː
  '\u0254\u02D0': 'en-us-\u0254\u02D0.ogg', // ɔː
  'u\u02D0': 'en-us-u\u02D0.ogg',       // uː
  '\u025C\u02D0': 'en-us-\u025C\u02D0.ogg', // ɜː

  // Diphthongs
  'e\u026A': 'en-us-e\u026A.ogg',       // eɪ
  'a\u026A': 'en-us-a\u026A.ogg',       // aɪ
  '\u0254\u026A': 'en-us-\u0254\u026A.ogg', // ɔɪ
  'a\u028A': 'en-us-a\u028A.ogg',       // aʊ
  '\u0259\u028A': 'en-us-o\u028A.ogg',  // əʊ (file may use oʊ)
  '\u026A\u0259': 'en-us-\u026A\u0259.ogg', // ɪə
  'e\u0259': 'en-us-e\u0259.ogg',       // eə
  '\u028A\u0259': 'en-us-\u028A\u0259.ogg', // ʊə

  // Consonants
  'b': 'en-us-b.ogg',
  'd': 'en-us-d.ogg',
  'f': 'en-us-f.ogg',
  'g': 'en-us-g.ogg',
  'h': 'en-us-h.ogg',
  'k': 'en-us-k.ogg',
  'l': 'en-us-l.ogg',
  'm': 'en-us-m.ogg',
  'n': 'en-us-n.ogg',
  'p': 'en-us-p.ogg',
  'r': 'en-us-r.ogg',
  's': 'en-us-s.ogg',
  't': 'en-us-t.ogg',
  'v': 'en-us-v.ogg',
  'w': 'en-us-w.ogg',
  'z': 'en-us-z.ogg',
  '\u0283': 'en-us-\u0283.ogg',         // ʃ
  '\u0292': 'en-us-\u0292.ogg',         // ʒ
  '\u03B8': 'en-us-\u03B8.ogg',         // θ
  '\u00F0': 'en-us-\u00F0.ogg',         // ð
  '\u014B': 'en-us-\u014B.ogg',         // ŋ
  'j': 'en-us-j.ogg',
  't\u0283': 'en-us-t\u0283.ogg',       // tʃ
  'd\u0292': 'en-us-d\u0292.ogg',       // dʒ
}

// Output filename mapping (IPA symbol -> readable filename without extension)
const OUTPUT_NAMES = {
  '\u026A': 'ih',           // ɪ
  'e': 'eh',                // e
  '\u00E6': 'ae',           // æ
  '\u0252': 'open_o',       // ɒ
  '\u028C': 'wedge',        // ʌ
  '\u028A': 'upsilon',      // ʊ
  '\u0259': 'schwa',        // ə
  'i\u02D0': 'i_long',      // iː
  '\u0251\u02D0': 'a_long', // ɑː
  '\u0254\u02D0': 'o_long', // ɔː
  'u\u02D0': 'u_long',      // uː
  '\u025C\u02D0': 'er_long',// ɜː
  'e\u026A': 'ay',          // eɪ
  'a\u026A': 'eye',         // aɪ
  '\u0254\u026A': 'oy',     // ɔɪ
  'a\u028A': 'ow',          // aʊ
  '\u0259\u028A': 'oh',     // əʊ
  '\u026A\u0259': 'eer',    // ɪə
  'e\u0259': 'air',         // eə
  '\u028A\u0259': 'oor',    // ʊə
  'b': 'b',
  'd': 'd',
  'f': 'f',
  'g': 'g',
  'h': 'h',
  'k': 'k',
  'l': 'l',
  'm': 'm',
  'n': 'n',
  'p': 'p',
  'r': 'r',
  's': 's',
  't': 't',
  'v': 'v',
  'w': 'w',
  'z': 'z',
  '\u0283': 'esh',          // ʃ
  '\u0292': 'ezh',          // ʒ
  '\u03B8': 'theta',        // θ
  '\u00F0': 'eth',          // ð
  '\u014B': 'eng',          // ŋ
  'j': 'y',
  't\u0283': 'ch',          // tʃ
  'd\u0292': 'j',           // dʒ
}

function httpsGet(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, { headers: { 'User-Agent': 'PhonemeDownloader/1.0' } }, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpsGet(res.headers.location).then(resolve).catch(reject)
        return
      }
      var chunks = []
      res.on('data', function (chunk) { chunks.push(chunk) })
      res.on('end', function () { resolve({ status: res.statusCode, data: Buffer.concat(chunks) }) })
      res.on('error', reject)
    }).on('error', reject)
  })
}

function httpsGetJSON(url) {
  return httpsGet(url).then(function (res) {
    return JSON.parse(res.data.toString('utf8'))
  })
}

async function queryWikimediaCommons(filename) {
  var url = 'https://commons.wikimedia.org/w/api.php?action=query&titles=File:' +
    encodeURIComponent(filename) + '&prop=imageinfo&iiprop=url&format=json'
  var data = await httpsGetJSON(url)
  var pages = data.query.pages
  var pageId = Object.keys(pages)[0]
  if (pageId === '-1' || !pages[pageId].imageinfo) return null
  return pages[pageId].imageinfo[0].url
}

async function downloadPhoneme(ipaSymbol, wikiFilename, outputName) {
  var outputPath = path.join(PHONEMES_DIR, outputName + '.ogg')

  // Skip if already downloaded
  if (fs.existsSync(outputPath)) {
    console.log('  [skip] ' + outputName + ' (already exists)')
    return true
  }

  try {
    console.log('  [query] ' + outputName + ' (' + wikiFilename + ')')
    var downloadUrl = await queryWikimediaCommons(wikiFilename)
    if (!downloadUrl) {
      console.log('  [warn] Not found on Wikimedia: ' + wikiFilename)
      return false
    }

    console.log('  [download] ' + downloadUrl)
    var result = await httpsGet(downloadUrl)
    if (result.status === 200 && result.data.length > 0) {
      fs.writeFileSync(outputPath, result.data)
      console.log('  [ok] ' + outputName + '.ogg (' + (result.data.length / 1024).toFixed(1) + ' KB)')
      return true
    } else {
      console.log('  [fail] HTTP ' + result.status)
      return false
    }
  } catch (err) {
    console.log('  [error] ' + err.message)
    return false
  }
}

async function main() {
  if (!fs.existsSync(PHONEMES_DIR)) {
    fs.mkdirSync(PHONEMES_DIR, { recursive: true })
  }

  var ipaKeys = Object.keys(PHONEME_FILES)
  console.log('Downloading ' + ipaKeys.length + ' IPA phoneme audio files from Wikimedia Commons...\n')

  var success = 0
  var fail = 0

  for (var i = 0; i < ipaKeys.length; i++) {
    var ipa = ipaKeys[i]
    var wikiFile = PHONEME_FILES[ipa]
    var outName = OUTPUT_NAMES[ipa]
    var ok = await downloadPhoneme(ipa, wikiFile, outName)
    if (ok) success++
    else fail++
    // Small delay to be polite to the API
    await new Promise(function (r) { setTimeout(r, 300) })
  }

  console.log('\nDone! Success: ' + success + ', Failed: ' + fail)
  console.log('Files saved to: ' + PHONEMES_DIR)

  // Generate the mapping file for pronunciation.js
  generateMapping()
}

function generateMapping() {
  var mapping = {}
  var ipaKeys = Object.keys(PHONEME_FILES)
  for (var i = 0; i < ipaKeys.length; i++) {
    var ipa = ipaKeys[i]
    var outName = OUTPUT_NAMES[ipa]
    var filePath = path.join(PHONEMES_DIR, outName + '.ogg')
    if (fs.existsSync(filePath)) {
      mapping[ipa] = '/assets/sounds/phonemes/' + outName + '.ogg'
    }
  }

  var mappingPath = path.join(PHONEMES_DIR, 'mapping.json')
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), 'utf8')
  console.log('\nMapping saved to: ' + mappingPath)
  console.log('Total mapped: ' + Object.keys(mapping).length)
}

main().catch(function (err) {
  console.error('Fatal error:', err)
  process.exit(1)
})
