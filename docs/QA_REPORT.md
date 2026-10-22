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

---
# v2.0: New features QA (22 Oct 2026)

## Results summary (v2)
| Suite | Result |
|---|---|
| ESLint | 0 errors |
| Vitest unit | **36 / 36 pass** (22 v1 + 14 new: mushaf pages, Hijri events, Ramadan, zakat, khatam, streak, ayah of the day, hifz engine, distance/wrap, bundled data integrity) |
| Playwright e2e, local | **68 / 68 pass** (34 tests × iPhone 14 + Pixel 7; 16 of the tests are new v2 ones) |
| Playwright e2e, live site | **68 / 68 pass** (see the deploy check at the end) |
| Console errors / horizontal overflow | 0 on every new screen |
| Android debug APK + unsigned AAB (v2.0.0, versionCode 2) | built OK |

## Lighthouse (mobile, v2 production build)
| Screen | Perf | A11y | Best practices | SEO |
|---|---|---|---|---|
| Home dashboard | 96 | 100 | 100 | 100 |
| **Al-Baqara reader** | **95** (was 78) | 100 | 100 | 100 |
| Juz 30 | 81 | 100 | 100 | 100 |
| Mushaf page 42 | 87 | 100 | 100 | 100 |
| Duas | 87 | 100 | 100 | 100 |
| Tasbeeh | 95 | 100 | 100 | 100 |
| 99 Names | 99 | 100 | 100 | 100 |
| Calendar | 94 | 100 | 100 | 100 |
| Prayer tracker | 94 | 100 | 100 | 100 |
| Nearby mosques | 85 | 100 | 93 | 100 |

The mosques best-practices score of 93 comes from third-party OSM map tiles. Speed-ups:
- Long surahs render progressively, 30 ayahs at a time, with more added as you scroll.
- Quran data is split into 114 small per-surah files instead of one 1.4 MB file.
- Leaflet is only loaded on the mosques screen.

## Per-feature cross-check (v2)
| # | Feature | Test done | Result | Notes |
|---|---|---|---|---|
| 32 | Home dashboard redesign | e2e: ayah of the day shown, 18 feature tiles, streak, khatam progress card appears once a plan exists | PASS | Bottom nav is now Home / Quran / Duas / Prayer / More. Smooth fade-in between screens, which respects reduce-motion. |
| 33 | Tasbeeh | e2e: 33 taps hit the target, vibration + toast; preset 100; −1; save & reset writes history; custom dhikr persists after reload | PASS | `navigator.vibrate` on target (Android; iOS Safari has no vibration API). |
| 34 | Morning/evening azkar, after salah, daily, selected duas | e2e: 19 morning + 19 evening; counter fills to n and the card is marked done | PASS | fitrahive/dua-dhikr (MIT): Arabic, transliteration, English, source. Counters reset daily. |
| 35 | Hisn al-Muslim | e2e: 132 chapters, search "sleep", open chapter, audio button present. Unit: 267 duas, all https audio | PASS (partial) | Text is MIT (wafaaelmaandy). Audio streams from hisnmuslim.com; confirm permission. **No openly licensed Urdu translation found, so English only.** |
| 36 | 99 Names | e2e: 99 cards, search, detail sheet with Urdu. Unit: all 99 have Arabic, transliteration, English and Urdu | PASS (partial) | English from AlAdhan. Urdu from asmaul-husna-api (licence not stated, so flagged). **No audio**: no openly licensed recording found. |
| 37 | Prayer tracker + qaza | e2e: mark prayed (1/5); prayed → missed adds to qaza; +/− counters; persists after reload | PASS | |
| 38 | Word-by-word | e2e: toggle loads words from quran.com, tap shows meaning + transliteration, plays word audio | PASS | Language: Auto (EN/UR follows the app) or choose hi/bn/id/tr in Settings. Needs internet the first time; cached afterwards. |
| 39 | Hifz mode | e2e with real audio: 112:1–2, each ×2, range ×1, gives the exact sequence 1,1,2,2 then "complete"; hide-text blur on; memorised ayah marked and counted. Unit: hifzNext gives 1,1,2,2,1,1,2,2 for range ×2 | PASS | The player shows 🔁 repeat/range counters. |
| 40 | Khatam planner | e2e: 30-day plan gives a 20–21 pages/day target; "+target" updates; dashboard card shows. Unit: plan math | PASS | Daily reminder (time picker) through native/web notifications. |
| 41 | Mushaf 604 pages | Unit: 604 pages cover all 6,236 ayahs once and in order; 2:255 is on p.42, 18:1 p.293, 36:1 p.440, 67:1 p.562. e2e: p.1 has 7 ayahs, p.604 has 15, Indo-Pak switch, go-to-page | PASS | Uthmani works offline. Indo-Pak uses quran.com `text_indopak` + Scheherazade New. Swipe changes pages (book direction). |
| 42 | Notes per ayah | e2e: add note, shown under the ayah and in the Notes list | PASS | Stored on device only. |
| 43 | Islamic calendar + events + reminders | e2e: month grid with Hijri days, next month, upcoming events, reminder toggle. Unit: events in order; Ramadan → Eid al-Fitr is 29/30 days | PASS | Umm al-Qura, plus the user's Hijri ±2 adjustment for local moon sighting. |
| 44 | Ramadan sehri/iftar + fasting tracker | e2e: 29-row table, tick fast, counter updates | PASS | Sehri = Fajr, Iftar = Maghrib, using the chosen method/city. Next Ramadan ≈ 8 Feb 2027. |
| 45 | Zakat calculator | e2e: PKR default; silver 250/g + cash 200,000 gives due 5,000; 100,000 is below nisab; gold basis nisab 2,624,400 at 30,000/g. Unit: debts, holdings, negatives | PASS | The user enters current prices; no price API. |
| 46 | Nearby mosques | e2e + screenshots: map + 46 mosques listed near Karachi centre with distance + OSM directions | **FIXED during QA** | Overpass returned HTTP 406 from the test network, so I added fallback mirrors and a Nominatim fallback (filtered to religion=muslim), plus a cached last result. |
| 47 | Ayah of the day + share image | e2e: share opens a 1080×1350 PNG card (download fallback when Web Share with files is unsupported). Unit: deterministic per date, valid refs | PASS | Optional daily notification in Settings (time picker). |
| 48 | Reading streak | e2e: opening a surah turns the streak to 1. Unit: streak math incl. "not yet today" | PASS | Counts days with reader or mushaf activity. |
| 49 | Long-surah performance | e2e: Al-Baqara first render < 80 ayahs; deep link 2:250 lands in view | **FIXED** | Progressive rendering + per-surah data. Lighthouse 78 → 95. |
| 50 | Urdu UI + dark mode on new screens | e2e: all 9 new screens RTL in Urdu; tiles translated; dark screenshots captured | PASS | |
| 51 | Offline for new data | e2e: offline reload, then Hisn al-Muslim, 99 Names, Mushaf p.100, Tasbeeh, Zakat and Calendar all render | PASS | SW cache `noor-v5` precaches 342 per-surah files + the v2 datasets. |
| 52 | Android home widget | Not implemented | **ROADMAP** | Needs native Kotlin AppWidget + a small plugin; design and estimate in APP_DETAILS §11. |
| 53 | Bugs found while building v2 | e2e | **FIXED** | Stale note after editing (reader re-render); word-audio clip showed the main player; deep-link scroll drifted after fonts loaded; heading order / label-name a11y issues on new screens. |

## Partial / needs you
- Urdu translations for duas/Hisn: no open licensed source found, so English only (Urdu UI labels are done).
- 99 Names audio: not added (no openly licensed audio found).
- Licences to confirm: Urdu 99-Names meanings (asmaul-husna-api) and hisnmuslim.com audio.
- Home-screen widget: roadmap.
- Real-device checks: vibration, notifications, compass, locked-screen audio.
