"""LRC 原稿を Gemini TTS で 1 本の音声にし、LRC の時刻を音声に合わせて書き直す。

Gemini TTS は時刻情報を返さないので、文（「。」まで）ごとに合成してつなぎ、
文の開始時刻は実測、文中の行の開始時刻は文字数の比で割り振る。
最後に ffmpeg の atempo（音程を保ったまま速度変更）で全体を --duration 秒に合わせる。

    export GEMINI_API_KEY=...   # Google AI Studio のキー。リポジトリに書かない
    python tools/lrc_tts.py frontend/public/prompter/joa2026/joa2026.lrc --voice Charon --duration 180

出力（LRC と同じフォルダ）:
    audio.mp3   全文の音声
    <入力>.lrc  時刻を書き直した LRC（上書き）
合成済みの文は tools/.tts_cache/ に保存し、同じ文・声・スタイルなら API を呼ばない。
"""

import argparse
import array
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions"
SAMPLE_RATE = 24000  # audio/l16: 24 kHz, mono, 16-bit little-endian
CACHE_DIR = Path(__file__).parent / ".tts_cache"
DEFAULT_STYLE = "学会での口頭発表。落ち着いて、はっきりと、やや速めのテンポで読む。"

# 読み間違える語の読み替え（表記 → 読み）。合成に渡す文だけを置き換え、LRC の表示は変えない。
READINGS: dict[str, str] = {}


def read_lines(path: Path) -> list[str]:
    """LRC から本文の行だけを取り出す（時刻は捨てる）。"""
    lines = []
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        if not re.match(r"\s*\[\d+:\d+", raw):
            continue
        text = re.sub(r"\[[^\]]*\]", "", raw).strip()
        if text:
            lines.append(text)
    return lines


def group_sentences(lines: list[str]) -> list[list[int]]:
    """「。」で終わる行までを 1 文としてまとめ、行番号のリストを返す。"""
    groups, current = [], []
    for i, line in enumerate(lines):
        current.append(i)
        if line.endswith(("。", "！", "？", "!", "?")):
            groups.append(current)
            current = []
    if current:
        groups.append(current)
    return groups


def synthesize(text: str, voice: str, style: str, model: str, key: str) -> bytes:
    """1 文を合成して生 PCM を返す。結果はキャッシュする。"""
    digest = hashlib.sha256(json.dumps([model, voice, style, text]).encode()).hexdigest()[:24]
    cached = CACHE_DIR / f"{digest}.pcm"
    if cached.exists():
        return cached.read_bytes()

    body = {
        "model": model,
        "store": False,
        "input": [{
            "type": "user_input",
            "content": [{
                "type": "text",
                "text": text,
                "annotations": [{"type": "speech_metadata", "style": style}],
            }],
        }],
        "response_format": {"type": "audio", "mime_type": "audio/l16", "sample_rate": SAMPLE_RATE},
        "generation_config": {"speech_config": [{"voice": voice}]},
    }
    request = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
    )
    for attempt in range(6):
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                result = json.load(response)
            break
        except urllib.error.HTTPError as error:
            detail = error.read().decode(errors="replace")
            if error.code in (429, 500, 503) and attempt < 5:
                wait = 10 * (attempt + 1)
                print(f"  {error.code}: {wait} 秒待って再試行")
                time.sleep(wait)
                continue
            sys.exit(f"Gemini API エラー {error.code}: {detail}")

    audio = [c for s in result.get("steps", []) if s.get("type") == "model_output"
             for c in s.get("content", []) if c.get("type") == "audio"]
    if not audio:
        sys.exit(f"音声が返ってきませんでした: {json.dumps(result, ensure_ascii=False)[:500]}")
    pcm = base64.b64decode(audio[-1]["data"])
    CACHE_DIR.mkdir(exist_ok=True)
    cached.write_bytes(pcm)
    return pcm


def trim_silence(pcm: bytes, threshold: int = 400, pad: float = 0.05) -> array.array:
    """前後の無音を削る（pad 秒だけ残す）。"""
    samples = array.array("h", pcm)
    loud = [i for i in range(0, len(samples), 48) if abs(samples[i]) > threshold]
    if not loud:
        return samples
    margin = int(pad * SAMPLE_RATE)
    return samples[max(0, loud[0] - margin):min(len(samples), loud[-1] + margin)]


def fmt(seconds: float) -> str:
    minutes, secs = divmod(max(0.0, seconds), 60)
    return f"{int(minutes):02d}:{secs:05.2f}"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("lrc", type=Path)
    parser.add_argument("--voice", default="Charon")
    parser.add_argument("--model", default="gemini-3.8-flash-tts")
    parser.add_argument("--style", default=DEFAULT_STYLE)
    parser.add_argument("--duration", type=float, default=180.0, help="全体の長さ（秒）")
    parser.add_argument("--tail", type=float, default=1.0, help="読み終わりから終了までの余白（秒）")
    parser.add_argument("--gap", type=float, default=0.45, help="文と文の間（秒）")
    args = parser.parse_args()

    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_TTS_API_KEY")
    if not key:
        sys.exit("環境変数 GEMINI_API_KEY（または GOOGLE_TTS_API_KEY）が設定されていません。")

    lines = read_lines(args.lrc)
    sentences = group_sentences(lines)
    gap = array.array("h", bytes(int(args.gap * SAMPLE_RATE) * 2))

    full = array.array("h")
    starts = [0.0] * len(lines)
    for n, group in enumerate(sentences, 1):
        text = "".join(lines[i] for i in group)
        spoken = text
        for word, reading in READINGS.items():
            spoken = spoken.replace(word, reading)
        print(f"[{n}/{len(sentences)}] {text[:40]}…")
        samples = trim_silence(synthesize(spoken, args.voice, args.style, args.model, key))

        # 文の開始は実測、文中の行は文字数の比で割り振る
        begin = len(full) / SAMPLE_RATE
        length = len(samples) / SAMPLE_RATE
        offset = 0
        for i in group:
            starts[i] = begin + length * offset / len(text)
            offset += len(lines[i])
        full.extend(samples)
        if n < len(sentences):
            full.extend(gap)

    natural = len(full) / SAMPLE_RATE
    target = args.duration - args.tail
    tempo = natural / target
    print(f"合成した長さ {natural:.2f} 秒 → {target:.2f} 秒に合わせる（速度 ×{tempo:.3f}）")
    if not 0.8 <= tempo <= 1.25:
        print("  ※ 速度の変更が大きいので、--style で話す速さを指示し直すと自然になります。")

    out_dir = args.lrc.parent
    with tempfile.NamedTemporaryFile(suffix=".pcm") as raw:
        raw.write(full.tobytes())
        raw.flush()
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SAMPLE_RATE), "-ac", "1",
             "-i", raw.name, "-filter:a", f"atempo={tempo:.5f}", "-b:a", "64k", str(out_dir / "audio.mp3")],
            check=True,
        )

    lrc = [f"[{fmt(starts[i] / tempo)}]{line}" for i, line in enumerate(lines)]
    lrc.append(f"[{fmt(args.duration)}]")
    args.lrc.write_text("\n".join(lrc) + "\n", encoding="utf-8")
    size = (out_dir / "audio.mp3").stat().st_size // 1024
    print(f"書き出し: {out_dir / 'audio.mp3'}（{size} KB）, {args.lrc}")
    print(f"声 {args.voice} / {args.model} / {len(sentences)} 文・{len(lines)} 行")


if __name__ == "__main__":
    main()
