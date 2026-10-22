# Noor Quran

Quran, translations, tafsir, recitation audio, hadith, prayer times with alerts, Qibla compass and Hijri date.
It's a Vite PWA, wrapped for Android and iOS with Capacitor 8.

Live web build: https://kapadia100.github.io/noor-quran-app/

## Features (v2.0)
- Quran reader with 118 translations, tafsir, recitation from 32 reciters. Audio plays continuously and auto-advances into the next surah, with lock-screen controls.
- **Word-by-word** (tap a word for its meaning, transliteration and audio; quran.com API) and **Hifz mode**. Hifz mode repeats each ayah N times and the whole range R times, can hide the text (tap to peek), and tracks memorised ayahs.
- **Mushaf** page view (604 pages, Uthmani offline; Indo-Pak script via quran.com), swipe between pages, Juz 1–30.
- Personal **notes** per ayah, bookmarks, last read, **daily reading streak**, **ayah of the day** (home + optional daily notification), and **share ayah as an image** (canvas, Web Share API).
- **Khatam planner** (finish-by date, daily page target, daily reminder).
- **Duas & azkar**: morning, evening, after salah, daily and selected duas, plus the full **Hisn al-Muslim** (132 chapters / 267 duas) with counters and audio.
- **Tasbeeh** counter (33/34/100/custom, vibration, multiple and custom dhikr, history). **99 Names of Allah** (English + Urdu meanings).
- **Prayer**: times, alerts, Qibla, Hijri date, **prayer tracker with qaza** counts, **Ramadan** sehri/iftar table + fasting tracker, **Islamic calendar** with event reminders.
- **Zakat calculator** (gold/silver nisab, your own prices, PKR default) and **nearby mosques** (OpenStreetMap map; Overpass, with Nominatim fallback).
- English/Urdu UI, dark mode, offline-first.
- Android home-screen widget: on the roadmap (needs a native Kotlin AppWidget; see docs/APP_DETAILS.md).

## What works offline
The app bundles, per surah, the verified Uthmani Arabic text (6,236 ayahs, with corrections applied), **Saheeh International (English)** and **Jalandhry (Urdu)** (`public/offline/s/`). It also bundles the duas, Hisn al-Muslim, the 99 Names and the 604-page mushaf map (`public/offline/x/`).
The tasbeeh, tracker, zakat, calendar, Ramadan, khatam and notes screens are fully local.
After the first launch, surah, juz/para reading, bookmarks, prayer times, Qibla and the Hijri date all work without a network.
Other translations, tafsir, hadith, search and audio load from the network. Anything already opened is cached by the service worker. If a non-bundled translation can't load, the reader falls back to the bundled English.

## Requirements
- Node 22+ (Capacitor CLI requires it). Vite and the tests also run on Node 20.
- Android: JDK 21 + Android SDK (platform 36). Or use the GitHub Action.
- iOS: a Mac with Xcode 16+, **or** the `iOS build` GitHub Action (macOS runner).

## Develop
```bash
npm ci
npm run dev            # http://localhost:5173
npm run lint
npm test               # vitest: Quran data/ayah fixes, juz, audio continuity, prayer, Hijri, Qibla
npm run test:e2e       # Playwright on iPhone 14 + Pixel 7 profiles (builds and previews automatically)
E2E_URL=https://kapadia100.github.io/noor-quran-app/ npx playwright test   # test the live site
```

## Deploy the web/PWA (GitHub Pages)
```bash
npm run build:pages    # BASE=/noor-quran-app/ vite build -> dist/
# publish dist/ to the gh-pages branch, e.g.:
npx gh-pages -d dist   # or: git worktree / subtree push
```
Bump the cache name `C` in `public/sw.js` whenever you change bundled data. That way users get it immediately.

## Android
```bash
./scripts/make-keystore.sh          # ONCE, on your own machine. Creates android/release.keystore + keystore.properties (gitignored). BACK THEM UP.
VERSION_NAME=1.0.0 VERSION_CODE=1 npm run android:aab
# -> android/app/build/outputs/bundle/release/app-release.aab (signed if keystore.properties exists, otherwise unsigned)
```
CI option: run **Actions › Android release (AAB)** after adding the secrets listed at the top of `.github/workflows/android.yml`.
`versionCode` must go up with every Play upload.

## iOS
Mac: `npx cap sync ios && npx cap open ios`, then pick your Team and run it on your iPhone.
No Mac: add the secrets listed in `.github/workflows/ios.yml`, then run **Actions › iOS build (TestFlight)**.
`Info.plist` already declares location, motion and background audio (for recitation when the screen is locked).

## App ID
`com.aamir.quranapp` is a **placeholder**. Choose your final reverse-domain ID before the first store upload, because it can never be changed afterwards.
Change it in `capacitor.config.json`, in `android/app/build.gradle` (`namespace` + `applicationId`), and in the Java package folder under `android/app/src/main/java/`. Then run `npx cap sync`. On iOS, the CI passes it as the bundle ID.

## Project layout
```
src/lib.js       pure logic (ayah corrections, basmala strip, juz ranges, refs, audio next-position, search highlight)
src/prayer.js    prayer times (adhan-js), alerts (web + native LocalNotifications), Qibla, Hijri
src/main.js      UI/router, reader, audio player (single <audio>, auto-advance, Media Session), hadith, search, settings
public/offline/  bundled Quran data      public/sw.js  service worker
tests/unit       vitest                  tests/e2e     Playwright
docs/APP_DETAILS.md  store listing + launch checklist
```

## Data sources & licences
Arabic text: Tanzil (credit required, text must not be modified; corrections are documented in QA_REPORT.md).
Translations and tafsir come via AlQuran.cloud. Many are **non-commercial only**, so check each one before monetising.
Hadith: fawazahmed0/hadith-api. Word-by-word + Indo-Pak: quran.com API v4. Azkar: fitrahive/dua-dhikr (MIT). Hisn al-Muslim text: wafaaelmaandy/Hisn-Muslim-Json (MIT); its audio streams from hisnmuslim.com (confirm permission before commercial release). 99 Names: AlAdhan API (English); the Urdu meanings come from asmaul-husna-api (licence not stated, so confirm or replace). Maps: © OpenStreetMap contributors (ODbL), Leaflet (BSD-2). Audio: cdn.islamic.network / everyayah. Fonts: Amiri Quran, Noto Nastaliq Urdu (OFL).
