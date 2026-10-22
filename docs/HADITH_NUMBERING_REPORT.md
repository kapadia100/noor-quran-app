# Hadith numbering verification (Quran Safar v2.4.0)

Generated 2026-10-22. Data source in app: fawazahmed0/hadith-api@1 (jsDelivr). Independent source: **sunnah.com** public pages (fetched politely: one request at a time, about 0.6 s apart).

Method: for each collection, check the first hadith, the last hadith and 50 random international numbers (seed 42); fetch `sunnah.com/<collection>:<n>`; compare the English text by word overlap (pass if ≥ 0.60 of the shorter text). For Muwatta Malik the whole collection was checked, book by book. Totals are the entries in the hadith-api English edition.

| Collection | Entries (with text) | Last intl no. | Sample checked | Text matches sunnah.com | Numbering scheme / action |
|---|---|---|---|---|---|
| Sahih al-Bukhari | 7589 (7580) | 7563 | 52 | **52/52** | Fath al-Bari / sunnah.com sequential (1–7563). hadith-api number = international number. Parts split as x.2/x.3 (e.g. 402.2) are shown as x, as sunnah.com cites them. |
| Sahih Muslim | 7563 (7360) | 3031 | 52 | **52/52** | **Different scheme in source.** hadith-api `hadithnumber` is a sequential English/in-book count (1–7563); the internationally cited number is **Muhammad Fu'ad Abd al-Baqi** (1–3033 with a/b/c sub-numbers), carried in `arabicnumber` (e.g. 2564.02). **Fixed:** app now shows and searches the Abd al-Baqi number (2564, 2564b…) via bundled `muslim-map.json` (7,239 keys). |
| Sunan Abi Dawud | 5274 (5272) | 5274 | 52 | **52/52** | sunnah.com numbering (Muhyi al-Din Abd al-Hamid, 1–5274). Matches hadith-api. |
| Jami' at-Tirmidhi | 3998 (3926) | 3956 | 52 | **52/52** | sunnah.com numbering (Ahmad Shakir, 1–3956). Matches; x.2 parts shown as x. |
| Sunan an-Nasa'i | 5765 (5679) | 5758 | 52 | **52/52** | sunnah.com numbering (Abu Ghuddah, 1–5758). Matches; x.2 parts shown as x. |
| Sunan Ibn Majah | 4343 (4340) | 4341 | 52 | **52/52** | sunnah.com numbering (Abd al-Baqi, 1–4341). Matches. |
| Muwatta Malik | 1858 (1818) | Book 61 | all 61 books, 1945 sunnah.com narrations | 1787/1818 mapped after fix (before: 99/527 in-book refs agreed) | **Different scheme.** hadith-api numbers Muwatta sequentially (1–1858) and its book/hadith refs do not match sunnah.com. sunnah.com cites Muwatta as **Book X, Hadith Y** (USC-MSA English reference), with a separate Arabic number. Our sequential number was 1–3 lower than sunnah.com's Arabic number in 497/527 sampled cases. **Fixed:** scraped all 61 sunnah.com Muwatta book pages, matched every narration by text, and bundled `malik-map.json`. 1,787 of 1,818 hadiths with text map to a sunnah.com Book/Hadith reference. Cards show "Muwatta Malik, Book 3, Hadith 22", and search accepts "Malik 3/22" or the sunnah.com Arabic number. |
| 40 Hadith an-Nawawi | 42 (42) | 42 | 42 | **42/42** | 1–42 on both. |
| 40 Hadith Qudsi | 40 (40) | 40 | 40 | **40/40** | 1–40 on both. |
| 40 Hadith Shah Waliullah | 40 (40) | 40 | 40 | **40/40** | 1–40 on both. |

## Spot checks of sub-numbers
- `muslim:2564b`: sunnah.com shows "Sahih Muslim 2564 b". The app's 2564b gives the same narration.
- `bukhari:402`, `tirmidhi:391`, `nasai:3533`: sunnah.com shows a single number. hadith-api splits these into 402 / 402.2 and so on, and the app labels both parts with the base number.

## Mismatches found and fixed
1. **Sahih Muslim**: the app showed the hadith-api sequential number (for example 6541) instead of the Abd al-Baqi number (2564). Fixed with the bundled map. Searching "Muslim 2564" opens the right hadith.
2. **Muwatta Malik**: the sequential and in-book numbers did not match sunnah.com. Fixed with a Book/Hadith map built from sunnah.com.
3. **Decimal parts** (x.2) in Bukhari, Tirmidhi and Nasa'i are now shown with the base number.

No other mismatches in the 434 sampled hadiths across the other 9 collections (all text matches).

## Known limits
- 31 Muwatta narrations (1,818 − 1,787) had no confident text match on sunnah.com. They show the hadith-api sequential number.
- Opening "Bukhari 402" shows the first part only. The other parts appear in the chapter view.
- Raw data: `/workspace/hadith-verify/results.json`, `malik.json`, `malik_rows.json`, `malik_full.json`. Scripts: `verify.py`, `malik_full.py`.