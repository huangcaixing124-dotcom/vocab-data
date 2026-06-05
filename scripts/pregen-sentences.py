"""
预生成例句数据
1. 读取所有字典文件中的单词
2. 从 dictionaryapi.dev 获取例句
3. 从 MyMemory API 获取中文翻译
4. 保存到 dicts/sentence-data.json

运行: python scripts/pregen-sentences.py
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.join(SCRIPT_DIR, '..')
DICTS_DIR = os.path.join(PROJECT_DIR, 'dicts')
OUTPUT_FILE = os.path.join(DICTS_DIR, 'sentence-data.json')

# Rate limiting
DICT_DELAY = 0.3   # seconds between dictionary API calls
TRANS_DELAY = 0.2   # seconds between translation API calls


def load_all_words():
    """Load all unique words from dictionary files."""
    words = set()
    for fname in os.listdir(DICTS_DIR):
        if fname.endswith('.json') and fname != 'sentence-data.json':
            fp = os.path.join(DICTS_DIR, fname)
            with open(fp, 'r', encoding='utf-8') as f:
                data = json.load(f)
            for entry in data:
                if isinstance(entry, dict) and entry.get('name'):
                    words.add(entry['name'].strip().lower())
    return sorted(words)


def fetch_example(word, retries=2):
    """Fetch example sentence from dictionaryapi.dev."""
    url = 'https://api.dictionaryapi.dev/api/v2/entries/en/' + urllib.parse.quote(word)
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                if isinstance(data, list) and len(data) > 0:
                    for meaning in data[0].get('meanings', []):
                        for defn in meaning.get('definitions', []):
                            if defn.get('example'):
                                return defn['example']
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1)
    return None


def translate_sentence(text, retries=2):
    """Translate English sentence to Chinese using MyMemory API."""
    url = 'https://api.mymemory.translated.net/get?q=' + urllib.parse.quote(text) + '&langpair=en|zh'
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                if data.get('responseData', {}).get('translatedText'):
                    return data['responseData']['translatedText']
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1)
    return None


def main():
    words = load_all_words()
    print(f'Found {len(words)} unique words')

    # Load existing data to resume
    result = {}
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            result = json.load(f)
        print(f'Resumed {len(result)} existing entries')

    total = len(words)
    fetched = 0
    translated = 0
    skipped = 0

    for i, word in enumerate(words):
        # Skip if already done
        if word in result and result[word].get('sentence'):
            skipped += 1
            continue

        # Fetch example
        sentence = fetch_example(word)
        time.sleep(DICT_DELAY)

        if not sentence:
            result[word] = {'sentence': '', 'cn': ''}
            fetched += 1
            if (fetched % 100) == 0:
                print(f'  [{i+1}/{total}] fetched={fetched}, translated={translated}, skipped={skipped}')
            continue

        # Translate
        cn = translate_sentence(sentence)
        time.sleep(TRANS_DELAY)

        result[word] = {'sentence': sentence, 'cn': cn or ''}
        fetched += 1
        translated += 1

        if (fetched % 50) == 0:
            print(f'  [{i+1}/{total}] fetched={fetched}, translated={translated}, skipped={skipped}')
            # Save progress
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False)

    # Final save
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False)

    print(f'\nDone! Total: {len(result)} entries')
    print(f'  With sentences: {sum(1 for v in result.values() if v.get("sentence"))}')
    print(f'  With translations: {sum(1 for v in result.values() if v.get("cn"))}')
    print(f'  Output: {OUTPUT_FILE}')

    # Check file size
    size = os.path.getsize(OUTPUT_FILE)
    print(f'  File size: {size/1024:.0f} KB')


if __name__ == '__main__':
    main()
