"""
Compress phoneme audio files to reduce size
Converts to mono, trims silence, reduces bitrate
"""

import os
import glob

from pydub import AudioSegment, silence

PHONEMES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'sounds', 'phonemes')

def compress_audio(input_path, output_path, target_bitrate='16k'):
    """Compress a single audio file aggressively."""
    audio = AudioSegment.from_mp3(input_path)

    # Convert to mono, lower sample rate
    audio = audio.set_channels(1).set_frame_rate(16000)

    # Trim silence from start and end
    # Detect non-silent chunks
    chunks = silence.detect_nonsilent(audio, min_silence_len=50, silence_thresh=-40)
    if chunks:
        start = chunks[0][0]
        end = chunks[-1][1]
        audio = audio[start:end]

    # Add tiny padding
    padding = AudioSegment.silent(duration=30)
    audio = padding + audio + padding

    # Export with very low bitrate
    audio.export(output_path, format='mp3', bitrate=target_bitrate)

def main():
    mp3_files = glob.glob(os.path.join(PHONEMES_DIR, '*.mp3'))
    print(f"Found {len(mp3_files)} MP3 files to compress\n")

    total_before = 0
    total_after = 0

    for filepath in sorted(mp3_files):
        filename = os.path.basename(filepath)
        size_before = os.path.getsize(filepath)
        total_before += size_before

        try:
            compress_audio(filepath, filepath, target_bitrate='32k')
            size_after = os.path.getsize(filepath)
            total_after += size_after
            print(f"  {filename}: {size_before//1024}KB -> {size_after//1024}KB ({size_after*100//size_before}%)")
        except Exception as e:
            print(f"  {filename}: ERROR - {e}")
            total_after += size_before

    print(f"\nTotal: {total_before//1024}KB -> {total_after//1024}KB ({total_after*100//total_before}%)")

if __name__ == '__main__':
    main()
