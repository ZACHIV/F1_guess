#!/usr/bin/env python3

from __future__ import annotations

import argparse
import audioop
import json
import math
import statistics
import subprocess
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIBRARY_PATH = ROOT / "src/data/challenge-library.json"
MANIFEST_PATH = ROOT / "src/archive/archive-audio-manifest.json"
TMP_ROOT = ROOT / ".tmp/archive-audio"
MODEL_NAME = "htdemucs"


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)


def ensure_vocals_stem(audio_path: Path) -> Path:
    duration_ms = probe_duration_ms(audio_path)
    tail_start_seconds = max((duration_ms / 1000) - 18, 0)
    tail_dir = TMP_ROOT / "tails"
    tail_dir.mkdir(parents=True, exist_ok=True)
    tail_clip = tail_dir / f"{audio_path.stem}-tail.wav"

    if not tail_clip.exists():
        run(
            [
                "ffmpeg",
                "-y",
                "-ss",
                f"{tail_start_seconds:.3f}",
                "-i",
                str(audio_path),
                "-ac",
                "2",
                str(tail_clip),
            ]
        )

    output_dir = TMP_ROOT / "separated"
    stem_path = output_dir / MODEL_NAME / tail_clip.stem / "vocals.wav"

    if stem_path.exists():
        return stem_path

    output_dir.mkdir(parents=True, exist_ok=True)
    run(
        [
            sys.executable,
            "-m",
            "demucs",
            "-d",
            "cpu",
            "--two-stems",
            "vocals",
            "-o",
            str(output_dir),
            str(tail_clip),
        ]
    )
    return stem_path


def ensure_analysis_wav(vocals_path: Path) -> Path:
    analysis_path = vocals_path.with_name(f"{vocals_path.stem}-analysis.wav")
    if analysis_path.exists():
        return analysis_path

    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(vocals_path),
            "-ac",
            "1",
            "-ar",
            "16000",
            "-c:a",
            "pcm_s16le",
            str(analysis_path),
        ]
    )
    return analysis_path


def detect_trailing_speech_start_ms(
    analysis_path: Path,
    *,
    tail_seconds: int = 18,
    window_ms: int = 200,
    min_run_windows: int = 4,
    rollback_ms: int = 350,
) -> tuple[int, dict[str, float]]:
    with wave.open(str(analysis_path), "rb") as wav_file:
        frame_rate = wav_file.getframerate()
        sample_width = wav_file.getsampwidth()
        total_frames = wav_file.getnframes()
        frames_per_window = max(1, int(frame_rate * window_ms / 1000))
        total_windows = math.ceil(total_frames / frames_per_window)
        rms_values: list[int] = []

        for _ in range(total_windows):
            chunk = wav_file.readframes(frames_per_window)
            if not chunk:
                break
            rms_values.append(audioop.rms(chunk, sample_width))

    tail_windows = max(10, int(tail_seconds * 1000 / window_ms))
    start_window = max(0, len(rms_values) - tail_windows)
    tail_slice = rms_values[start_window:]
    baseline = statistics.median(tail_slice[: max(1, len(tail_slice) // 2)])
    peak = max(tail_slice)
    threshold = max(baseline * 2.8, baseline + (peak - baseline) * 0.22, 180)

    speech_window = None
    for index in range(start_window, max(start_window, len(rms_values) - min_run_windows + 1)):
        run_slice = rms_values[index:index + min_run_windows]
        if len(run_slice) < min_run_windows:
            break
        if all(value >= threshold for value in run_slice):
            speech_window = index
            break

    if speech_window is None:
        fallback_ms = max((len(rms_values) * window_ms) - 3500, 1500)
        return fallback_ms, {
            "baseline": baseline,
            "peak": peak,
            "threshold": threshold,
            "method": "fallback_trim",
        }

    speech_start_ms = max((speech_window * window_ms) - rollback_ms, 1500)
    return speech_start_ms, {
        "baseline": baseline,
        "peak": peak,
        "threshold": threshold,
        "method": "vocal_tail_rms",
    }


def build_manifest(slugs: set[str] | None) -> dict[str, dict[str, int]]:
    library = json.loads(LIBRARY_PATH.read_text())
    manifest: dict[str, dict[str, int]] = {}

    for challenge in library:
        if not challenge.get("audioSrc"):
            continue
        if slugs and challenge["id"] not in slugs:
            continue

        audio_path = ROOT / "public" / challenge["audioSrc"].removeprefix("/")
        duration_ms = probe_duration_ms(audio_path)
        tail_start_ms = max(duration_ms - 18000, 0)
        vocals_path = ensure_vocals_stem(audio_path)
        analysis_path = ensure_analysis_wav(vocals_path)
        speech_start_ms, diagnostics = detect_trailing_speech_start_ms(analysis_path)
        ambient_end_ms = min(max(tail_start_ms + speech_start_ms, 1500), duration_ms)

        manifest[challenge["id"]] = {
            "ambientEndMs": ambient_end_ms,
            "crossfadeMs": 3200,
            "sourceDurationMs": int(challenge.get("clipDurationMs") or 0),
            "speechDetectionMethod": diagnostics["method"],
        }

        print(
            f"{challenge['id']}: ambientEndMs={ambient_end_ms} "
            f"baseline={diagnostics['baseline']:.1f} peak={diagnostics['peak']:.1f} "
            f"threshold={diagnostics['threshold']:.1f} method={diagnostics['method']}"
        )

    return manifest


def probe_duration_ms(audio_path: Path) -> int:
    completed = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(audio_path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return int(float(completed.stdout.strip()) * 1000)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", action="append", dest="slugs", default=[])
    parser.add_argument("--out", default=str(MANIFEST_PATH))
    args = parser.parse_args()

    manifest = build_manifest(set(args.slugs) if args.slugs else None)
    output_path = Path(args.out)
    output_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(manifest)} entries to {output_path}")


if __name__ == "__main__":
    main()
