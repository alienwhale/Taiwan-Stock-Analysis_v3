// api/prices.js — v4
// 五層資料源，確保 90 支都有股價：
// Layer 1: Fugle Snapshot API（即時，需 API Key）
// Layer 2: TWSE/TPEx OpenAPI（免費，不需 Key）
// Layer 3: Fugle 個股報價（逐一補抓）
// Layer 4: Yahoo Finance（免費，涵蓋廣）
// Layer 5: Google Sheet CSV（最後備援）

import yahooFinance from "yahoo-finance2";

const ALL_IDS = [
  "2330","3711","2449",
  "6488","6510","3680","6830","3131","3563","2404","1560","3583","3587","8150",
  "2454","5274","3661","2379","3034","3443","3105",
  "3529","6643","5269","8299","4966","3035","4919","3227","6462",
  "2317","2382","6669","2345","3231","2376",
  "3017","3324","3037","2395","3044","2308","6245","3653","2354","3013","8039",
  "3374","8046","3189",
  "2313","2383","6274","6213",
  "3491","3152","6271","4916","3138",
  "6706","6979",
  "1519","3576",
  "2408","5289",
  "3008","6239",
  "2327","3533","2049","3030",
  "2634","6863","3707","2645","8033","3691","4934","1536",
  "9958","1513","1504","8996","1605","1503","3708","1517",
  "2412","2409","2881"
];

// 上市股票用 .TW，上櫃用 .TWO
const TSE_SET = new Set([
  "2330","3711","2449","2454","2379","3034",
  "2317","2382","3231","2376","2345","2301",
  "3037","2395","2308","2354","3044","3189",
  "2313","2383","6706","1519","2408","3008",
  "2049","2327","2634","2645",
  "9958","1513","1504","1605","1503","1517",
  "2412","2409","2881"
]);

function yahooSymbol(id) {
  return TSE_SET.has(id) ? `${id}.TW` : `${id}.TWO`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const apiKey = process.env.FUGLE_API_KEY;
  const found = {};

  // ── Layer 1：Fugle Snapshot ────────────────────
  if (apiKey) {
    await Promise.all([
      fetchFugleSnapshot('TSE', apiKey, found),
      fetchFugleSnapshot('OTC', apiKey, found),
    ]);
  }

  // ── Layer 2：TWSE / TPEx OpenAPI ──────────────
  let missing = ALL_IDS.filter(id => !found[id]);
  if (missing.length > 0) {
    await Promise.all([
      fetchTWSE_OpenAPI(found),
      fetchTPEx_OpenAPI(found),
    ]);
  }

  // ── Layer 3：Fugle 個股報價（補抓）────────────
  missing = ALL_IDS.filter(id => !found[id]);
  if (missing.length > 0 && missing.length <= 60 && apiKey) {
    const batchSize = 10;
    for (let i = 0; i < missing.length; i += batchSize) {
      const batch = missing.slice(i, i + batchSize);
      await Promise.all(batch.map(id => fetchFugleQuote(id, apiKey, found)));
    }
  }

  // ── Layer 4：Yahoo Finance（補抓剩餘）─────────
  missing = ALL_IDS.filter(id => !found[id]);
  if (missing.length > 0) {
    await fetchYahooFinance(missing, found);
  }

  // 組裝 CSV
  const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  const rows = [];
  ALL_IDS.forEach(id => {
    const d = found[id];
    if (d && d.price > 0) {
      rows.push(`${id},${d.price},${d.change},${d.changePct},${d.high},${d.low},${d.vol},${now}`);
    }
  });

  // ── Layer 5：全失敗走 Google Sheet ─────────────
  if (rows.length === 0) {
    return fallbackToSheet(res);
  }

  const header = "代號,股價,漲跌,漲跌%,最高,最低,成交量(張),更新時間";
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  res.status(200).send(header + "\n" + rows.join("\n"));
}

// ═══════════════════════════════════════════════════
//  Layer 1: Fugle Snapshot
// ═══════════════════════════════════════════════════
async function fetchFugleSnapshot(market, apiKey, found) {
  try {
    const url = `https://api.fugle.tw/marketdata/v1.0/stock/snapshot/quotes/${market}`;
    const resp = await fetch(url, { headers: { 'X-API-KEY': apiKey } });
    if (!resp.ok) return;
    const json = await resp.json();
    const items = json.data || json;
    if (!Array.isArray(items)) return;
    const idSet = new Set(ALL_IDS);
    items.forEach(item => {
      const sym = (item.symbol || "").trim();
      if (idSet.has(sym)) extractFuglePrice(item, sym, found);
    });
  } catch (e) { /* 靜默 */ }
}

// ═══════════════════════════════════════════════════
//  Layer 2a: TWSE OpenAPI（上市，免費）
// ═══════════════════════════════════════════════════
async function fetchTWSE_OpenAPI(found) {
  try {
    const url = "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL";
    const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!resp.ok) return;
    const data = await resp.json();
    if (!Array.isArray(data)) return;
    const idSet = new Set(ALL_IDS);
    data.forEach(item => {
      const id = (item.Code || "").trim();
      if (!idSet.has(id) || found[id]) return;
      const price = parseFloat((item.ClosingPrice || "0").replace(/,/g, "")) || 0;
      const change = parseFloat((item.Change || "0").replace(/[+,]/g, "")) || 0;
      const high = parseFloat((item.HighestPrice || "0").replace(/,/g, "")) || 0;
      const low = parseFloat((item.LowestPrice || "0").replace(/,/g, "")) || 0;
      const vol = Math.round(parseFloat((item.TradeVolume || "0").replace(/,/g, "")) / 1000);
      const yClose = price - change;
      const changePct = yClose > 0 ? +((change / yClose) * 100).toFixed(2) : 0;
      if (price > 0) found[id] = { price, change, changePct, high, low, vol };
    });
  } catch (e) { /* 靜默 */ }
}

// ═══════════════════════════════════════════════════
//  Layer 2b: TPEx OpenAPI（上櫃，免費）
// ═══════════════════════════════════════════════════
async function fetchTPEx_OpenAPI(found) {
  const endpoints = [
    "https://openapi.tpex.org.tw/v1/tpex_mainboard_quotes",
    "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes"
  ];
  for (const ep of endpoints) {
    try {
      const resp = await fetch(ep, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!resp.ok) continue;
      const data = await resp.json();
      if (!Array.isArray(data) || data.length === 0) continue;
      const idSet = new Set(ALL_IDS);
      data.forEach(item => {
        const id = (item.SecuritiesCompanyCode || item.Code || item["SecuritiesCompanyCode "] || "").trim();
        if (!idSet.has(id) || found[id]) return;
        const price = parseFloat(item.ClosingPrice || item.Close || "0") || 0;
        const yClose = parseFloat(item.PreviousClose || item.Yesterday || "0") || 0;
        const high = parseFloat(item.HighestPrice || item.High || "0") || price;
        const low = parseFloat(item.LowestPrice || item.Low || "0") || price;
        const vol = Math.round(parseFloat((item.TradingShares || item.Volume || "0").toString().replace(/,/g, "")) / 1000);
        const change = yClose > 0 ? +((price - yClose).toFixed(2)) : 0;
        const changePct = yClose > 0 ? +(((price - yClose) / yClose * 100).toFixed(2)) : 0;
        if (price > 0) found[id] = { price, change, changePct, high, low, vol };
      });
      break;
    } catch (e) { continue; }
  }
}

// ═══════════════════════════════════════════════════
//  Layer 3: Fugle 個股報價
// ═══════════════════════════════════════════════════
async function fetchFugleQuote(symbol, apiKey, found) {
  try {
    const url = `https://api.fugle.tw/marketdata/v1.0/stock/intraday/quote/${symbol}`;
    const resp = await fetch(url, { headers: { 'X-API-KEY': apiKey } });
    if (!resp.ok) return;
    const json = await resp.json();
    extractFuglePrice(json, symbol, found);
  } catch (e) { /* 靜默 */ }
}

// ═══════════════════════════════════════════════════
//  Layer 4: Yahoo Finance（批次補抓）
// ═══════════════════════════════════════════════════
async function fetchYahooFinance(ids, found) {
  // 分批，每批最多 10 支，避免 timeout
  const batchSize = 10;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    await Promise.all(batch.map(async (id) => {
      try {
        const sym = yahooSymbol(id);
        const result = await yahooFinance.quote(sym);
        if (!result || !result.regularMarketPrice) return;

        const price = result.regularMarketPrice || 0;
        const prevClose = result.regularMarketPreviousClose || price;
        const change = result.regularMarketChange !== undefined
          ? +(result.regularMarketChange.toFixed(2))
          : +((price - prevClose).toFixed(2));
        const changePct = result.regularMarketChangePercent !== undefined
          ? +(result.regularMarketChangePercent.toFixed(2))
          : (prevClose > 0 ? +(((price - prevClose) / prevClose * 100).toFixed(2)) : 0);
        const high = result.regularMarketDayHigh || price;
        const low = result.regularMarketDayLow || price;
        const vol = Math.round((result.regularMarketVolume || 0) / 1000);

        if (price > 0) found[id] = { price, change, changePct, high, low, vol };
      } catch (e) { /* 靜默，單支失敗不影響其他 */ }
    }));
  }
}

// ═══════════════════════════════════════════════════
//  Fugle 價格提取（通用）
// ═══════════════════════════════════════════════════
function extractFuglePrice(item, symbol, found) {
  const price = item.closePrice || item.lastPrice || item.tradePrice || item.previousClose || 0;
  if (price <= 0) return;
  const prevClose = item.previousClose || item.referencePrice || item.openPrice || price;
  const change = item.change !== undefined ? item.change : +((price - prevClose).toFixed(2));
  const changePct = item.changePercent !== undefined ? item.changePercent :
    (prevClose > 0 ? +(((price - prevClose) / prevClose * 100).toFixed(2)) : 0);
  const high = item.highPrice || item.dayHigh || item.highestPrice || price;
  const low = item.lowPrice || item.dayLow || item.lowestPrice || price;
  const vol = Math.round((item.tradeVolume || item.volume || 0) / 1000);
  found[symbol] = { price, change, changePct, high, low, vol };
}

// ═══════════════════════════════════════════════════
//  Layer 5: Google Sheet 備援
// ═══════════════════════════════════════════════════
async function fallbackToSheet(res) {
  try {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTrrO6l9FPJo1qdcEGO3X6OkqiV3qjt4xiQ04xAW3zJObl4z-W162x4yTRLfsiQMZYWTK64fXeECWvO/pub?gid=2111487283&single=true&output=csv";
    const resp = await fetch(url);
    const text = await resp.text();
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(text);
  } catch (e) {
    res.status(500).json({ error: '所有資料源均失敗' });
  }
}
