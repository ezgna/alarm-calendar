/* eslint-disable no-console */
// 日本の祝日データを 2020〜2040 年分まとめて生成して
// locales/holidays/jp.json に書き出す CommonJS スクリプト。
// 実行例: node scripts/generate-holidays.cjs

const fs = require("node:fs");
const path = require("node:path");
const holidayJp = require("@holiday-jp/holiday_jp");

const START_YEAR = 2020;
const END_YEAR = 2040;

/**
 * @typedef {Object} OutputHoliday
 * @property {string} date YYYY-MM-DD
 * @property {string} name 日本語名称
 * @property {number} year 対象年
 */

/**
 * @typedef {Object} OutputShape
 * @property {"JP"} country
 * @property {{ startYear: number; endYear: number }} range
 * @property {Record<string, OutputHoliday[]>} byDate
 */

/**
 * 祝日データを生成してファイルへ書き出す
 */
function main() {
  /** @type {Record<string, OutputHoliday[]>} */
  const byDate = {};

  for (let year = START_YEAR; year <= END_YEAR; year += 1) {
    // holiday_jp の between は [from, to] の期間に含まれる祝日を返す
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31);
    const holidays = holidayJp.between(from, to);

    holidays.forEach((h) => {
      const key = formatDate(h.date);
      const item = {
        date: key,
        name: h.name,
        year,
      };
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(item);
    });
  }

  /** @type {OutputShape} */
  const out = {
    country: "JP",
    range: {
      startYear: START_YEAR,
      endYear: END_YEAR,
    },
    byDate,
  };

  const outDir = path.join(__dirname, "..", "locales", "holidays");
  const outFile = path.join(outDir, "jp.json");

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outFile, `${JSON.stringify(out, null, 2)}\n`, "utf8");

  console.log(`Generated: ${outFile}`);
}

/**
 * Date -> YYYY-MM-DD
 * @param {Date} d
 */
function formatDate(d) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

main();

