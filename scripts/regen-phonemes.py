"""
Re-generate phoneme audio using example words
Plays a word where the target phoneme is clearly audible,
then trims to keep only the initial phoneme sound
"""

import asyncio
import os
import sys

try:
    import edge_tts
except ImportError:
    os.system(f"{sys.executable} -m pip install edge-tts")
    import edge_tts

from pydub import AudioSegment, silence

PHONEMES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'sounds', 'phonemes')
os.makedirs(PHONEMES_DIR, exist_ok=True)

VOICE = "en-US-JennyNeural"

# IPA symbol -> (output_name, example_word, trim_ms)
# trim_ms: how many ms of audio to keep from the start of the non-silent part
PHONEMES = {
    # Short vowels
    '\u026A':  ('ih',       'sit',     350),   # ɪ
    'e':       ('eh',       'bed',     350),   # e
    '\u00E6':  ('ae',       'cat',     350),   # æ
    '\u0252':  ('open_o',   'hot',     350),   # ɒ
    '\u028C':  ('wedge',    'cup',     350),   # ʌ
    '\u028A':  ('upsilon',  'put',     350),   # ʊ
    '\u0259':  ('schwa',    'about',   300),   # ə

    # Long vowels
    'i\u02D0':       ('i_long',   'see',     400),  # iː
    '\u0251\u02D0':  ('a_long',   'car',     400),  # ɑː
    '\u0254\u02D0':  ('o_long',   'all',     400),  # ɔː
    'u\u02D0':       ('u_long',   'food',    400),  # uː
    '\u025C\u02D0':  ('er_long',  'bird',    400),  # ɜː

    # Diphthongs
    'e\u026A':       ('ay',   'day',     400),  # eɪ
    'a\u026A':       ('eye',  'my',      400),  # aɪ
    '\u0254\u026A':  ('oy',   'boy',     400),  # ɔɪ
    'a\u028A':       ('ow',   'how',     400),  # aʊ
    'o\u028A':       ('oh',   'go',      400),  # oʊ
    '\u026A\u0259':  ('eer',  'here',    400),  # ɪə (may not exist in US English)
    'e\u0259':       ('air',  'air',     400),  # eə
    '\u028A\u0259':  ('oor',  'tour',    400),  # ʊə

    # Consonants
    'b':       ('b',    'bat',     300),
    'd':       ('d',    'dog',     300),
    'f':       ('f',    'fun',     300),
    'g':       ('g',    'get',     300),
    'h':       ('h',    'hat',     300),
    'k':       ('k',    'cat',     300),
    'l':       ('l',    'leg',     300),
    'm':       ('m',    'map',     300),
    'n':       ('n',    'net',     300),
    'p':       ('p',    'pen',     300),
    'r':       ('r',    'red',     300),
    's':       ('s',    'sun',     300),
    't':       ('t',    'top',     300),
    'v':       ('v',    'van',     300),
    'w':       ('w',    'win',     300),
    'z':       ('z',    'zoo',     300),
    '\u0283':  ('esh',  'ship',    350),   # ʃ
    '\u0292':  ('ezh',  'vision',  350),   # ʒ
    '\u03B8':  ('theta','think',   350),   # θ
    '\u00F0':  ('eth',  'this',    350),   # ð
    '\u014B':  ('eng',  'sing',    350),   # ŋ
    'j':       ('y',    'yes',     300),
    't\u0283': ('ch',   'church',  350),   # tʃ
    'd\u0292': ('j',    'judge',   350),   # dʒ
}


async def generate_word_audio(word):
    """Generate TTS audio for a word."""
    tmp_path = os.path.join(PHONEMES_DIR, f"_tmp_{word}.mp3")
    ssml = f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="{VOICE}"><prosody rate="-15%">{word}</prosody></voice></speak>'
    try:
        communicate = edge_tts.Communicate(ssml, VOICE)
        await communicate.save(tmp_path)
        return tmp_path if os.path.exists(tmp_path) and os.path.getsize(tmp_path) > 500 else None
    except Exception as e:
        print(f"  [error] TTS for '{word}': {e}")
        return None


def extract_phoneme(raw_path, output_path, trim_ms):
    """Extract just the initial phoneme sound from a word recording."""
    try:
        audio = AudioSegment.from_mp3(raw_path)
        audio = audio.set_channels(1).set_frame_rate(16000)

        # Find the start of actual sound
        nonsilent = silence.detect_nonsilent(audio, min_silence_len=20, silence_thresh=-38)
        if not nonsilent:
            return False

        start = max(0, nonsilent[0][0] - 10)
        end = min(len(audio), start + trim_ms)

        # If the audio is shorter than trim_ms, use the whole thing
        if end - start < 100:
            end = min(len(audio), start + 500)

        trimmed = audio[start:end]

        # Add tiny padding
        pad = AudioSegment.silent(duration=20)
        trimmed = pad + trimmed + pad

        trimmed.export(output_path, format='mp3', bitrate='32k')
        return os.path.exists(output_path) and os.path.getsize(output_path) > 200
    except Exception as e:
        print(f"  [error] extract: {e}")
        return False


async def process_phoneme(ipa_symbol, name, word, trim_ms):
    """Generate and process a single phoneme."""
    output_path = os.path.join(PHONEMES_DIR, f"{name}.mp3")

    raw_path = await generate_word_audio(word)
    if not raw_path:
        print(f"  [fail] {name} ({word})")
        return False

    if extract_phoneme(raw_path, output_path, trim_ms):
        os.remove(raw_path)
        size = os.path.getsize(output_path)
        print(f"  [ok] {name}.mp3 ({size//1024}KB) <- '{word}'")
        return True
    else:
        os.remove(raw_path)
        print(f"  [fail] {name} extraction")
        return False


async def main():
    keys = list(PHONEMES.keys())
    print(f"Generating {len(keys)} phoneme audio files from example words...")
    print(f"Voice: {VOICE}\n")

    success = 0
    for ipa in keys:
        name, word, trim_ms = PHONEMES[ipa]
        if await process_phoneme(ipa, name, word, trim_ms):
            success += 1
        await asyncio.sleep(0.15)

    # Generate mapping.json
    import json
    mapping = {}
    for ipa in keys:
        name = PHONEMES[ipa][0]
        fp = os.path.join(PHONEMES_DIR, f"{name}.mp3")
        if os.path.exists(fp) and os.path.getsize(fp) > 200:
            mapping[ipa] = f"/assets/sounds/phonemes/{name}.mp3"

    with open(os.path.join(PHONEMES_DIR, "mapping.json"), "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)

    total_kb = sum(os.path.getsize(os.path.join(PHONEMES_DIR, f"{PHONEMES[ipa][0]}.mp3")) for ipa in keys if os.path.exists(os.path.join(PHONEMES_DIR, f"{PHONEMES[ipa][0]}.mp3"))) // 1024
    print(f"\nDone! {success}/{len(keys)} files, Total: {total_kb}KB")


if __name__ == "__main__":
    asyncio.run(main())
