# DateCycle · Gregorian-Lunar Calendar & Holiday Reference

[简体中文](README.md) | **English**

![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![No build step](https://img.shields.io/badge/build-none-blue)
![Pure static](https://img.shields.io/badge/web-static-lightgrey)
![Data stays local](https://img.shields.io/badge/data-local--only-orange)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

> Pick a date range and get a Gregorian / lunar / weekday / solar-term / Chinese-holiday cross-reference table you can export as CSV — no dependencies, no build, nothing leaves your machine.

![Screenshot](https://cdn.jsdelivr.net/gh/isnotry/DateCycle@main/docs/screenshot.png)

---

## What it is

DateCycle is a pure front-end date cross-reference tool: choose a start and end date and it builds a table of Gregorian date / lunar date / weekday / solar term / Chinese holiday, which you can export as CSV.

No backend, no build step, no third-party dependencies — `index.html` + `script.js` + `database/` is the whole thing. The interface itself is Chinese-only.

Conversion data ships with the repo as JSON: `database/all.json` covers 1901-01-01 through 2100-12-31 (73,048 days), and `database/holidays/{year}.json` covers Chinese public holidays from 2007 to 2027. At runtime the page only reads same-origin static files — no network calls, no sign-up, no telemetry.

## Features

- **Pure static, no build** —— no npm, no bundler; any static file server will do
- **73,048 days of lunar data** —— 1901-01-01 to 2100-12-31, with sexagenary year, zodiac and leap-month flags
- **24 solar terms** —— shown on the exact day, traditional characters converted to simplified
- **Chinese public holidays** —— per-year data for 2007–2027, marking days off「（休）」and makeup workdays「（班）」
- **Adjustable range** —— the date pickers accept 2000-01-01 through 2100-12-31
- **Two columns you can hide** —— "hide lunar year" keeps month + day, "hide weekday" drops that column entirely, in both the table and the CSV
- **One-click CSV export** —— exports the current range, with start and end dates in the filename
- **Lazy holiday loading** —— only fetches `holidays/{year}.json` for the years in range, then caches them in memory
- **Several data formats** —— full `all.json` / `all.csv` / `all.bin`, plus per-year `json` / `min` / `zip`
- **Docker in one command** —— ships with `Dockerfile` and `docker-compose.yml`

## Quick start

### Run it locally

You must serve it over HTTP: opening `index.html` directly (`file://`) makes the browser block `fetch`, so the page gets no data.

```bash
cd DateCycle
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

### Run with Docker

```bash
docker compose up -d
```

compose maps container port 80 to host port 8080, so open `http://localhost:8080`.

## Date-mapping rules

| Input / action | Result | Notes |
|---|---|---|
| `2025-01-01` | Lunar「十二月初二」 | "Hide lunar year" is on by default, so only month + day |
| Uncheck "hide lunar year" | Lunar「甲辰年十二月初二」 | The sexagenary year comes from the data's `lunar.year` |
| `2025-07-25` | Lunar「闰六月初一」 | The data says「閏六月」; the page replaces 閏 → 闰 |
| `2025-01-05` | Solar term「小寒」 | Solar terms only have a value on the day itself |
| Data says「驚蟄」 | Page shows「惊蛰」 | Built-in 5-character map: 處暑 / 驚蟄 / 穀雨 / 小滿 / 芒種 |
| `2025-01-26` | Holiday「春节（班）」 | `isOffDay: false` —— a makeup workday |
| `2025-01-28` | Holiday「春节（休）」 | `isOffDay: true` —— a day off |
| `2031-01-01` | Holiday column empty | `holidays/` only goes up to 2027 |
| `1901-01-01` | Lunar「庚子年十一月十一」 | Earliest day in `all.json`, but the picker's floor is 2000-01-01 |

## UI reference

| Location | Element | Purpose |
|---|---|---|
| Form | "开始日期" picker | Start of the table, defaults to 2025-01-01, range 2000-01-01 – 2100-12-31 |
| Form | "结束日期" picker | End of the table, defaults to 2030-01-01 |
| Form | "隐藏农历年份" checkbox | On by default; checked shows month + day, unchecked shows sexagenary year + month + day |
| Form | "隐藏星期" checkbox | On by default; removes the weekday column from both the table and the CSV |
| Form | "生成对照表" button | Renders the result table for the current range and options |
| Form | "下载CSV" button | Exports the current range and options as CSV |
| Result | Result table | Five columns: Gregorian date / lunar date / weekday / solar term / Chinese holiday |
| Result | "处理中，请稍候..." | Loading indicator while the table is generated |

## How it works

```text
Lunar / solar term   look up all.json by (gregorian.year, month, date) → take lunar / solarTerm
Chinese holidays     fetch database/holidays/{year}.json for that year → match by date in days[] → name + suffix
CSV export           same columns as the table, comma-separated, UTF-8 without BOM
```

- The lunar cell has two branches: "hide lunar year" checked → `month + day`; unchecked → `sexagenary year + year + month + day`
- The traditional-to-simplified solar-term map covers exactly 5 characters: 處暑 → 处暑、驚蟄 → 惊蛰、穀雨 → 谷雨、小滿 → 小满、芒種 → 芒种
- The holiday suffix comes from `isOffDay`: `true` → `（休）`, `false` → `（班）`
- The weekday column is computed in the browser (`Date.getDay()`) and ignores the `day` field in the data
- The exported filename is always `公历农历节气假期对照表_{start}_{end}.csv`

## Data & privacy

Everything the page reads is a same-origin static file: no API calls, no `localStorage` or cookies, no analytics — it works fully offline.

| File | Content | Size |
|---|---|---|
| `database/all.json` | Sexagenary year + lunar month/day + leap flag + solar term + zodiac | 73,048 days (1901–2100), ~11 MB |
| `database/holidays/{year}.json` | Chinese public holidays, fields `days[]{date, name, isOffDay}` | 2007–2027, 677 entries |
| `database/all.csv` / `all.bin` | The full dataset as CSV and as a packed binary | ~3.3 MB / ~360 KB |
| `database/json/`, `json/min/`, `json/zip/` | Per-year splits: indented JSON, single-line JSON, zip archives | 200 files each (1901–2100) |
| `database/origin/` | Original cross-reference tables as plain text | 200 files (1901–2100) |

The page itself only reads `all.json` and `holidays/`; the rest are distribution formats that ship with the repo. The 2027 holiday file is still an empty array because that year's schedule has not been announced yet.

## Project layout

```text
DateCycle/
├── index.html                     # Page markup + inline styles
├── script.js                      # Data loading / conversion / rendering / CSV export
├── database/
│   ├── all.json                   # Full dataset (1901–2100)
│   ├── all.csv                    # Same data as CSV
│   ├── all.bin                    # Same data in a packed binary
│   ├── holidays/{year}.json       # Chinese public holidays per year (2007–2027)
│   ├── json/{year}.json           # Per-year dataset (1901–2100)
│   │   ├── min/{year}.min.json    # Single-line minified version
│   │   └── zip/{year}.zip         # Zip archive
│   └── origin/{year}.txt          # Original plain-text tables
├── docs/
│   └── screenshot.png             # README image
├── Dockerfile                     # nginx:alpine static hosting
├── docker-compose.yml             # Maps to host port 8080
├── LICENSE                        # MIT
├── README.md                      # Chinese docs
└── README.en.md                   # English docs (this file)
```

## Development notes

- The whole front end is a single `script.js` with plain DOM code and no framework — edit it and refresh.
- `all.json` is a single 11 MB file that is fully parsed on first load; `solarToLunar()` and `getSolarTerm()` scan the array linearly on every call, so a whole-century range gets noticeably slow.
- To update holiday data, just drop the new `{year}.json` into `database/holidays/`. The front end requests it by year automatically — no code change needed.
- The holiday fields follow the [holiday-cn](https://github.com/NateScarlet/holiday-cn) schema; keeping `date` / `name` / `isOffDay` is enough.
- The exported CSV is UTF-8 but has no BOM, so double-clicking it in Excel on Windows can garble Chinese characters — import it via "Data → From Text/CSV" with UTF-8, or prepend `\uFEFF` to the `Blob` content.

## Browser support

- Works in current Chrome / Edge / Firefox / Safari; IE is not supported.
- Required APIs: `fetch`, `async/await`, `Blob` + `URL.createObjectURL`, `<input type="date">`.
- Must be opened over HTTP(S): under `file://` the browser blocks `fetch('database/all.json')` and the page has no data.
- Known quirk: dates are built with `new Date('YYYY-MM-DD')` (parsed as UTC) but read back in local time, so time zones west of UTC are off by one day; mainland China (UTC+8) is unaffected.

## License

[MIT](LICENSE) © 2026 isnotry
