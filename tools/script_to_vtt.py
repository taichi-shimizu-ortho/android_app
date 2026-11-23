"""読み原稿（スライドごとの .md）から、タイムスタンプ付きの WebVTT を作る。

音声は作らず、読む速さから時刻を割り当てる。

    python tools/script_to_vtt.py tools/scripts/relaxin2026.md \
        --out-dir frontend/public/prompter/relaxin2026 --name relaxin2026 --end 350

原稿の書き方（例は tools/scripts/relaxin2026.md）:

    ## 1. タイトル
    マウス股関節におけるリラキシン受容体 RXFP1 の発現について発表します。
    よろしくお願いします。

    ## 2. Introduction（背景）
    ...

- `## 番号. 見出し` でスライドを始める。見出しは VTT の `NOTE スライド N: 見出し` になる
- 空行でない 1 行が 1 キュー（1 フレーズ）。「。」で終わらない行は、次の行に文が続く
- `<!-- -->` のコメント行と `>` で始まる行は読まない（メモ用）

時刻の付け方:

1. 各キューの長さ = 字数 ÷ 字/秒（既定 5.78 字/秒 = 347 字/分）。字数は空白も含めて数える
   （ノートの字数と同じ数え方。英字は 1 字 = 1 字）
2. 「。」で終わるキューのあとに 0.45 秒、スライドが替わるところに 0.5 秒の間を入れる。
   キューの中にある「。」にも 0.45 秒を足す
3. 最後のキューが --end 秒で終わるよう、全体を同じ比で伸縮する。比が 0.9〜1.1 倍に入らなければ
   エラーにする（原稿の長さを直す）

出力は <name>.vtt と <name>.md（スライドごとの開始時刻と字数つき、読み合わせ・修正用）。
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

SENTENCE_END = ("。", "？", "！")


@dataclass
class Slide:
    number: int
    title: str
    lines: list[str] = field(default_factory=list)


@dataclass
class Cue:
    ident: str
    slide: Slide
    text: str
    start: int = 0  # ミリ秒
    end: int = 0


def parse_script(text: str) -> tuple[str, list[Slide]]:
    title = ""
    slides: list[Slide] = []
    in_comment = False
    for raw in text.splitlines():
        line = raw.strip()
        if in_comment:
            in_comment = "-->" not in line
            continue
        if line.startswith("<!--"):
            in_comment = "-->" not in line
            continue
        if not line or line.startswith(">"):
            continue
        if line.startswith("## "):
            match = re.match(r"##\s+(\d+)\.\s*(.+)", line)
            if not match:
                raise SystemExit(f"スライドの見出しは「## 番号. 見出し」で書く: {line}")
            slides.append(Slide(int(match[1]), match[2].strip()))
            continue
        if line.startswith("# "):
            title = line[2:].strip()
            continue
        if line.startswith("#"):
            continue
        if not slides:
            raise SystemExit(f"最初の「## 番号. 見出し」より前に本文がある: {line}")
        slides[-1].lines.append(line)
    numbers = [s.number for s in slides]
    if numbers != list(range(1, len(slides) + 1)):
        raise SystemExit(f"スライド番号が 1 から順になっていない: {numbers}")
    empty = [s.number for s in slides if not s.lines]
    if empty:
        raise SystemExit(f"キューのないスライドがある: {empty}")
    return title, slides


def count(text: str) -> int:
    return len(text)


def assign_times(slides: list[Slide], rate: float, sentence_pause: float,
                 slide_pause: float, end: float, tolerance: float) -> tuple[list[Cue], float]:
    cues = [Cue(f"s{s.number:02d}-{i:02d}", s, line)
            for s in slides for i, line in enumerate(s.lines, 1)]
    # 秒単位の長さと、そのキューのあとの間
    lengths, gaps = [], []
    for i, cue in enumerate(cues):
        inner = sum(cue.text[:-1].count(mark) for mark in SENTENCE_END)
        lengths.append(count(cue.text) / rate + inner * sentence_pause)
        if i + 1 == len(cues):
            gaps.append(0.0)
        elif cues[i + 1].slide is not cue.slide:
            gaps.append(slide_pause)
        elif cue.text.endswith(SENTENCE_END):
            gaps.append(sentence_pause)
        else:
            gaps.append(0.0)
    natural = sum(lengths) + sum(gaps)
    ratio = end / natural
    if not 1 - tolerance <= ratio <= 1 + tolerance:
        raise SystemExit(
            f"伸縮の比が {ratio:.3f} で、{1 - tolerance:.2f}〜{1 + tolerance:.2f} に入らない"
            f"（読む速さのままだと {natural:.1f} 秒）。原稿の長さを直す")
    # 累積の時刻を丸めるので、丸めでキューが重なることはない
    t = 0.0
    for cue, length, gap in zip(cues, lengths, gaps):
        cue.start = round(t * 1000)
        t += length * ratio
        cue.end = round(t * 1000)
        t += gap * ratio
    return cues, ratio


def stamp(ms: int) -> str:
    h, rest = divmod(ms, 3_600_000)
    m, rest = divmod(rest, 60_000)
    s, ms = divmod(rest, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def short(ms: int) -> str:
    m, rest = divmod(ms, 60_000)
    return f"{m}:{rest / 1000:04.1f}"


def to_vtt(cues: list[Cue]) -> str:
    out = ["WEBVTT", ""]
    previous = None
    for cue in cues:
        if cue.slide is not previous:
            out += [f"NOTE スライド {cue.slide.number}: {cue.slide.title}", ""]
            previous = cue.slide
        out += [cue.ident, f"{stamp(cue.start)} --> {stamp(cue.end)}", cue.text, ""]
    return "\n".join(out)


def to_markdown(title: str, slides: list[Slide], cues: list[Cue], ratio: float,
                rate: float, end: float) -> str:
    total = sum(count(c.text) for c in cues)
    out = [
        f"# {title or '読み原稿'}",
        "",
        f"- 合計 {total} 字・{len(slides)} 枚・{len(cues)} キュー",
        f"- 最後のキューの終わり: {short(cues[-1].end)}（{end:g} 秒）",
        f"- 読む速さ {rate * 60:.0f} 字/分、「。」のあと 0.45 秒・スライドの替わり目 0.5 秒の間、"
        f"伸縮の比 {ratio:.3f}",
        "- `tools/script_to_vtt.py` で原稿（`tools/scripts/*.md`）から作った。直すときは原稿を直して作り直す",
        "",
    ]
    for slide in slides:
        own = [c for c in cues if c.slide is slide]
        chars = sum(count(c.text) for c in own)
        out += [f"## {slide.number}. {slide.title}（{short(own[0].start)}〜・{chars} 字）", ""]
        # キューを文にまとめて 1 文 1 行で並べる
        sentence = ""
        for cue in own:
            # 英字どうしの境目は、行を分けたときに消えた空白を戻す
            if sentence and (sentence[-1].isascii() and sentence[-1].isalnum()
                             or cue.text[0].isascii() and cue.text[0].isalnum()):
                sentence += " "
            sentence += cue.text
            if cue.text.endswith(SENTENCE_END):
                out.append(sentence)
                sentence = ""
        if sentence:
            out.append(sentence)
        out.append("")
    return "\n".join(out)


def check_vtt(text: str, slides: list[Slide], limit: float) -> None:
    """書き出した VTT を読み直して、形と時刻を確かめる。"""
    blocks = text.strip("\n").split("\n\n")
    if blocks[0] != "WEBVTT":
        raise SystemExit("VTT の先頭が WEBVTT でない")
    pattern = re.compile(r"^(\d{2}):(\d{2}):(\d{2})\.(\d{3}) --> (\d{2}):(\d{2}):(\d{2})\.(\d{3})$")
    last_end = -1
    seen = set()
    for block in blocks[1:]:
        lines = block.split("\n")
        if lines[0].startswith("NOTE"):
            continue
        if len(lines) != 3:
            raise SystemExit(f"キューは「識別子・時刻・本文 1 行」にする: {lines}")
        match = pattern.match(lines[1])
        if not match:
            raise SystemExit(f"時刻の書式が違う: {lines[1]}")
        v = [int(x) for x in match.groups()]
        start = v[0] * 3600 + v[1] * 60 + v[2] + v[3] / 1000
        end = v[4] * 3600 + v[5] * 60 + v[6] + v[7] / 1000
        if not last_end <= start < end:
            raise SystemExit(f"時刻が重なるか逆になっている: {lines[0]}")
        last_end = end
        seen.add(int(lines[0][1:3]))
    if last_end >= limit:
        raise SystemExit(f"最後のキューが {limit:g} 秒より後に終わる: {last_end:.3f}")
    missing = [s.number for s in slides if s.number not in seen]
    if missing:
        raise SystemExit(f"キューのないスライドがある: {missing}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("script", type=Path, help="読み原稿の .md")
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--name", required=True, help="出力のファイル名（拡張子なし）")
    parser.add_argument("--end", type=float, default=359, help="最後のキューが終わる秒（既定 359）")
    parser.add_argument("--limit", type=float, default=360, help="発表時間の秒。これより前に終わるか確かめる")
    parser.add_argument("--rate", type=float, default=347, help="読む速さ（字/分、既定 347）")
    parser.add_argument("--sentence-pause", type=float, default=0.45)
    parser.add_argument("--slide-pause", type=float, default=0.5)
    parser.add_argument("--tolerance", type=float, default=0.1, help="伸縮の比の許容幅（既定 ±0.1）")
    args = parser.parse_args()

    title, slides = parse_script(args.script.read_text(encoding="utf-8"))
    rate = args.rate / 60
    cues, ratio = assign_times(slides, rate, args.sentence_pause, args.slide_pause,
                               args.end, args.tolerance)
    vtt = to_vtt(cues)
    check_vtt(vtt, slides, args.limit)

    args.out_dir.mkdir(parents=True, exist_ok=True)
    (args.out_dir / f"{args.name}.vtt").write_text(vtt, encoding="utf-8")
    (args.out_dir / f"{args.name}.md").write_text(
        to_markdown(title, slides, cues, ratio, rate, args.end), encoding="utf-8")

    total = sum(count(c.text) for c in cues)
    print(f"{len(slides)} 枚・{len(cues)} キュー・{total} 字・伸縮の比 {ratio:.3f}・"
          f"終わり {short(cues[-1].end)}")
    for slide in slides:
        own = [c for c in cues if c.slide is slide]
        chars = sum(count(c.text) for c in own)
        print(f"  {slide.number:2d} {short(own[0].start):>7} {chars:4d} 字  {slide.title}")
    long = [c for c in cues if count(c.text) > 48]
    for c in long:
        print(f"  注意: {c.ident} が {count(c.text)} 字（30〜45 字が目安）", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
