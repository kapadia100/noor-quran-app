# Noor Quran: Store Listing & Publishing Pack
App ID (placeholder): `com.aamir.quranapp` · Project: `/workspace/quran-app` (Vite PWA + Capacitor Android/iOS)

## 1. App name ideas
"Islam 360" is a trademark, so don't use it or anything that looks like it.
- **Noor Quran**: Read, Listen & Tafsir (current working name)
- Huda: Quran & Hadith
- Al-Furqan Reader
- Quran Companion: Tafsir & Hadith
- Sakinah Quran
Before you pick one, search Play and the App Store for the name to check it isn't taken. Names can be up to 30 characters on both stores.

## 2. Store text
**Short description (Play, 80 chars max):**
Quran with 100+ translations, tafsir, 30+ reciters and hadith. Ad-free.

**iOS subtitle (30 chars):** Quran, Tafsir, Audio & Hadith

**Full description:**
Noor Quran gives you the Holy Quran with a clean, distraction-free reader.

• All 114 surahs in clear Uthmani Arabic script
• 100+ translations in 40+ languages, including Urdu, English, Hindi, Bengali, Indonesian, Turkish, French and more
• Tafsir for every ayah, with many tafsir editions to choose from
• Audio from 30+ famous reciters. Play one ayah or the whole surah, and the current ayah is highlighted as it plays
• Hadith collections (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasai, Ibn Majah and more) with Arabic text and translations
• Fast search across the Quran in Arabic or any translation. Type 2:255 to jump straight to an ayah
• Bookmarks and "continue reading"
• Dark mode, adjustable Arabic font size, and an English or Urdu interface
• No account, no tracking, no ads

Text sources: Tanzil.net (Quran text), AlQuran.cloud, everyayah.com, hadith-api (open data). See Credits in the app.

**Keywords (iOS, 100 chars):** quran,koran,tafsir,hadith,urdu,islam,muslim,recitation,ayah,surah,translation,bukhari,audio,quran majeed

**Category:** Play: *Books & Reference* (or *Education*). iOS primary: *Reference*, secondary: *Education* (or *Lifestyle*).
**Tags (Play):** Religion, Reference, Books.

## 3. Content rating answers (IARC on Play / Age Rating on iOS)
- Violence, sexual content, profanity, drugs, gambling, horror: **None**
- User-generated content or user-to-user chat: **No**. Shares location: **No**. Digital purchases: **No**
- Religious content: yes, but it isn't a rating factor. Expected rating: **Everyone / PEGI 3 / iOS 4+**
- Apple "Unrestricted web access": **No**. The app only loads fixed APIs and doesn't include a general browser.

## 4. Privacy policy
See `privacy.html`. You need to host it at a public URL (GitHub Pages, Netlify, or Google Sites) and paste that URL into both stores.
Summary: no personal data is collected. Settings, bookmarks and last-read position stay in the device's local storage only. Network requests go only to public content APIs (api.alquran.cloud, cdn.jsdelivr.net, cdn.islamic.network / everyayah audio, Google Fonts). Those servers can see standard request data like IP addresses, under their own policies. There are no analytics, no ads, and no accounts.

## 5. Play Data Safety form answers
- Does your app collect or share any of the required user data types? **No**
- Is all user data encrypted in transit? **Yes** (HTTPS only)
- Can users request data deletion? Not applicable, since no data is collected. Uninstalling or clearing app data removes the local settings.
- Ads: **No** · Target audience: **13+** (or "All ages". If you pick under 13, the Families policy applies, so 13+ is simpler.)
- Government app: No · Financial features: No · Health: No
**Apple App Privacy ("nutrition label"):** **Data Not Collected**.
Note: if you add analytics, Crashlytics, ads or login later, you must update both forms.

## 6. Licensing & attribution (read before publishing)
- **Quran Arabic text: Tanzil.net** (CC BY 3.0). The text must stay unmodified, you must credit Tanzil and link to tanzil.net, and you must include the license note.
- **Translations:** many Tanzil and AlQuran.cloud translations are licensed for **non-commercial use only** or require permission from the translator or publisher (for example, some Urdu and English editions). A free app with no ads is the safest choice. If you plan to charge money or show ads, first check each translation's license and remove any that don't allow commercial use.
- **Tafsir:** same caution. Check each edition's terms (for example, the King Fahd Complex editions).
- **Audio: everyayah.com / islamic.network CDN.** Credit everyayah.com and the reciters. Streaming is fine, but bundling the audio files inside the app needs permission.
- **Hadith: fawazahmed0/hadith-api** (Unlicense / public domain dataset). Individual translations can still have their own rights, so keep the source credits.
- **Fonts:** Amiri Quran and Noto Nastaliq Urdu are under the SIL Open Font License, which is fine.
- **Islam 360:** don't copy its name, logo, screenshots, UI or content. Everything in this pack is original.
- Add a "Credits & Licenses" screen (roadmap item) that lists every source. The README in the data zip has the full list.

## 7. Feature spec: current build (v1.0)
| Area | Status |
|---|---|
| Surah list with filter, Meccan/Medinan, ayah counts | ✅ |
| Reader: Uthmani Arabic, bismillah handling, translation picker (100+) | ✅ |
| Audio: per-ayah and full surah, 30+ reciters, highlight and auto-scroll, mini player | ✅ |
| Tafsir bottom sheet per ayah, edition picker | ✅ |
| Hadith: collections, books/sections, Arabic + chosen language, grades | ✅ |
| Search: Arabic or any translation, ref jump (2:255) | ✅ |
| Bookmarks, continue reading, copy ayah | ✅ |
| Dark mode, font size, English/Urdu UI, RTL | ✅ |
| Offline | ⚠️ Only screens already opened. The full offline bundle (534 MB data) isn't wired in yet |

## 8. Roadmap vs Islam 360-style feature set
| Feature | Priority | Notes |
|---|---|---|
| Fully offline Quran + 2–3 default translations bundled | P0 | Bundle around 10 MB of JSON and download more inside the app |
| Credits & Licenses screen | P0 | Required for store review and licensing |
| Prayer times + Azan notifications | P1 | `adhan-js` calculation + Capacitor Local Notifications + Geolocation (location permission means you must update privacy/data safety) |
| Qibla compass | P1 | Device orientation + great-circle bearing to Kaaba |
| Word-by-word translation & transliteration | P1 | Open quran.com WBW data (check its license) |
| Hifz mode (repeat ayah N times, range loop, hide text, progress) | P1 | Extends the current audio queue |
| Background audio + lock-screen controls | P1 | Capacitor media session plugin; iOS background audio mode |
| Downloadable audio for offline use | P2 | Filesystem plugin; needs permission for bundling/redistribution |
| Tafsir in Urdu (Ibn Kathir, Maududi, etc.) | P2 | Rights vary, so get permission |
| Daily ayah/hadith notification, reading streaks/khatam planner | P2 | |
| Tajweed colour-coded text | P2 | Tanzil/quran.com tajweed data |
| Duas & Azkar, Tasbeeh counter, Islamic (Hijri) calendar, 99 Names | P2 | |
| Notes/highlights, share ayah as image | P3 | |
| Mosque finder, Zakat calculator | P3 | |
| Optional cloud sync / account | P3 | Requires an updated privacy policy |

## 9. Publishing guide
### Prerequisites
- Build the web app: `cd /workspace/quran-app && npm run build && npx cap sync` (Capacitor CLI needs Node 22+. On this box, run it through `npx -y node@22 node_modules/@capacitor/cli/bin/capacitor sync`.)
- Change the app ID before your first upload. After you publish, it can never be changed. Use a domain you own, e.g. `com.yourname.noorquran`, and set it in `capacitor.config.json`, `android/app/build.gradle` (applicationId) and in Xcode (Bundle Identifier).
- Increase `versionCode`/`versionName` (Android) and the Version/Build number (iOS) for every release.

### Google Play ($25 one-time)
1. Create a developer account at play.google.com/console. You'll pay $25 and verify your identity. **New personal accounts must run a closed test with at least 12 testers for 14 days** before production access.
2. Create a signing key, and keep it backed up safely:
   `keytool -genkey -v -keystore noor-release.jks -alias noor -keyalg RSA -keysize 2048 -validity 10000`
3. Add the signing config in `android/app/build.gradle` (or use Android Studio → Build → Generate Signed Bundle), then run `cd android && ./gradlew bundleRelease` → `app/build/outputs/bundle/release/app-release.aab`.
4. In Play Console: Create app → name, language, App/Free. Then fill in the store listing (short/full description, 512 icon, 1024×500 feature graphic, phone screenshots from `mockups/android/`), privacy policy URL, App content (ads: no, content rating questionnaire, target audience, data safety: as above), and category.
5. Turn on Play App Signing and upload the .aab to Closed testing first, then Production. Review usually takes from a few hours to 7 days.

### Apple App Store ($99/year)
1. Join the Apple Developer Program (developer.apple.com/programs). You need an Apple ID with 2FA. Choose Individual or Organization (an organization needs a D-U-N-S number).
2. **You need a Mac with Xcode** (or a cloud Mac like MacinCloud, or a CI service like Codemagic, Ionic Appflow, or GitHub Actions macOS runners). Copy the `quran-app` folder, run `npm install && npx cap sync ios`, then `npx cap open ios`.
3. In Xcode: set the Team, the Bundle ID and the version. The AppIcon is already set to the 1024 icon. Run on a simulator or device to test.
4. In App Store Connect: My Apps → New App (bundle ID, name, SKU). Add the screenshots (6.7"/6.9": `mockups/ios/` at 1290×2796), description, keywords, support URL, privacy policy URL, App Privacy = Data Not Collected, and age rating 4+.
5. In Xcode: Product → Archive → Distribute → App Store Connect → Upload. Test it with TestFlight, then Submit for Review.
6. **Guideline 4.2 (minimum functionality) risk:** Apple can reject apps that are just wrapped websites. To avoid this, add offline content, native features (notifications for prayer times, background audio) and a polished native feel before you submit.

### Store asset checklist
| Asset | File |
|---|---|
| Play icon 512×512 | `icons/play-icon-512.png` |
| Play feature graphic 1024×500 | `icons/play-feature-graphic-1024x500.png` |
| Play phone screenshots (2–8) | `mockups/android/*.png` (1080×1920) |
| iOS icon 1024×1024 (no alpha) | `icons/ios-icon-1024.png` |
| iOS 6.7" screenshots | `mockups/ios/*.png` (1290×2796) |
| Privacy policy | `privacy.html` (host it publicly) |
| Debug APK for testing | `build/noor-quran-debug.apk` (not for upload) |

---
## 10. Launch checklist (v1.0.0)

### Decide before the first upload (permanent)
- [ ] **Final app ID.** `com.aamir.quranapp` is a placeholder (see README › App ID). It can't be changed after publishing.
- [ ] Final app name / icon (currently "Noor Quran").

### Accounts
- [ ] Google Play Console ($25 one-time). New personal accounts need **12 testers for 14 days** of closed testing before production.
- [ ] Apple Developer Program ($99/year) + App Store Connect app record with the same bundle ID.

### Android
- [ ] Run `scripts/make-keystore.sh` yourself. Back up `release.keystore` and the passwords (password manager + offline copy).
- [ ] Enable Play App Signing (default). Your keystore becomes the *upload* key.
- [ ] Build: `VERSION_NAME=1.0.0 VERSION_CODE=1 npm run android:aab`, or use the Android Action with secrets.
- [ ] Exact alarms: the app uses `SCHEDULE_EXACT_ALARM` for prayer alerts. Fill in the Play Console "exact alarm" declaration (prayer-time alarms), or alerts may be delayed on Android 14+.
- [ ] Data Safety: location (approximate/precise, on-device only, not collected), no account, no ads, no analytics.
- [ ] Upload to Internal testing, then Closed testing (12 testers / 14 days), then Production.

### iOS
- [ ] Create the Distribution certificate, App Store provisioning profile and App Store Connect API key. Add them as GitHub secrets (see `.github/workflows/ios.yml`).
- [ ] Run the iOS Action, install from TestFlight, and test on a real iPhone (audio with screen locked, alerts, compass).
- [ ] Guideline 4.2 (minimum functionality): the Quran text + Urdu/English translations, prayer times, Qibla and bookmarks all work offline. Point this out in the review notes.
- [ ] Privacy nutrition label: Location, used for app functionality, not linked to the user, not used for tracking.
- [ ] Screenshots: 6.9" (1320×2868) and 6.5" iPhone. Mockups are in `store-assets/mockups`.

### Content / legal
- [ ] **Adhan audio:** `adhan.wav` is a placeholder tone. Replace it with a recording you have rights to (Android: `android/app/src/main/res/raw/`, iOS: `ios/App/App/`, web: `public/`).
- [ ] Translation licences: keep only commercially permitted editions if the app will have ads or IAP. Credit Tanzil, AlQuran.cloud, everyayah/islamic.network and the hadith-api in About/Settings.
- [ ] Host the privacy policy at a public URL (`/privacy.html` on GitHub Pages works) and enter it in both stores.
- [ ] Get the Arabic text proof-read by a qualified person (hafiz) before release. Automated checks are in QA_REPORT.md.

### Final QA on real devices
- [ ] Android phone: GPS, compass, alerts at the exact prayer minute, adhan sound, reboot keeps alerts.
- [ ] iPhone: continuous recitation with the screen locked, lock-screen controls, alerts (iOS 64-notification limit means 7 days are scheduled, so open the app weekly).
- [ ] Airplane mode: reading Juz 1–30 and switching between Urdu and English.


---
## 11. v2.0 feature set (added 22 Oct 2026)
Tasbeeh · Duas & azkar + Hisn al-Muslim · 99 Names · Prayer tracker + qaza · Word-by-word · Hifz mode · Khatam planner · Mushaf (Uthmani / Indo-Pak) · Ayah notes · Islamic calendar + reminders · Ramadan sehri/iftar + fasting tracker · Zakat calculator · Nearby mosques (OSM) · Ayah of the day + share image · Reading streaks · Redesigned home dashboard.

### Roadmap: Android home-screen widget
Capacitor has no widget API, so this needs native code: a Kotlin `AppWidgetProvider` in `android/app/src/main/java/...` with a RemoteViews layout (next prayer + ayah of the day).
The web app would write the data into SharedPreferences through a small Capacitor plugin, and a `WorkManager` job would refresh it every 30 minutes. Estimate: about 1–2 days, plus testing on real devices.
On iOS the equivalent is a WidgetKit extension (Swift) that reads an App Group.

### Extra launch items for v2
- [ ] Confirm the licences for the **Urdu 99-Names meanings** (asmaul-husna-api) and the **hisnmuslim.com audio**, or replace them. Dua translations are English only, because no openly licensed Urdu Hisn al-Muslim was found. Add Urdu once a licensed source exists.
- [ ] Data Safety: the mosque search sends your approximate location to OpenStreetMap servers (Overpass/Nominatim). Declare this as "location shared with a service provider for app functionality".
- [ ] OSM tile usage policy: for heavy production traffic, switch to a commercial or self-hosted tile provider (MapTiler, Stadia, etc.).
