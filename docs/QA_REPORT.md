# Noor Quran: QA Report (v1.0.0, 20 Oct 2026)

Tested against the local production build and the live site https://kapadia100.github.io/noor-quran-app/.
I used Playwright (headless Chrome) with an **iPhone 14** profile (390×844, touch, mobile UA) and a **Pixel 7** profile, with geolocation mocked to Karachi and the timezone set to Asia/Karachi.
I also ran ESLint, a manual code review and Lighthouse (mobile).

## Results summary
| Suite | Result |
|---|---|
| ESLint (`npm run lint`) | 0 errors (5 found and fixed) |
| Vitest unit (`npm test`) | **22 / 22 pass** |
| Playwright e2e, local (`npm run test:e2e`) | **36 / 36 pass** (18 tests × 2 devices); 102/102 on a 3× repeat for flakiness |
| Playwright e2e, live site | **36 / 36 pass** |
| Console errors / uncaught exceptions | 0 (checked after every e2e test) |
| Horizontal overflow at phone widths | 0 px on every screen tested |
| Android release build | `app-release.aab` (unsigned) + debug APK built OK |

## Lighthouse (mobile, local production build)
Note: Lighthouse 12 no longer has a "PWA" category. PWA validity is checked by the manifest and offline tests below.
| Screen | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Home (surah list) | 97 | 100 | 100 | 100 |
| Reader, Al-Baqara (286 ayahs) | 78 | 100 | 100 | 100 |
| Juz 30 (564 ayahs) | 77 | 100 | 100 | 100 |
| Prayer times | 99 | 100 | 100 | 100 |
| Qibla | 100 | 100 | 100 | 100 |
| Settings | 96 | 100 | 100 | 100 |
| Hadith | 84 | 100 | 100 | 100 |
| Search | 97 | 100 | 96 | 100 |

The long-reader performance scores are limited by DOM size (286–564 ayahs on one page) and the web-font download. Possible later improvement: virtualised ayah list.

## Per-feature cross-check
| # | Feature | Test done | Result | Notes |
|---|---|---|---|---|
| 1 | **Audio: continuous play (user-reported)** | Real MP3 playback in Chrome, seeking each track to its last 0.5 s and listening for `ended`. Played from 112:1 through 112:2–4, 113:1–5 and 114:1–6, with automatic navigation to the next surah. | **FIXED** | Root cause: the per-ayah ▶ button set `continuous=false`, so it stopped after one ayah. At the end of a surah, playback stopped (no next surah). A failed file also stopped the queue. Now there's one persistent `<audio>` element (needed for iOS), the next file is preloaded, playback auto-advances across ayahs **and surahs** (Settings: "Continuous play" and "Continue into next surah", both on by default), the reader follows into the next surah, and up to 3 consecutive bad files are skipped. |
| 2 | Audio: lock screen / background (iOS) | Code review + Media Session check | **FIXED** (needs real-device check) | Added the Media Session API (title, reciter, artwork; play/pause/next/previous on the lock screen). Added an optional **whole-surah audio** mode (single file per surah, the most reliable on a locked iPhone), with automatic fallback to ayah mode for reciters without surah files (e.g. Husary, verified with e2e). Added `UIBackgroundModes=audio` for the native iOS app. iOS Safari can't be automated here, so test on a real iPhone. |
| 3 | Audio: next / previous / close / reciter switch | e2e: 1:3 → next 1:4 → prev 1:3, highlight, switch to Husary keeps playing, close hides player | **FIXED** | Previous now goes back into the previous surah from ayah 1. Switching reciter mid-play continues at the same ayah instead of stopping. `play()` promise rejections are handled (autoplay block shows "Tap ▶"). |
| 4 | Surah list + filter | e2e: 114 items; "yasin", "Ya-Sin", "kahf", "rahman", "cow", "36" | **FIXED** | "yasin" found nothing (data says "Yaseen"). Added transliteration-tolerant matching. |
| 5 | Reader: Arabic text and corrections | Unit: 114 surahs / 6,236 ayahs = standard counts; all 7 verified fixes applied; basmala stripped from ayah 1 of surahs 2–114 (kept in 1:1, untouched at 27:30) | **PASS** | |
| 6 | Copy ayah | Code review | **FIXED** | Copy used the raw API text (uncorrected, with basmala prefix). It now copies the corrected text. |
| 7 | Translation switch (Urdu RTL, French, Indonesian, English) | e2e: `dir` attribute + non-empty text for each | **PASS** | Urdu shows RTL with the Nastaliq font. |
| 8 | Juz / Para 1–30 | Unit: the 30 juz cover all 6,236 ayahs exactly once. e2e: Juz 1 = 148, Juz 15 = 185, Juz 30 = 564 ayahs | **FIXED** | Juz reader now builds from the bundled verified text, so it works offline and uses the same corrections. Invalid juz numbers redirect to the list. The Urdu font class was missing in the juz reader. |
| 9 | Tafsir sheet | e2e: 1:1 tafsir loads (>20 chars) | **FIXED** | If the edition list failed, the sheet stayed on "Loading…" forever. It now shows an error. |
| 10 | Hadith browse (collections → book → hadiths) | e2e: Bukhari → first book → hadith cards | **FIXED** | The language `<select>` was missing `.join('')`, which put stray commas into the markup. Also added an aria-label. |
| 11 | Search: translation | e2e: "patience" (Sahih) gives results + `<mark>` highlight | **FIXED** | Highlighting ran a regex over already-escaped HTML, so searching "amp"/"quot" could corrupt the output (HTML-injection risk). It now uses safe highlight-then-escape (unit-tested). |
| 12 | Search: Arabic | e2e: "الرحمن" in quran-simple-clean gives results | **PASS** | |
| 13 | Search: no results | e2e: nonsense word shows "0 results" | **FIXED** | The API 404 "no matches" response is now handled explicitly. |
| 14 | Search: 2:255 jump + invalid refs | e2e: `2:255` opens Al-Baqara at 255. `1:9` shows "Invalid reference". `#/surah/999` returns to home | **FIXED** | Before, "115" or "1:9" opened a broken page with a load error. Now refs are validated against the ayah counts (also accepts `2 255`, `2.255`). |
| 15 | Bookmarks | e2e: add 36:1, reload, shown on Bookmarks | **PASS** | |
| 16 | Last read | e2e: open Yaseen, reload, "Continue reading 36:…" | **FIXED** | It was only saved after scrolling. It's now saved on open as well. |
| 17 | Navigation race | e2e found the screen being overwritten | **FIXED** | A slow screen (e.g. a surah still loading) could finish *after* you navigated away and overwrite the new screen. Each route now renders into its own container, and stale renders are discarded. |
| 18 | Dark mode | e2e: toggle, persists after reload | **PASS** | |
| 19 | Urdu UI | e2e: `dir=rtl`, nav labels in Urdu, persists | **PASS** | |
| 20 | Prayer times (GPS Karachi) | e2e with mocked GPS. Unit: Karachi 20 Oct 2026 vs **aladhan.com** (Karachi method, Hanafi) all within ±2 min (Fajr 05:16, Sunrise 06:32, Dhuhr 12:17, Asr 16:24, Maghrib 18:01, Isha 19:17). All 40 cities × 12 methods give valid, correctly ordered times | **FIXED** | Times were calculated for the *device's* date, not the city's. With a city in a different timezone (e.g. Sydney chosen from Pakistan), the wrong day's times were shown. Fixed and unit-tested. GPS errors now show "permission denied / timeout / unavailable". |
| 21 | Calculation method / Asr switch | e2e: Karachi → MWL changes Isha. Back to Karachi gives Asr 4:2x PM | **FIXED** | An unknown or removed saved method crashed the page. It now falls back to Karachi. |
| 22 | Prayer alerts toggles | e2e: untick Fajr → "alerts scheduled" → persists after reload | **FIXED** | On every launch the app called `Notification.requestPermission()` without a tap. iOS/Chrome block or penalise this. Alerts are now re-armed on launch only if permission was already granted. |
| 23 | Qibla bearing + compass | Unit: Karachi 267.7°, London 119.0°, turn-direction math. e2e: mocked `deviceorientationabsolute` heading 267.7° shows "✅ Facing Qibla" | **FIXED** | Denied motion permission (iOS) or no sensor used to fail silently. Both now show a clear message. |
| 24 | Hijri date + adjustment | Unit: date changes with +1, clamped to ±2. e2e: +1 changes the date card | **PASS** | |
| 25 | Offline (service worker) | e2e: load, go offline, reload; Al-Kahf (110 ayahs + translation), Juz 30 and prayer times all render | **FIXED** | Before, reading needed the network (only previously opened screens worked). It now bundles the verified Arabic + Urdu Jalandhry + English Sahih (3.6 MB, precached). Other translations fall back to the bundled English with a notice. The API is network-first (fresh data), and the SW cache was bumped to `noor-v3`. Reduces the Apple 4.2 risk. |
| 26 | PWA manifest | e2e: name, `display: standalone`, 512 icon, all icon URLs 200 | **PASS** | |
| 27 | Settings (size, toggles) | e2e: font size persists, new audio toggles present | **PASS** | |
| 28 | Accessibility | Lighthouse | **FIXED** | Touch targets under 44 px (header/nav/player buttons), muted-text contrast 4.43:1 (raised to ≥4.5), unlabeled selects and inputs (city, hadith language, search, tafsir). All screens now score 100. |
| 29 | SEO / basics | Lighthouse | **FIXED** | Added a meta description and robots.txt. |
| 30 | Edge cases: API down / no network | Code review + offline e2e | **FIXED** | Edition lists and reciter list fall back offline instead of failing the whole reader. A failed audio surah list shows a toast instead of an uncaught error. |
| 31 | Lint | ESLint flat config | **FIXED** | 5 unused variables/imports removed. |

## Not verifiable here (needs a real device)
- iPhone: recitation with the screen locked or the app in the background, lock-screen controls, Add-to-Home-Screen notifications (iOS ≥16.4).
- Android native: exact-time alerts, the adhan sound channel, alerts surviving a reboot, the real compass.
- Arabic text: automated letter-by-letter checks against quran.com pass. A human proof-read is still recommended before release.
