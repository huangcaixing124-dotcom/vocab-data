"""
例句语音生成后端服务
1. 从字典 API 获取所有单词的例句
2. 用 Edge-TTS 生成音频
3. 通过 HTTP 服务提供给小程序

运行: python sentence-tts-server.py
端口: 8765
"""

import asyncio
import hashlib
import json
import os
import sys
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote

try:
    import edge_tts
except ImportError:
    os.system(f"{sys.executable} -m pip install edge-tts")
    import edge_tts

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(SCRIPT_DIR, '..', 'assets', 'sounds', 'sentences')
CACHE_FILE = os.path.join(AUDIO_DIR, '_cache.json')
os.makedirs(AUDIO_DIR, exist_ok=True)

VOICE = "en-US-JennyNeural"
CACHE = {}  # sentence -> hash mapping

def load_cache():
    global CACHE
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            CACHE = json.load(f)

def save_cache():
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(CACHE, f, ensure_ascii=False)

def sentence_hash(text):
    return hashlib.md5(text.strip().lower().encode()).hexdigest()[:12]

async def generate_audio(text):
    h = sentence_hash(text)
    out_path = os.path.join(AUDIO_DIR, f'{h}.mp3')

    # Check cache
    if text.strip().lower() in CACHE and os.path.exists(out_path):
        return h

    # Generate with Edge-TTS
    ssml = f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="{VOICE}"><prosody rate="-10%">{text}</prosody></voice></speak>'
    communicate = edge_tts.Communicate(ssml, VOICE)
    await communicate.save(out_path)

    if os.path.exists(out_path) and os.path.getsize(out_path) > 500:
        CACHE[text.strip().lower()] = h
        save_cache()
        return h
    return None


class TTSHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == '/tts':
            params = parse_qs(parsed.query)
            text = params.get('text', [''])[0]
            text = unquote(text)

            if not text:
                self.send_error(400, 'Missing text parameter')
                return

            h = sentence_hash(text)

            # Check if audio exists
            audio_path = os.path.join(AUDIO_DIR, f'{h}.mp3')
            if os.path.exists(audio_path):
                self.send_file(audio_path)
                return

            # Generate audio
            print(f'[TTS] Generating: {text[:50]}...')
            result = asyncio.run(generate_audio(text))
            if result and os.path.exists(audio_path):
                self.send_file(audio_path)
            else:
                self.send_error(500, 'Failed to generate audio')

        elif parsed.path == '/check':
            params = parse_qs(parsed.query)
            text = params.get('text', [''])[0]
            text = unquote(text)
            h = sentence_hash(text)
            audio_path = os.path.join(AUDIO_DIR, f'{h}.mp3')
            exists = os.path.exists(audio_path)
            self.send_json({'exists': exists, 'hash': h})

        else:
            self.send_error(404)

    def send_file(self, path):
        with open(path, 'rb') as f:
            data = f.read()
        self.send_response(200)
        self.send_header('Content-Type', 'audio/mpeg')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, obj):
        data = json.dumps(obj).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format, *args):
        print(f'[Server] {args[0]}')


def main():
    load_cache()
    port = 8765
    server = HTTPServer(('0.0.0.0', port), TTSHandler)
    print(f'Sentence TTS server running on http://localhost:{port}')
    print(f'Audio cache: {AUDIO_DIR}')
    print(f'Cached sentences: {len(CACHE)}')
    print(f'API: GET /tts?text=<sentence> -> MP3 audio')
    print(f'API: GET /check?text=<sentence> -> {{exists: bool}}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.')


if __name__ == '__main__':
    main()
