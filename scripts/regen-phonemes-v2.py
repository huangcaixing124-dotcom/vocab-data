"""
重新生成音素音频 - 使用更长例词 + VAD 精确裁剪
确保每个音素的音频包含完整发音
"""

import asyncio
import os
import sys
import json

try:
    import edge_tts
except ImportError:
    os.system(f"{sys.executable} -m pip install edge-tts")
    import edge_tts

from pydub import AudioSegment, silence

PHONEMES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'sounds', 'phonemes')
VOICE = "en-US-JennyNeural"

# 用更长、更清晰的例词，裁剪到 [start_ms, end_ms] 区间
# 每个音素都选择最能体现该音的单词和时间段
PHONEMES = {
    # Short vowels - 从单词中间裁剪，确保包含完整元音
    '\u026A':  ('ih',       'fitness',   200, 500),   # ɪ - "fit" 的中间部分
    'e':       ('eh',       'bedroom',   150, 450),   # e
    '\u00E6':  ('ae',       'hamster',   150, 500),   # æ
    '\u0252':  ('open_o',   'hotdog',    150, 450),   # ɒ
    '\u028C':  ('wedge',    'brother',   150, 450),   # ʌ
    '\u028A':  ('upsilon',  'putting',   150, 450),   # ʊ
    '\u0259':  ('schwa',    'about',     200, 500),   # ə

    # Long vowels
    'i\u02D0':       ('i_long',   'believe',   200, 600),  # iː
    '\u0251\u02D0':  ('a_long',   'father',    200, 600),  # ɑː
    '\u0254\u02D0':  ('o_long',   'hallway',   150, 550),  # ɔː
    'u\u02D0':       ('u_long',   'moonlight', 100, 550),  # uː
    '\u025C\u02D0':  ('er_long',  'birdsong',  200, 600),  # ɜː

    # Diphthongs
    'e\u026A':       ('ay',   'daytime',   100, 550),  # eɪ
    'a\u026A':       ('eye',  'diamond',   100, 550),  # aɪ
    '\u0254\u026A':  ('oy',   'oyster',    100, 550),  # ɔɪ
    'a\u028A':       ('ow',   'household', 100, 550),  # aʊ
    'o\u028A':       ('oh',   'overall',   100, 550),  # oʊ
    '\u026A\u0259':  ('eer',  'engineer',  200, 650),  # ɪə
    'e\u0259':       ('air',  'airplane',  100, 500),  # eə
    '\u028A\u0259':  ('oor',  'tourism',   150, 600),  # ʊə

    # Consonants - 爆破音需要包含除阻阶段
    'b':       ('b',    'bubble',    150, 500),
    'd':       ('d',    'dinner',    150, 500),
    'f':       ('f',    'fifteen',   150, 500),
    'g':       ('g',    'garden',    150, 500),
    'h':       ('h',    'hello',     150, 500),
    'k':       ('k',    'kitchen',   150, 500),
    'l':       ('l',    'lemon',     150, 500),
    'm':       ('m',    'morning',   150, 500),
    'n':       ('n',    'number',    150, 500),
    'p':       ('p',    'pepper',    150, 500),
    'r':       ('r',    'running',   150, 500),
    's':       ('s',    'sunset',    150, 500),
    't':       ('t',    'tomorrow',  150, 500),
    'v':       ('v',    'very',      150, 500),
    'w':       ('w',    'water',     150, 500),
    'z':       ('z',    'zodiac',    150, 500),
    '\u0283':  ('esh',  'shelter',   150, 550),   # ʃ
    '\u0292':  ('ezh',  'measure',   150, 550),   # ʒ
    '\u03B8':  ('theta','thousand',  150, 550),   # θ
    '\u00F0':  ('eth',  'weather',   150, 550),   # ð
    '\u014B':  ('eng',  'morning',   350, 650),   # ŋ - 取 "ng" 部分
    'j':       ('y',    'yellow',    150, 500),
    't\u0283': ('ch',   'churchill', 100, 500),   # tʃ
    'd\u0292': ('j',    'judgment',  100, 500),   # dʒ
}


async def generate_one(ipa, name, word, start_ms, end_ms, retries=2):
    """Generate and trim a single phoneme audio."""
    out_path = os.path.join(PHONEMES_DIR, f'{name}.mp3')
    tmp_path = os.path.join(PHONEMES_DIR, f'_tmp_{name}.mp3')

    for attempt in range(retries):
        try:
            ssml = f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="{VOICE}"><prosody rate="-10%">{word}</prosody></voice></speak>'
            comm = edge_tts.Communicate(ssml, VOICE)
            await comm.save(tmp_path)

            if not os.path.exists(tmp_path) or os.path.getsize(tmp_path) < 500:
                continue

            audio = AudioSegment.from_mp3(tmp_path)
            audio = audio.set_channels(1).set_frame_rate(16000)

            # Detect silence and find actual audio start
            nonsilent = silence.detect_nonsilent(audio, min_silence_len=20, silence_thresh=-38)
            if nonsilent:
                audio_start = max(0, nonsilent[0][0] - 10)
            else:
                audio_start = 0

            # Trim to [start_ms, end_ms] relative to audio start
            clip_start = audio_start + start_ms
            clip_end = audio_start + end_ms
            if clip_end > len(audio):
                clip_end = len(audio)
            if clip_end - clip_start < 100:
                clip_start = audio_start
                clip_end = min(len(audio), audio_start + 600)

            trimmed = audio[clip_start:clip_end]

            # Add padding
            pad = AudioSegment.silent(duration=30)
            trimmed = pad + trimmed + pad

            trimmed.export(out_path, format='mp3', bitrate='48k')

            if os.path.exists(tmp_path):
                os.remove(tmp_path)

            size = os.path.getsize(out_path)
            return True
        except Exception as e:
            if attempt < retries - 1:
                await asyncio.sleep(0.5)
    return False


async def main():
    keys = list(PHONEMES.keys())
    print(f'Regenerating {len(keys)} phoneme audio files...')
    print(f'Voice: {VOICE}\n')

    success = 0
    failed = []
    for ipa in keys:
        name, word, start, end = PHONEMES[ipa]
        ok = await generate_one(ipa, name, word, start, end)
        if ok:
            success += 1
            print(f'  [ok] {name}.mp3 <- "{word}" [{start}-{end}ms]')
        else:
            failed.append(name)
            print(f'  [FAIL] {name} ({word})')
        await asyncio.sleep(0.15)

    # Check for duplicates
    import hashlib
    hashes = {}
    dups = []
    for ipa in keys:
        name = PHONEMES[ipa][0]
        fp = os.path.join(PHONEMES_DIR, f'{name}.mp3')
        if os.path.exists(fp):
            h = hashlib.md5(open(fp, 'rb').read()).hexdigest()
            if h in hashes:
                dups.append(f"{name} == {hashes[h]}")
            else:
                hashes[h] = name

    print(f'\nDone! {success}/{len(keys)} files')
    if failed:
        print(f'Failed: {", ".join(failed)}')
    if dups:
        print(f'Duplicates: {", ".join(dups)}')
    else:
        print('No duplicates!')


if __name__ == '__main__':
    asyncio.run(main())
