#!/usr/bin/env python3
"""
Vocal feature extraction using parselmouth (Praat) and librosa.

Input:  --input <video_path>, stdin receives JSON array of utterance windows:
        [{"id": "utt_0", "speaker_id": "S0", "start": 0.0, "end": 2.5, "words": [{"word_index": 0, "start": 0.0, "end": 0.5, "text": "hello"}]}, ...]
Output: JSON to stdout mapping utterance ID to VocalFeatures, now including word-level features.
"""

import argparse
import json
import sys
import subprocess
import tempfile
import os
import numpy as np

def extract_audio(video_path: str) -> str:
    audio_path = tempfile.mktemp(suffix=".wav")
    subprocess.run(
        ["ffmpeg", "-i", video_path, "-vn", "-acodec", "pcm_s16le",
         "-ar", "16000", "-ac", "1", "-y", audio_path],
        capture_output=True, text=True, check=True,
    )
    return audio_path

def extract_pitch_praat(audio_path: str, start: float, end: float) -> tuple[float, list[float]]:
    try:
        import parselmouth
    except ImportError:
        return None, []
    
    snd = parselmouth.Sound(audio_path)
    if end > start:
        snd = snd.extract_part(start, end, parselmouth.WindowShape.HANNING, 1, False)
    
    pitch = snd.to_pitch(time_step=0.01, pitch_floor=75, pitch_ceiling=600)
    pitch_values = pitch.selected_array["frequency"]
    voiced = pitch_values[pitch_values > 0]
    
    if len(voiced) == 0:
        return 0.0, []
        
    return float(np.median(voiced)), voiced.tolist()

def extract_intensity_praat(audio_path: str, start: float, end: float) -> tuple[float, list[float]]:
    try:
        import parselmouth
    except ImportError:
        return None, []
        
    snd = parselmouth.Sound(audio_path)
    if end > start:
        snd = snd.extract_part(start, end, parselmouth.WindowShape.HANNING, 1, False)
        
    intensity = snd.to_intensity(time_step=0.01)
    values = intensity.values[0]
    voiced = values[values > 30]
    
    if len(voiced) == 0:
        return -40.0, []
        
    return float(np.mean(voiced)), voiced.tolist()

def extract_speech_rate(audio_path: str, start: float, end: float, word_count: int) -> float:
    duration = end - start
    if duration <= 0 or word_count <= 0:
        return 0.0
    return round(word_count / (duration / 60.0), 1)

def extract_with_librosa(audio_path: str, start: float, end: float) -> dict:
    try:
        import librosa
    except ImportError:
        return None

    y, sr = librosa.load(audio_path, sr=16000, offset=start, duration=end - start)
    if len(y) == 0:
        return None

    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    pitch_values = []
    for t in range(pitches.shape[1]):
        idx = magnitudes[:, t].argmax()
        p = pitches[idx, t]
        if p > 75:
            pitch_values.append(p)

    pitch_median = float(np.median(pitch_values)) if pitch_values else 150.0

    rms = librosa.feature.rms(y=y)[0]
    rms_db = librosa.amplitude_to_db(rms)
    volume_mean = float(np.mean(rms_db))

    return {
        "pitch_median_hz": round(pitch_median, 1),
        "pitch_values": pitch_values,
        "volume_mean_db": round(volume_mean, 1),
        "volume_values": rms_db.tolist(),
    }

def normalize_values(values: list[float], all_speaker_values: list[float]) -> float:
    if not values or not all_speaker_values:
        return 0.5
    v = np.mean(values)
    all_v = np.array(all_speaker_values)
    if np.std(all_v) == 0:
        return 0.5
    z = (v - np.mean(all_v)) / (np.std(all_v) + 1e-8)
    return round(float(1 / (1 + np.exp(-z))), 4)

def detrend(values: list[float], times: list[float]) -> list[float]:
    """Remove the linear trend across one utterance, keeping its mean.

    Speech declines in pitch (and often loudness) from the start of an utterance to its end, so
    sentence-initial words read as "stressed" when normalised against the whole speaker. Stress is
    the deviation from that declination line, not the absolute value. Needs 3+ words; else unchanged.
    """
    if len(values) < 3 or max(times) - min(times) <= 0:
        return list(values)
    slope, intercept = np.polyfit(np.array(times), np.array(values), 1)
    mean_t = float(np.mean(times))
    return [float(v - slope * (t - mean_t)) for v, t in zip(values, times)]

def normalize_p10_p90(val: float, p10: float, p90: float) -> float:
    if p90 == p10: return 0.5
    norm = (val - p10) / (p90 - p10)
    return round(max(0.0, min(1.0, float(norm))), 4)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"ERROR: File not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    utterances = json.loads(sys.stdin.read())
    audio_path = args.input
    if not args.input.endswith((".wav", ".mp3", ".flac", ".ogg")):
        audio_path = extract_audio(args.input)

    try:
        all_pitch_values = []
        all_volume_values = []
        raw_features = {}
        
        # Word-level speaker stats
        speaker_word_pitches = {}
        speaker_word_volumes = {}

        use_praat = True
        try:
            import parselmouth
        except ImportError:
            use_praat = False

        for utt in utterances:
            uid = utt["id"]
            start = utt["start"]
            end = utt["end"]
            speaker_id = utt.get("speaker_id", "S0")
            words = utt.get("words", [])

            if use_praat:
                pitch_val, pitch_vals = extract_pitch_praat(audio_path, start, end)
                volume_val, volume_vals = extract_intensity_praat(audio_path, start, end)
                
                raw_features[uid] = {
                    "pitch_mean_hz": round(pitch_val, 1) if pitch_val else 150.0,
                    "pitch_values": pitch_vals,
                    "volume_mean_db": round(volume_val, 1) if volume_val else -20.0,
                    "volume_values": volume_vals,
                    "words": []
                }
                
                # Word-level extraction
                if speaker_id not in speaker_word_pitches:
                    speaker_word_pitches[speaker_id] = []
                    speaker_word_volumes[speaker_id] = []

                for w in words:
                    w_start = w["start"]
                    w_end = w["end"]
                    dur = w_end - w_start
                    if dur < 0.070:
                        mid = (w_start + w_end) / 2
                        w_start = max(0, mid - 0.040)
                        w_end = mid + 0.040

                    w_pitch, _ = extract_pitch_praat(audio_path, w_start, w_end)
                    w_vol, _ = extract_intensity_praat(audio_path, w_start, w_end)
                    
                    if not w_pitch:
                        w_pitch = raw_features[uid]["pitch_mean_hz"]
                    if not w_vol:
                        w_vol = raw_features[uid]["volume_mean_db"]
                        
                    raw_features[uid]["words"].append({
                        "word_index": w["word_index"],
                        "pitch_median_hz": w_pitch,
                        "volume_mean_db": w_vol,
                        "mid": (w["start"] + w["end"]) / 2,
                    })

                # declination-corrected values (pitch in semitones, so the correction is perceptual)
                ws = raw_features[uid]["words"]
                if ws:
                    mids = [x["mid"] for x in ws]
                    st = detrend([12 * np.log2(max(x["pitch_median_hz"], 1e-6)) for x in ws], mids)
                    db = detrend([x["volume_mean_db"] for x in ws], mids)
                    for x, p_st, v_db in zip(ws, st, db):
                        x["pitch_median_hz"] = float(2 ** (p_st / 12))
                        x["volume_mean_db"] = v_db
                        speaker_word_pitches[speaker_id].append(x["pitch_median_hz"])
                        speaker_word_volumes[speaker_id].append(v_db)

            else:
                features = extract_with_librosa(audio_path, start, end)
                if features is None:
                    raw_features[uid] = {
                        "pitch_mean_hz": 150.0, "pitch_values": [],
                        "volume_mean_db": -20.0, "volume_values": [],
                        "words": []
                    }
                else:
                    features["pitch_mean_hz"] = features.pop("pitch_median_hz")
                    features["words"] = []
                    raw_features[uid] = features

            all_pitch_values.extend(raw_features[uid].get("pitch_values", []))
            all_volume_values.extend(raw_features[uid].get("volume_values", []))

        # Compute p10/p90 per speaker
        speaker_stats = {}
        for sid in speaker_word_pitches:
            p_arr = np.array(speaker_word_pitches[sid])
            v_arr = np.array(speaker_word_volumes[sid])
            if len(p_arr) > 0:
                speaker_stats[sid] = {
                    "pitch_p10": np.percentile(p_arr, 10),
                    "pitch_p90": np.percentile(p_arr, 90),
                    "vol_p10": np.percentile(v_arr, 10),
                    "vol_p90": np.percentile(v_arr, 90)
                }
            else:
                speaker_stats[sid] = {
                    "pitch_p10": 150, "pitch_p90": 150, "vol_p10": -20, "vol_p90": -20
                }

        result = {}
        for utt in utterances:
            uid = utt["id"]
            rf = raw_features[uid]
            speaker_id = utt.get("speaker_id", "S0")
            stats = speaker_stats.get(speaker_id, {"pitch_p10": 150, "pitch_p90": 150, "vol_p10": -20, "vol_p90": -20})

            words_out = []
            for w in rf.get("words", []):
                words_out.append({
                    "word_index": w["word_index"],
                    "pitch_normalized": normalize_p10_p90(w["pitch_median_hz"], stats["pitch_p10"], stats["pitch_p90"]),
                    "volume_normalized": normalize_p10_p90(w["volume_mean_db"], stats["vol_p10"], stats["vol_p90"]),
                    "pitch_mean_hz": w["pitch_median_hz"],
                    "volume_mean_db": w["volume_mean_db"]
                })

            result[uid] = {
                "pitch_mean_hz": rf["pitch_mean_hz"],
                "pitch_normalized": normalize_values(rf.get("pitch_values", []), all_pitch_values),
                "volume_mean_db": rf["volume_mean_db"],
                "volume_normalized": normalize_values(rf.get("volume_values", []), all_volume_values),
                "speech_rate_wpm": extract_speech_rate(audio_path, utt["start"], utt["end"], utt.get("word_count", 5)),
                "words": words_out
            }

        print(json.dumps(result))

    finally:
        if audio_path != args.input and os.path.exists(audio_path):
            os.unlink(audio_path)

if __name__ == "__main__":
    main()
