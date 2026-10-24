# Qaida live reading (v3.1.0)

Two modes, never mixed up on screen:

| Mode | Where | What drives it | Graded? |
|---|---|---|---|
| **Follow-along** | letters, harakat/tanween grids | pace follower (`src/qaida-pace.js`): microphone level only. One spoken burst = one item. | **No.** Label: "not checked". Blue highlight only. |
| **Checked reading** | word rows (sukoon, shadda, madd, leen, practice words) | pace follower cuts each burst; the on-device speech model scores that burst against the words of the row (`gradeClosed` in `src/qaida-grade.js`). | Confirmed (green ✓) or neutral grey "not confirmed". **Never red.** |

Hear & repeat with self-rating is unchanged and is the fallback for everything.

## Why not grade letters and syllables
The 16M CTC model is trained on Quran recitation. Isolated letters/syllables found the expected consonant only 3.6 % of the time and isolated Quran words only 22/45 with free decoding. No small open Arabic letter-name/phoneme model was adopted: fine-tuning a head was out of scope, so isolated letters are follow-along only and say so.

## Word check = closed set
Free decoding turns one word into something unrelated. Instead each burst is scored with the CTC forward algorithm for every word of the row, and the expected word is confirmed only if it beats every differently-spelled word by >= 2 nats and is within 14 nats of the best path. Measured on 45 Quran words (groups of the real lesson rows, 320 wrong pairs), `/home/box/qs-asr/v31/wgrade2.mjs`:

| Condition | correct confirmed | wrong word accepted (per wrong pair) |
|---|---|---|
| clean | 64.4 % | 0.63 % |
| phone 20 dB SNR | 44.4 % | 1.25 % |
| phone 12 dB SNR | 35.6 % | 2.19 % |

(free decoding with sim >= 0.6: 44 / 33 / 27 % confirmed, 2.2-3.1 % wrong accepted.) A miss is shown as grey "not confirmed", because it is mostly the model failing, not a mistake.

## Pace follower
10 ms frames, adaptive noise floor (400 ms warm-up that only measures the room), burst starts after 40 ms above floor+9 dB, ends after 150 ms below floor+6 dB, bursts under 90 ms (clicks/taps) are taken back. Synthetic Qaida readings built from the CC0 clips: exact item count in clean and white noise down to 15 dB SNR at every tested speed, no over-count; at 8 dB SNR 82-98 % of items are counted (under-count only). Limits: needs a short pause (~150 ms) between items; noise or other voices can merge/miss bursts; it does not verify what was said. Tapping an item moves the position there.

## v3.2.0 changes (why "live" did not feel live on iPhone in v3.1.0)
- The Start button was a small ghost button inside the lesson, checked mode needed a second "Download tutor" tap, follow-along lit up blue (Quran tutor is green) and there was no way to hear the right answer while reading. Qaida was also not on Home.
- Now: a big green **Start reading live** card with a red LIVE badge is the first thing in every lesson; tapping it is the only step (the ~19 MB word checker downloads automatically the first time, falling back to read-along if offline). The AudioContext is created inside the tap (iOS requirement), before the mic permission and the download.
- Items turn **green** as they are read. Letters/syllables are tracked by voice ("tracked by voice", not graded, stated on the card and in the panel). Real words get a ✓ only when the on-device checker confirms them; grey = not confirmed; no red.
- **Hear it** (plays the next item, or the last unconfirmed word) and tap-a-grey-word/summary chips play the correct audio. The mic feed is muted while reference audio plays (`hold()`), so the app never hears itself.
- Adaptive pace: 0.8 s room calibration (15th percentile), trigger = room + 9 dB with an absolute floor of -66 dBFS (was -52), so quiet phone mics work. "I cannot hear you" / "microphone looks silent" hints after 5 s with no item.
- On-screen level meter with the trigger line and a dB read-out (mic / line / room / heard) for debugging on a real phone.
- Home: Quran, Recite & Learn and Qaida (LIVE) are three compact cards in one row.

## v3.3.0: "it marks OK when I am not reading" (root cause and fix)
**Root cause (proven).** v3.2.0 follow-along counted a spoken burst whenever the microphone level rose 9 dB above an adaptive floor for 40 ms. Nothing in that test knows what a voice is, so taps, coughs, a fan starting, music, a TV, a flushing toilet or somebody else talking each counted as an item. iOS automatic gain makes it worse (it lifts the room until the floor-relative test fires). Replaying 7.2 h of non-speech audio (about 50 sound classes, raw and through an AGC model of the iPhone chain) through the v3.2.0 detector gave **5,726 false advances (795 per hour)**.

**Fix.** `src/silero.js` is a JavaScript port of the Silero VAD v5 voice model (MIT, weights in `public/vad/silero16k.bin`, matches the reference ONNX to 1e-7, about 0.8 ms per 32 ms frame). `src/qaida-pace.js` now counts a burst only when the voice model says "speech" with hysteresis (on 0.5, off 0.3), the burst is 160 ms to 1.6 s, its level is at least 8 dB over a floor learned only from non-speech frames, its mean voice probability is at least 0.65, and the burst is not a long run (a long run is revoked and locked until it goes quiet). `VadGain` lifts quiet phone mics for the voice model only (capped +36 dB, never boosts the level that feeds the SNR test).

| Test (7.2 h non-speech, 3.0 h transient, 1.0 h vocal noises) | v3.2.0 | v3.3.0 |
|---|---|---|
| False advances, all non-speech | 5,726 (795 / h) | **1 (0.14 / h)** |
| Noise streams failing (fan, white/pink, music, engine ...) | most | **0 / 64** |
| Vocal noises (cry, snore, breath, cough) failing | many | **0 / 20** |
| Taps / clicks / footsteps / flush failing | many | 1 / 60 |
| Real reading, exact item count | 71.9 % (before gain) | **77.2 %**, 0 over-counts in 1,080 runs, mean lag about 50 ms |

**What follow-along still cannot do.** It is a voice follower. Real unrelated speech in front of the phone (somebody talking, the lesson audio itself played on the speaker, another reciter) is still speech and still moves it on (measured: 58 advances in 0.8 h of English / Urdu / Arabic speech). The lesson audio from the app's own speaker is muted from the follower while it plays. Content cannot be verified in this mode; use Checked reading for that.

**Checked reading.** A word is confirmed only if (a) the voice model accepted the burst, (b) the expected word beats every other word of the row by a margin (2), the next-best by a gap (14), and (c) it beats the "all blank" (silence/garbage) path by at least 15 log units. The false-accept rate on noise fell from 4.3 % to about 0.1 %, and 0 % on lesson audio. The cost is honest: isolated words are confirmed only about 13-22 % of the time (the model is trained on running Quran recitation); a miss is a grey "not confirmed", never red.

**Quran live.** Same root cause class: the decode gate was an energy gate, defeated by the iPhone AGC (every 400 ms chunk counted as voiced). Now (1) decoding only runs when 3 of the last 5 voice-model frames are speech, (2) a decode result with less than 0.3 s of speech in its window is dropped, (3) nothing is painted or locked until the first words of a session are confirmed (three strong consecutive words, or two exact words of 7+ letters), because unrelated speech can land on one or two look-alike words ("ism wallah" ~ "bismillah"). Measured through the real model and tracker (45 s streams): non-speech false-green streams 3 / 72 -> **0 / 72** and decodes 6,004 -> 5; unrelated English / Urdu / Arabic / synthetic speech false-green streams 8 / 8 (19 greens) -> **0 / 8**; the lesson and other-reciter streams stayed 0. Real recitation of 38 test clips: every word still turns green (249 / 249), no new red; the first words appear together at word 2-3 (mean time from the end of a word to its green: +0.09 s, was -0.28 s; 90th percentile 1.5 s, was 0.56 s, because the first words wait for the start check).

**Connected recitation.** `judge` / `align` (src/recite-core.js) score each word against its neighbours and 2-3-word junctions: wasl endings, hamzat al-wasl dropped after a vowel, lam shamsiyya, idgham (with and without ghunna), ikhfa, iqlab, tanween/vowel endings, waqf vs wasl, madd, merged words. At most one word of a merge may use an altered form so a skipped word cannot be hidden. 31 hand-written connected cases (tests/fixtures/connected-cases.json): fully OK 19 -> 31, red 0 -> 0, and wrong-word / skipped-word variants of the same cases are never accepted. On 166 real ayah recordings the model already writes the standard spelling, so the result is unchanged (99.8 % green, 0 red) - the junction rules are a safety net, not a measured gain on real audio.

**Also in v3.3.0.** Headset / AirPods disconnect and phone calls stop the mic with a clear message (track end + audio-context interruption), screen wake lock while listening, level meter and 0.8 s room calibration for the Qaida live panel.

**Not done / not verifiable here.** A larger WebGPU Quran model (no WebGPU device to test on and no validated larger model), beam multi-hypothesis tracking, DTW alignment, an extra rejection model for isolated letters. A real iPhone test is still needed for microphone route, AGC and speaker-bleed behaviour.

## v3.3.1: "I read correctly but connect the words and the tutor gets stuck" (iPhone)

**Root causes (measured, not guessed).**
1. *The voice gate closed in the middle of a verse.* v3.3.0 needed p>=0.5 on 3 of 5 voice-model frames and a 0.3 s minimum. Soft, blended or room-reverberant recitation sits at p=0.2-0.5 for whole words, so the gate shut, decoding stopped (about 9 decodes instead of 16 on the same clips) and nothing could advance. The recogniser itself was fine: a one-shot decode of the same audio was 99.5 % OK.
2. *Start verification demanded a clean run beginning exactly at word 1.* A soft, garbled or very short first word (an `ام`-type word, a hamza-initial word heard as another word) never verified, even when words 2-7 matched perfectly. Short 3-word ayat with one unclear word never reached a run of 2.
3. *A persistently unclear word froze the visible prefix.* Its streak never cleared, and the "unclear" lock needs two later OK words, which cannot exist at the end of an ayah.

**Fix (all green marks still need real evidence; nothing is ever marked wrong because of it).**
- `src/voice-gate.js`: hysteresis. A frame must be clearly voiced (p>=0.3, 2 of the last 5 frames) to OPEN the gate; once speech is running it stays open through weaker frames (p>=0.12) for 2.5 s, decoding is allowed 4 s after the last voice, and a window needs 0.15 s of voice to be trusted.
- `startEvidence` (`src/recite-live.js`): ordered phrase match instead of "3 strong words from word 1": the run may start up to 2 words into the ayah, may contain one blurred word, and is scored by letters matched (long exact words count for more). One or two look-alike words are still never enough.
- Persisted-unclear words no longer block the contiguous prefix (they stay neutral, never red).
- `Tracker.realign`: after verification, if nothing advances for 2.5 s while words are heard, look 1..12 words ahead (40 after 6 s) for a strong ordered run; adopt it, mark the words in between neutral ("unclear", never red).
- Visible fallback: speech heard but no progress for 4 s shows "Keep reading, I'm listening" and re-aligns at once (every 6 s at most). Nothing is marked and no help card appears.

**Measurements.** See the release notes: per-word green rate, time-to-lock and stall before/after on 66 real recitation clips under 8 conditions (clean, 1.25x, 1.5x, phone-mic chain, low volume, reverb, 16 kHz narrow, combined "hard"); false-green audit over 72 non-speech + speech streams (0 / 72, unrelated speech 0 / 8) and 66 real clips tracked against a different ayah (0 false greens).

## v3.4.0 — Hifz Test (حفظ ٹیسٹ)
- Entry: its own tile in **More** (`#/hifztest`) and a "Hifz Test" tile in the surah reader tools. Not on Home.
- Setup: surah + ayah range or a juz (first surah of the juz), show translation, auto-continue; past tests listed (last 50, localStorage `qsHifzTests`).
- Live: same pipeline as Recite & Learn (voice gate, phrase-start verification, re-align) in a hidden-text mode `hifz`. Words reveal only from tracker greens.
- Mistake card ("Mistake here") only on tracker `bad` events (wrong/skip); shows + plays the correct word; "Retry from this ayah". Pause ~4 s → next word shown, counted as a hint (never a mistake). Hint button: first letter, then word.
- Auto-locate (`src/hz-locate.js`): before the first verified phrase, each other ayah start in the range is tested with its own cached Tracker; moves only the start pointer; accepted only if hits are within 3 neighbouring ayat.
- Measured (66 real clips, flat starting up to 3 ayat earlier than the recited ayah): located 54/60 clean, 54/60 phone, 55/60 hard, 0 wrong locations, 0 false reveals before the true start, 0 red; words revealed 96.0% / 95.8% / 89.1%.

## v3.4.1 — Hifz Test: simple blurred page, strict auto-locate
- Pick a surah → whole surah blurred, mic auto-starts, correct words unblur in place; mistake → pause, vibrate, "Mistake — listen", word recited aloud. Settings (range/juz/translation off/auto) in ⚙.
- Auto-locate needs ≥4 ordered words (≥14 letters, phrase-start verified) at the same place on 2 consecutive checks; regression replay of far-mic synthetic English speech: 0 moves, 0 greens (v3.4.0: 4).
- Non-reading audit: 0 false greens. Real recordings (located/words revealed): clean 54/60, 96.0%; phone 54/60, 96.0%; hard 51/60, 87.1%; 0 wrong locations, 0 red; locate median ~4.5 s.
- Spliced mistakes (48 each, 35 located): skip flagged 28/35 (14 red + 14 held→coach), replace 25/35 (11+14), 1 replaced word wrongly revealed, 0 false red elsewhere.
- Urdu UI → Urdu translation; juz test chains all surahs of the juz.
