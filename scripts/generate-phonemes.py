"""
IPA Phoneme Audio Generator using Edge-TTS
Generates high-quality phoneme audio files using Microsoft Neural TTS

Usage: python scripts/generate-phonemes.py
"""

import asyncio
import os
import sys

try:
    import edge_tts
except ImportError:
    print("Installing edge-tts...")
    os.system(f"{sys.executable} -m pip install edge-tts")
    import edge_tts

PHONEMES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'sounds', 'phonemes')
os.makedirs(PHONEMES_DIR, exist_ok=True)

# Voice: Jenny (US English) - clear, natural neural voice
VOICE = "en-US-JennyNeural"

# Phoneme -> SSML phoneme tag mapping
# Using SSML <phoneme> tag with alphabet="ipa" to directly specify IPA pronunciation
PHONEMES = {
    # Short vowels
    'ih': '\u026A',           # ɪ  as in "bit"
    'eh': 'e',                # e  as in "bed"
    'ae': '\u00E6',           # æ  as in "bat"
    'open_o': '\u0252',       # ɒ  as in "lot" (British)
    'wedge': '\u028C',        # ʌ  as in "cut"
    'upsilon': '\u028A',      # ʊ  as in "put"
    'schwa': '\u0259',        # ə  as in "about"

    # Long vowels
    'i_long': 'i\u02D0',      # iː as in "see"
    'a_long': '\u0251\u02D0', # ɑː as in "father"
    'o_long': '\u0254\u02D0', # ɔː as in "law"
    'u_long': 'u\u02D0',      # uː as in "food"
    'er_long': '\u025C\u02D0',# ɜː as in "bird"

    # Diphthongs
    'ay': 'e\u026A',          # eɪ as in "say"
    'eye': 'a\u026A',         # aɪ as in "my"
    'oy': '\u0254\u026A',     # ɔɪ as in "boy"
    'ow': 'a\u028A',          # aʊ as in "now"
    'oh': 'o\u028A',          # oʊ as in "go"
    'eer': '\u026A\u0259',    # ɪə as in "near"
    'air': 'e\u0259',         # eə as in "square"
    'oor': '\u028A\u0259',    # ʊə as in "tour"

    # Consonants
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
    'r': '\u0279',            # ɹ (approximant r)
    's': 's',
    't': 't',
    'v': 'v',
    'w': 'w',
    'z': 'z',
    'esh': '\u0283',          # ʃ  as in "ship"
    'ezh': '\u0292',          # ʒ  as in "vision"
    'theta': '\u03B8',        # θ  as in "think"
    'eth': '\u00F0',          # ð  as in "this"
    'eng': '\u014B',          # ŋ  as in "sing"
    'y': 'j',                 # j  as in "yes"
    'ch': 't\u0283',          # tʃ as in "church"
    'j': 'd\u0292',           # dʒ as in "judge"
}

# Fallback: example words for each phoneme (used if SSML phoneme tag fails)
FALLBACK_WORDS = {
    'ih': 'bit',
    'eh': 'bed',
    'ae': 'bat',
    'open_o': 'lot',
    'wedge': 'cut',
    'upsilon': 'put',
    'schwa': 'about',
    'i_long': 'see',
    'a_long': 'father',
    'o_long': 'law',
    'u_long': 'food',
    'er_long': 'bird',
    'ay': 'say',
    'eye': 'my',
    'oy': 'boy',
    'ow': 'now',
    'oh': 'go',
    'eer': 'near',
    'air': 'square',
    'oor': 'tour',
    'b': 'bat',
    'd': 'dog',
    'f': 'fun',
    'g': 'get',
    'h': 'hat',
    'k': 'cat',
    'l': 'leg',
    'm': 'map',
    'n': 'net',
    'p': 'pen',
    'r': 'red',
    's': 'sun',
    't': 'top',
    'v': 'van',
    'w': 'win',
    'z': 'zoo',
    'esh': 'ship',
    'ezh': 'vision',
    'theta': 'think',
    'eth': 'this',
    'eng': 'sing',
    'y': 'yes',
    'ch': 'church',
    'j': 'judge',
}


async def generate_phoneme(name, ipa_symbol, use_word_fallback=False):
    """Generate a single phoneme audio file."""
    output_path = os.path.join(PHONEMES_DIR, f"{name}.mp3")

    if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
        print(f"  [skip] {name}.mp3 (already exists)")
        return True

    try:
        if use_word_fallback:
            # Use example word with slow rate
            word = FALLBACK_WORDS.get(name, name)
            ssml = f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
                <voice name="{VOICE}">
                    <prosody rate="-30%" pitch="+0Hz">
                        {word}
                    </prosody>
                </voice>
            </speak>'''
        else:
            # Use SSML phoneme tag for precise IPA pronunciation
            ssml = f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
                <voice name="{VOICE}">
                    <prosody rate="-40%" pitch="+0Hz">
                        <phoneme alphabet="ipa" ph="{ipa_symbol}"> </phoneme>
                    </prosody>
                </voice>
            </speak>'''

        communicate = edge_tts.Communicate(ssml, VOICE)
        await communicate.save(output_path)

        if os.path.exists(output_path) and os.path.getsize(output_path) > 500:
            size_kb = os.path.getsize(output_path) / 1024
            print(f"  [ok] {name}.mp3 ({size_kb:.1f} KB)")
            return True
        else:
            print(f"  [fail] {name}.mp3 (file too small or missing)")
            if os.path.exists(output_path):
                os.remove(output_path)
            return False

    except Exception as e:
        print(f"  [error] {name}: {e}")
        if os.path.exists(output_path):
            os.remove(output_path)
        return False


async def main():
    names = list(PHONEMES.keys())
    print(f"Generating {len(names)} IPA phoneme audio files using Edge-TTS...")
    print(f"Voice: {VOICE}")
    print(f"Output: {PHONEMES_DIR}\n")

    success = 0
    fail = 0

    # First pass: try SSML phoneme tags
    print("--- Pass 1: SSML phoneme tags ---")
    failed_names = []
    for name in names:
        ipa = PHONEMES[name]
        ok = await generate_phoneme(name, ipa, use_word_fallback=False)
        if ok:
            success += 1
        else:
            failed_names.append(name)
            fail += 1
        await asyncio.sleep(0.2)

    # Second pass: fallback to example words for failed phonemes
    if failed_names:
        print(f"\n--- Pass 2: Word fallback for {len(failed_names)} failed phonemes ---")
        fail = 0
        for name in failed_names:
            ipa = PHONEMES[name]
            ok = await generate_phoneme(name, ipa, use_word_fallback=True)
            if ok:
                success += 1
                fail -= 1  # undo the fail count from first pass
            await asyncio.sleep(0.2)

    print(f"\nDone! Success: {success}, Failed: {fail + len(failed_names)}")

    # Generate mapping.json
    generate_mapping()


def generate_mapping():
    """Generate mapping.json for pronunciation.js"""
    import json

    mapping = {}
    for name, ipa in PHONEMES.items():
        filepath = os.path.join(PHONEMES_DIR, f"{name}.mp3")
        if os.path.exists(filepath) and os.path.getsize(filepath) > 500:
            mapping[ipa] = f"/assets/sounds/phonemes/{name}.mp3"

    mapping_path = os.path.join(PHONEMES_DIR, "mapping.json")
    with open(mapping_path, "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)

    print(f"\nMapping saved to: {mapping_path}")
    print(f"Total mapped: {len(mapping)}")


if __name__ == "__main__":
    asyncio.run(main())
