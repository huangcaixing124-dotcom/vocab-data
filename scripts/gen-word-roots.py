"""
词根词缀拆解数据生成器
从词典单词中提取前缀+词根+后缀结构
"""

import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.join(SCRIPT_DIR, '..')
DICTS_DIR = os.path.join(PROJECT_DIR, 'dicts')
OUTPUT_FILE = os.path.join(DICTS_DIR, 'word-roots.json')

# 常见前缀 (按长度降序排列，优先匹配长前缀)
PREFIXES = {
    'un': '不/非',
    're': '再/重新',
    'dis': '不/否定',
    'pre': '前/预先',
    'mis': '错误/不当',
    'over': '过度/超越',
    'under': '不足/低于',
    'sub': '下/次',
    'trans': '跨越/转变',
    'inter': '之间/互相',
    'non': '非/不',
    'anti': '反/抗',
    'de': '去除/向下',
    'auto': '自动/自身',
    'bi': '双/二',
    'multi': '多',
    'semi': '半',
    'uni': '单一',
    'tri': '三',
    'poly': '多',
    'mono': '单/独',
    'hyper': '超/过度',
    'hypo': '低于/不足',
    'super': '超/上',
    'ultra': '超/极',
    'micro': '微/小',
    'macro': '大/宏观',
    'mini': '小/迷你',
    'mega': '大/百万',
    'tele': '远距离',
    'in': '不/向内',
    'im': '不/向内',
    'ir': '不',
    'il': '不',
    'en': '使/置于',
    'em': '使/置于',
    'ex': '出/外',
    'pro': '向前/支持',
    'con': '共同/一起',
    'com': '共同/一起',
    'col': '共同/一起',
    'cor': '共同/一起',
    'co': '共同',
    'de': '去除/向下',
    'in': '不/向内',
    'out': '超过/外',
    'with': '向后/反对',
    'fore': '前/预先',
    'mis': '错误',
    'self': '自/自身',
    'step': '继/继',
    'un': '不/非',
    'post': '后/之后',
    'counter': '反/对',
    'circum': '环绕',
    'extra': '超出/额外',
    'intra': '内/内部',
    'multi': '多',
    'super': '超/上',
    'sur': '超/上',
    'sub': '下/次',
    'sup': '下/次',
    'sus': '下/次',
    'in': '不/向内',
    'im': '不/向内',
    'ir': '不',
    'il': '不',
    'non': '非/不',
    'un': '不/非',
    'de': '去除/向下',
    'dis': '不/否定',
    're': '再/重新',
    'pre': '前/预先',
    'pro': '向前/支持',
    'con': '共同/一起',
    'com': '共同/一起',
    'ex': '出/外',
    'en': '使/置于',
    'em': '使/置于',
    'out': '超过/外',
    'over': '过度/超越',
    'under': '不足/低于',
    'sub': '下/次',
    'trans': '跨越/转变',
    'inter': '之间/互相',
    'mis': '错误/不当',
    'auto': '自动/自身',
    'anti': '反/抗',
    'bi': '双/二',
    'multi': '多',
    'semi': '半',
    'uni': '单一',
    'tri': '三',
    'tele': '远距离',
    'super': '超/上',
    'hyper': '超/过度',
    'micro': '微/小',
    'macro': '大/宏观',
    'mega': '大/百万',
    'ultra': '超/极',
    'mini': '小/迷你',
    'fore': '前/预先',
    'counter': '反/对',
    'circum': '环绕',
    'extra': '超出/额外',
    'intra': '内/内部',
    'sur': '超/上',
    'sup': '下/次',
    'sus': '下/次',
    'post': '后/之后',
    'self': '自/自身',
    'step': '继/继',
    'with': '向后/反对',
    'pro': '向前/支持',
    'in': '不/向内',
    'im': '不/向内',
    'ir': '不',
    'il': '不',
    'en': '使/置于',
    'em': '使/置于',
    'ex': '出/外',
    'co': '共同',
}

# 常见后缀 (按长度降序排列)
SUFFIXES = {
    'ation': '名词后缀(动作/状态)',
    'tion': '名词后缀(动作/状态)',
    'sion': '名词后缀(动作/状态)',
    'ment': '名词后缀(结果/状态)',
    'ness': '名词后缀(性质/状态)',
    'able': '形容词后缀(可…的)',
    'ible': '形容词后缀(可…的)',
    'ful': '形容词后缀(充满…的)',
    'less': '形容词后缀(无…的)',
    'ous': '形容词后缀(…的)',
    'ive': '形容词后缀(…的)',
    'al': '形容词后缀(…的)',
    'ial': '形容词后缀(…的)',
    'ly': '副词后缀(…地)',
    'er': '名词后缀(做…的人)',
    'or': '名词后缀(做…的人)',
    'ist': '名词后缀(…者)',
    'ize': '动词后缀(使…化)',
    'ise': '动词后缀(使…化)',
    'ify': '动词后缀(使…化)',
    'ity': '名词后缀(性质/状态)',
    'ence': '名词后缀(性质/状态)',
    'ance': '名词后缀(性质/状态)',
    'ship': '名词后缀(状态/技能)',
    'hood': '名词后缀(状态/时期)',
    'dom': '名词后缀(领域/状态)',
    'ism': '名词后缀(主义/学说)',
    'ary': '形容词后缀(与…有关)',
    'ory': '形容词后缀(与…有关)',
    'ful': '形容词后缀(充满…的)',
    'less': '形容词后缀(无…的)',
    'ness': '名词后缀(性质/状态)',
    'ment': '名词后缀(结果/状态)',
    'tion': '名词后缀(动作/状态)',
    'sion': '名词后缀(动作/状态)',
    'able': '形容词后缀(可…的)',
    'ible': '形容词后缀(可…的)',
    'ous': '形容词后缀(…的)',
    'ive': '形容词后缀(…的)',
    'al': '形容词后缀(…的)',
    'ly': '副词后缀(…地)',
    'er': '名词后缀(做…的人)',
    'or': '名词后缀(做…的人)',
    'ist': '名词后缀(…者)',
    'ize': '动词后缀(使…化)',
    'ify': '动词后缀(使…化)',
    'ity': '名词后缀(性质/状态)',
    'ence': '名词后缀(性质/状态)',
    'ance': '名词后缀(性质/状态)',
    'ship': '名词后缀(状态/技能)',
    'hood': '名词后缀(状态/时期)',
    'dom': '名词后缀(领域/状态)',
    'ism': '名词后缀(主义/学说)',
}

# 去重并按长度排序
PREFIX_LIST = sorted(set(PREFIXES.keys()), key=len, reverse=True)
SUFFIX_LIST = sorted(set(SUFFIXES.keys()), key=len, reverse=True)


def load_all_words():
    """Load all unique words from dictionaries."""
    words = set()
    for fname in os.listdir(DICTS_DIR):
        if fname.endswith('.json') and fname != 'sentence-data.json' and fname != 'word-roots.json':
            fp = os.path.join(DICTS_DIR, fname)
            with open(fp, 'r', encoding='utf-8') as f:
                data = json.load(f)
            for entry in data:
                if isinstance(entry, dict) and entry.get('name'):
                    words.add(entry['name'].strip().lower())
    return sorted(words)


def decompose_word(word):
    """
    Try to decompose a word into prefix + root + suffix.
    Returns dict with parts or None if can't decompose.
    """
    word = word.lower()
    if len(word) < 4:
        return None  # Too short to decompose

    best_result = None
    best_score = 0

    # Try all prefix lengths
    for prefix in PREFIX_LIST:
        if not word.startswith(prefix):
            continue
        remaining_after_prefix = word[len(prefix):]
        if len(remaining_after_prefix) < 2:
            continue

        # Try all suffix lengths on the remaining part
        for suffix in SUFFIX_LIST:
            if not remaining_after_prefix.endswith(suffix):
                continue
            root = remaining_after_prefix[:-len(suffix)]
            if len(root) < 2:
                continue

            # Score: prefer longer prefix + suffix, and shorter root
            score = len(prefix) + len(suffix) - len(root) * 0.5
            if score > best_score:
                best_score = score
                best_result = {
                    'parts': [
                        {'text': prefix, 'type': 'prefix', 'meaning': PREFIXES[prefix]},
                        {'text': root, 'type': 'root', 'meaning': ''},
                        {'text': suffix, 'type': 'suffix', 'meaning': SUFFIXES[suffix]},
                    ]
                }

    # Also try prefix only (no suffix)
    for prefix in PREFIX_LIST:
        if not word.startswith(prefix):
            continue
        root = word[len(prefix):]
        if len(root) < 3:
            continue
        score = len(prefix) * 1.5
        if score > best_score:
            best_score = score
            best_result = {
                'parts': [
                    {'text': prefix, 'type': 'prefix', 'meaning': PREFIXES[prefix]},
                    {'text': root, 'type': 'root', 'meaning': ''},
                ]
            }

    # Also try suffix only (no prefix)
    for suffix in SUFFIX_LIST:
        if not word.endswith(suffix):
            continue
        root = word[:-len(suffix)]
        if len(root) < 3:
            continue
        score = len(suffix) * 1.2
        if score > best_score:
            best_score = score
            best_result = {
                'parts': [
                    {'text': root, 'type': 'root', 'meaning': ''},
                    {'text': suffix, 'type': 'suffix', 'meaning': SUFFIXES[suffix]},
                ]
            }

    return best_result


def main():
    words = load_all_words()
    print(f'Loaded {len(words)} unique words')

    result = {}
    decomposed = 0
    for word in words:
        parts = decompose_word(word)
        if parts:
            result[word] = parts
            decomposed += 1
        else:
            result[word] = None

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False)

    size = os.path.getsize(OUTPUT_FILE)
    print(f'Generated: {OUTPUT_FILE}')
    print(f'Total words: {len(result)}')
    print(f'Decomposed: {decomposed} ({decomposed*100//len(result)}%)')
    print(f'File size: {size//1024}KB')

    # Show examples
    examples = ['unhappiness', 'rewrite', 'disappear', 'beautiful', 'teleport',
                'impossible', 'uncomfortable', 'international', 'conversation']
    print('\nExamples:')
    for ex in examples:
        if ex in result and result[ex]:
            parts_str = ' + '.join([f"{p['text']}({p['meaning']})" for p in result[ex]['parts']])
            print(f'  {ex}: {parts_str}')
        else:
            print(f'  {ex}: (not decomposed)')


if __name__ == '__main__':
    main()
