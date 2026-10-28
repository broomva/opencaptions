import os
import tempfile
import numpy as np
import scipy.io.wavfile as wavfile
import pytest

from extract_vocal import extract_pitch_praat

def test_extract_vocal_synthetic_tone():
    # Generate synthetic tone sweep: 1 second, 150 Hz to 250 Hz
    sr = 16000
    duration = 1.0
    t = np.linspace(0, duration, int(sr * duration), False)
    
    # Instantaneous frequency: f(t) = 150 + 100*t
    # Phase = integral of frequency = 150*t + 50*t^2
    phase = 2 * np.pi * (150 * t + 50 * t**2)
    y = np.sin(phase)
    
    # Save to temp wav
    fd, path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    
    try:
        y_int16 = np.int16(y * 32767)
        wavfile.write(path, sr, y_int16)
        
        # Test first half (0 to 0.5): pitch should be ~ 175 Hz
        p1, _ = extract_pitch_praat(path, 0.0, 0.5)
        # Test second half (0.5 to 1.0): pitch should be ~ 225 Hz
        p2, _ = extract_pitch_praat(path, 0.5, 1.0)
        
        # Ensure extraction works and rising pitch is detected
        assert p1 is not None and p1 > 0
        assert p2 is not None and p2 > 0
        assert p1 < p2
        assert 160 < p1 < 190
        assert 210 < p2 < 240
    finally:
        os.remove(path)


def test_detrend_removes_declination_but_keeps_a_stressed_word():
    from extract_vocal import detrend
    times = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5]
    falling = [20.0 - 2 * t for t in times]          # a plain declining contour
    falling[3] += 3.0                                 # one stressed word in the middle
    out = detrend(falling, times)
    assert out.index(max(out)) == 3                    # the stressed word, not the first word, is now highest
    assert abs(sum(out) / len(out) - sum(falling) / len(falling)) < 1e-9

def test_detrend_leaves_short_utterances_alone():
    from extract_vocal import detrend
    assert detrend([1.0, 2.0], [0.0, 1.0]) == [1.0, 2.0]
