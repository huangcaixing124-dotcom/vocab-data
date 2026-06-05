"""
下载并处理 IPA 音频文件
来源: GitHub joshstephenson/PhoneticFlashCards (CC0 许可)
补充: Edge-TTS 生成缺失的英语音素
"""

import asyncio
import os
import urllib.request
import json
from pydub import AudioSegment

PHONEMES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'sounds', 'phonemes')
os.makedirs(PHONEMES_DIR, exist_ok=True)

BASE_URL = 'https://raw.githubusercontent.com/joshstephenson/PhoneticFlashCards/main/ipa_audio'

# 映射: IPA symbol -> GitHub 文件路径 -> 本地文件名
IPA_MAP = {
    # Consonants
    'p': ('consonants/Voiceless_bilabial_plosive_p.ogg.mp3', 'p.mp3'),
    'b': ('consonants/Voiced_bilabial_plosive_b.ogg.mp3', 'b.mp3'),
    't': ('consonants/Voiceless_alveolar_plosive_t.ogg.mp3', 't.mp3'),
    'd': ('consonants/Voiced_alveolar_plosive_d.ogg.mp3', 'd.mp3'),
    'k': ('consonants/Voiceless_velar_plosive_k.ogg.mp3', 'k.mp3'),
    'g': ('consonants/Voiced_velar_plosive_g.ogg.mp3', 'g.mp3'),
    'f': ('consonants/Voiceless_labio-dental_fricative_f.ogg.mp3', 'f.mp3'),
    'v': ('consonants/Voiced_labio-dental_fricative_v.ogg.mp3', 'v.mp3'),
    'θ': ('consonants/Voiceless_dental_fricative_θ.ogg.mp3', 'theta.mp3'),
    'ð': ('consonants/Voiced_dental_fricative_ð.ogg.mp3', 'eth.mp3'),
    's': ('consonants/Voiceless_alveolar_sibilant_s.ogg.mp3', 's.mp3'),
    'z': ('consonants/Voiced_alveolar_sibilant_z.ogg.mp3', 'z.mp3'),
    'ʃ': ('consonants/Voiceless_palato-alveolar_sibilant_ʃ.ogg.mp3', 'esh.mp3'),
    'ʒ': ('consonants/Voiced_palato-alveolar_sibilant_ʒ.ogg.mp3', 'ezh.mp3'),
    'h': ('consonants/Voiced_glottal_fricative_h.ogg.mp3', 'h.mp3'),
    'm': ('consonants/Bilabial_nasal_m.ogg.mp3', 'm.mp3'),
    'n': ('consonants/Alveolar_nasal_n.ogg.mp3', 'n.mp3'),
    'ŋ': ('consonants/Velar_nasal_ŋ.ogg.mp3', 'eng.mp3'),
    'l': ('consonants/Voiced_alveolar_lateral_approximant_l.ogg.mp3', 'l.mp3'),
    'j': ('consonants/Voiced_palatal_approximant_j.ogg.mp3', 'y.mp3'),

    # Vowels
    'i': ('vowels/Close_front_unrounded_vowel_i.ogg.mp3', 'i.mp3'),
    'ɪ': ('vowels/Near-close_near-front_unrounded_vowel_ɪ.ogg.mp3', 'ih.mp3'),
    'e': ('vowels/Close-mid_front_unrounded_vowel_e.ogg.mp3', 'eh.mp3'),
    'ɛ': ('vowels/Open-mid_front_unrounded_vowel_ɛ.ogg.mp3', 'epsilon.mp3'),
    'æ': ('vowels/Near-open_front_unrounded_vowel_æ.ogg.mp3', 'ae.mp3'),
    'ɑ': ('vowels/Open_back_unrounded_vowel_ɑ.ogg.mp3', 'a.mp3'),
    'ɒ': ('vowels/Open_back_rounded_vowel_ɒ.ogg.mp3', 'open_o.mp3'),
    'ɔ': ('vowels/Open-mid_back_rounded_vowel_ɔ.ogg.mp3', 'open_o_back.mp3'),
    'ʌ': ('vowels/Open-mid_back_unrounded_vowel_ʌ.ogg.mp3', 'wedge.mp3'),
    'ʊ': ('vowels/Near-close_near-back_rounded_vowel_ʊ.ogg.mp3', 'upsilon.mp3'),
    'ə': ('vowels/Mid-central_vowel_ə.ogg.mp3', 'schwa.mp3'),
    'ɜ': ('vowels/Open-mid_central_unrounded_vowel_ɜ.ogg.mp3', 'er.mp3'),
    'u': ('vowels/Close_back_rounded_vowel_u.ogg.mp3', 'u.mp3'),
    'o': ('vowels/Close-mid_back_rounded_vowel_o.ogg.mp3', 'o.mp3'),
    'ø': ('vowels/Close-mid_front_rounded_vowel_ø.ogg.mp3', 'o_front.mp3'),
}

# 缺失的音素（GitHub 没有），用 Edge-TTS 补充
MISSING_IPA = {
    'r':  ('r', 'red', 150, 500),
    'w':  ('w', 'water', 150, 500),
    'tʃ': ('ch', 'church', 100, 500),
    'dʒ': ('j', 'judge', 100, 500),
    'iː': ('i_long', 'see', 200, 600),
    'ɑː': ('a_long', 'car', 200, 600),
    'ɔː': ('o_long', 'all', 150, 550),
    'uː': ('u_long', 'food', 100, 550),
    'ɜː': ('er_long', 'bird', 200, 600),
    'eɪ': ('ay', 'day', 100, 550),
    'aɪ': ('eye', 'my', 100, 550),
    'ɔɪ': ('oy', 'boy', 100, 550),
    'aʊ': ('ow', 'how', 100, 550),
    'oʊ': ('oh', 'go', 100, 550),
    'ɪə': ('eer', 'here', 200, 650),
    'eə': ('air', 'air', 100, 500),
    'ʊə': ('oor', 'tour', 150, 600),
}


def download_file(url, dest):
    """Download a file from URL."""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            with open(dest, 'wb') as f:
                f.write(resp.read())
        return True
    except Exception as e:
        print(f'  Download failed: {e}')
        return False


def convert_and_compress(src, dest):
    """Convert audio to compressed MP3."""
    try:
        audio = AudioSegment.from_file(src)
        audio = audio.set_channels(1).set_frame_rate(16000)
        # Trim silence from start/end
        if len(audio) > 1000:
            audio = audio[:2000]  # Max 2 seconds
        audio.export(dest, format='mp3', bitrate='48k')
        return os.path.exists(dest) and os.path.getsize(dest) > 200
    except Exception as e:
        print(f'  Convert failed: {e}')
        return False


async def generate_missing(ipa, name, word, start_ms, end_ms):
    """Generate missing phoneme with Edge-TTS."""
    try:
        import edge_tts
        from pydub import silence as pydub_silence

        out_path = os.path.join(PHONEMES_DIR, f'{name}.mp3')
        tmp_path = os.path.join(PHONEMES_DIR, f'_tmp_{name}.mp3')

        comm = edge_tts.Communicate(word, 'en-US-JennyNeural')
        await comm.save(tmp_path)

        if not os.path.exists(tmp_path) or os.path.getsize(tmp_path) < 500:
            return False

        audio = AudioSegment.from_mp3(tmp_path)
        audio = audio.set_channels(1).set_frame_rate(16000)

        ns = pydub_silence.detect_nonsilent(audio, min_silence_len=20, silence_thresh=-38)
        audio_start = max(0, ns[0][0] - 10) if ns else 0

        clip = audio[audio_start + start_ms: audio_start + end_ms]
        if len(clip) < 100:
            clip = audio[audio_start: min(len(audio), audio_start + 600)]

        pad = AudioSegment.silent(duration=30)
        (pad + clip + pad).export(out_path, format='mp3', bitrate='48k')

        if os.path.exists(tmp_path):
            os.remove(tmp_path)

        return os.path.exists(out_path) and os.path.getsize(out_path) > 200
    except Exception as e:
        print(f'  Edge-TTS failed: {e}')
        return False


def main():
    print('Step 1: Downloading IPA audio from GitHub...')
    downloaded = 0
    for ipa, (github_path, local_name) in IPA_MAP.items():
        url = f'{BASE_URL}/{github_path}'
        local_src = os.path.join(PHONEMES_DIR, f'_dl_{local_name}')
        local_dest = os.path.join(PHONEMES_DIR, local_name)

        if download_file(url, local_src):
            if convert_and_compress(local_src, local_dest):
                downloaded += 1
                size = os.path.getsize(local_dest)
                print(f'  [ok] {local_name} ({size}B)')
            else:
                print(f'  [FAIL] convert {local_name}')
            if os.path.exists(local_src):
                os.remove(local_src)
        else:
            print(f'  [FAIL] download {ipa}')
    print(f'\nDownloaded: {downloaded}/{len(IPA_MAP)}')

    print('\nStep 2: Generating missing phonemes with Edge-TTS...')
    asyncio.run(_generate_missing())

    print('\nStep 3: Building mapping...')
    build_mapping()


async def _generate_missing():
    ok = 0
    for ipa, (name, word, s, e) in MISSING_IPA.items():
        out_path = os.path.join(PHONEMES_DIR, f'{name}.mp3')
        if os.path.exists(out_path) and os.path.getsize(out_path) > 200:
            print(f'  [skip] {name}.mp3 (exists)')
            ok += 1
            continue
        if await generate_missing(ipa, name, word, s, e):
            size = os.path.getsize(out_path)
            print(f'  [ok] {name}.mp3 ({size}B) <- "{word}"')
            ok += 1
        else:
            print(f'  [FAIL] {name} ({word})')
        await asyncio.sleep(0.1)
    print(f'Generated: {ok}/{len(MISSING_IPA)}')


def build_mapping():
    """Build the final mapping.json and print summary."""
    import hashlib
    mapping = {}

    # Add all IPA symbols from IPA_MAP
    for ipa, (_, local_name) in IPA_MAP.items():
        fp = os.path.join(PHONEMES_DIR, local_name)
        if os.path.exists(fp) and os.path.getsize(fp) > 200:
            mapping[ipa] = f'/assets/sounds/phonemes/{local_name}'

    # Add missing IPA symbols from MISSING_IPA
    for ipa, (name, _, _, _) in MISSING_IPA.items():
        fp = os.path.join(PHONEMES_DIR, f'{name}.mp3')
        if os.path.exists(fp) and os.path.getsize(fp) > 200:
            mapping[ipa] = f'/assets/sounds/phonemes/{name}.mp3'

    # Check for duplicates
    hashes = {}
    dups = []
    for ipa, path in mapping.items():
        fp = os.path.join('F:/单词项目/assets/sounds/phonemes', path.split('/')[-1])
        if os.path.exists(fp):
            h = hashlib.md5(open(fp, 'rb').read()).hexdigest()
            if h in hashes:
                dups.append(f'{ipa} == {hashes[h][0]}')
            else:
                hashes[h] = (ipa, path)

    # Save mapping
    mapping_path = os.path.join(PHONEMES_DIR, 'mapping.json')
    with open(mapping_path, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)

    print(f'Total IPA symbols: {len(mapping)}')
    if dups:
        print(f'Duplicates: {", ".join(dups)}')
    else:
        print('No duplicates!')


if __name__ == '__main__':
    main()
