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
