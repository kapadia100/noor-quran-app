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
