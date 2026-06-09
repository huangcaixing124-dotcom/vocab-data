"""
批量生成课本词典 - 基于用户提供数据
"""
import json, os, re

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'subpackages', 'data')

def parse_and_save(textbook_id, text):
    units = {}
    current_unit = None
    words = []
    for line in text.strip().split('\n'):
        line = line.strip()
        if not line:
            continue
        unit_match = re.match(r'^Unit\s*(\d+)\s+(.+)', line)
        if unit_match:
            if current_unit:
                units[current_unit] = words
            current_unit = f"Unit {unit_match.group(1)} {unit_match.group(2)}"
            words = []
            continue
        word_match = re.match(r'^(.+?)\s+/([^/]+)/\s*(.*)', line)
        if word_match and current_unit:
            words.append({
                'name': word_match.group(1).strip(),
                'trans': [word_match.group(3).strip()] if word_match.group(3).strip() else [],
                'usphone': word_match.group(2).strip(),
                'ukphone': '',
            })
    if current_unit:
        units[current_unit] = words

    all_words = []
    for unit_words in units.values():
        all_words.extend(unit_words)

    filepath = os.path.join(OUTPUT_DIR, f'{textbook_id}.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(all_words, f, ensure_ascii=False, separators=(',', ':'))

    print(f"  {textbook_id}: {len(all_words)} words, {os.path.getsize(filepath)//1024}KB")
    return len(all_words)

# Load all input files
total = 0
for fname in sorted(os.listdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'textbook_input'))):
    if fname.endswith('.txt'):
        textbook_id = fname.replace('.txt', '')
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'textbook_input', fname), 'r', encoding='utf-8') as f:
            text = f.read()
        total += parse_and_save(textbook_id, text)

print(f"\nTotal: {total} words")
