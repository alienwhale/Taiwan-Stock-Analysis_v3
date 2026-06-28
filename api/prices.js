// api/prices.js — v6
// 六層資料源 + 修正週末漲跌為0的問題
// Layer 1: Fugle Snapshot（即時）
// Layer 2: TWSE/TPEx OpenAPI（免費）
// Layer 3: Fugle 個股報價（補抓）
// Layer 4: Yahoo Finance（補抓 + 修正漲跌=0）★修正重點
// Layer 5: Alpha Vantage（最後補抓，每日25次限制）
// Layer 6: Google Sheet CSV（備援）

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

function avSymbol(id) {
  return TSE_SET.has(id) ? `${id}.TW` : `${id}.TWO`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const fugleKey = process.env.FUGLE_API_KEY;
  const avKey = process.env.ALPHA_VANTAGE_KEY;
  const found = {};

  // ── Layer 1：Fugle Snapshot ────────────────────
  if (fugleKey) {
    await Promise.all([
      fetchFugleSnapshot('TSE', fugleKey, found),
      fetchFugleSnapshot('OTC', fugleKey, found),
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

  // ── Layer 3：Fugle 個股報價（補抓完全沒資料的）──
  missing = ALL_IDS.filter(id => !found[id]);
  if (missing.length > 0 && missing.length <= 60 && fugleKey) {
    const batchSize = 10;
    for (let i = 0; i < missing.length; i += batchSize) {
      const batch = missing.slice(i, i + batchSize);
      await Promise.all(batch.map(id => fetchFugleQuote(id, fugleKey, found)));
    }
  }

  // ── Layer 4：Yahoo Finance ─────────────────────
  // ★ 修正重點：不只補抓沒資料的，也修正「有價格但漲跌=0」的
  const needYahoo = ALL_IDS.filter(id =>
    !found[id] || (found[id] && found[id].change === 0 && found[id].price > 0)
  );
  if (needYahoo.length > 0) {
    await fetchYahooFinance(needYahoo, found);
  }

  // ── Layer 5：Alpha Vantage（補抓仍然沒資料的）──
  missing = ALL_IDS.filter(id => !found[id]);
  if (missing.length > 0 && avKey) {
    await fetchAlphaVantage(missing, avKey, found);
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

  // ── Layer 6：全失敗走 Google Sheet ─────────────
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
//  Layer 4: Yahoo Finance
//  ★ 修正：也修正已有價格但漲跌=0的股票（覆蓋寫入）
// ═══════════════════════════════════════════════════
async function fetchYahooFinance(ids, found) {
  const batchSize = 10;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    await Promise.all(batch.map(async (id) => {
      try {
        const sym = yahooSymbol(id);
        const r = await yahooFinance.quote(sym);
        if (!r || !r.regularMarketPrice) return;

        const price = r.regularMarketPrice || 0;
        const prevClose = r.regularMarketPreviousClose || 0;
        const high = r.regularMarketDayHigh || price;
        const low = r.regularMarketDayLow || price;
        const vol = Math.round((r.regularMarketVolume || 0) / 1000);

        // 永遠自己計算漲跌（不信任 API 的 change，週末常為 0）
        const change = prevClose > 0 ? +((price - prevClose).toFixed(2)) : 0;
        const changePct = prevClose > 0 ? +(((price - prevClose) / prevClose * 100).toFixed(2)) : 0;

        // 只有 Yahoo 算出的漲跌不為0，或者原本就沒資料，才覆蓋
        if (price > 0 && (change !== 0 || !found[id])) {
          found[id] = { price, change, changePct, high, low, vol };
        }
      } catch (e) { /* 靜默 */ }
    }));
  }
}

// ═══════════════════════════════════════════════════
//  Layer 5: Alpha Vantage（每日25次限制，只補最後剩餘）
// ═══════════════════════════════════════════════════
async function fetchAlphaVantage(ids, apiKey, found) {
  // Alpha Vantage 免費版每日25次，只補最多20支
  const toFetch = ids.slice(0, 20);
  for (const id of toFetch) {
    try {
      const sym = avSymbol(id);
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${apiKey}`;
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const json = await resp.json();
      const q = json["Global Quote"];
      if (!q || !q["05. price"]) continue;

      const price = parseFloat(q["05. price"]) || 0;
      const prevClose = parseFloat(q["08. previous close"]) || 0;
      const change = parseFloat(q["09. change"]) || 0;
      const changePctStr = (q["10. change percent"] || "0").replace("%", "");
      const changePct = parseFloat(changePctStr) || 0;
      const high = parseFloat(q["03. high"]) || price;
      const low = parseFloat(q["04. low"]) || price;
      const vol = Math.round(parseFloat(q["06. volume"] || "0") / 1000);

      if (price > 0) found[id] = { price, change, changePct, high, low, vol };
    } catch (e) { /* 靜默 */ }

    // Alpha Vantage 免費版限制 5次/分鐘，等一下
    await new Promise(r => setTimeout(r, 1200));
  }
}

// ═══════════════════════════════════════════════════
//  Fugle 價格提取
// ═══════════════════════════════════════════════════
function extractFuglePrice(item, symbol, found) {
  const price = item.closePrice || item.lastPrice || item.tradePrice || item.previousClose || 0;
  if (price <= 0) return;
  const prevClose = item.previousClose || item.referencePrice || item.openPrice || price;
  const change = item.change !== undefined && item.change !== 0
    ? item.change
    : (prevClose !== price ? +((price - prevClose).toFixed(2)) : 0);
  const changePct = item.changePercent !== undefined && item.changePercent !== 0
    ? item.changePercent
    : (prevClose > 0 && prevClose !== price ? +(((price - prevClose) / prevClose * 100).toFixed(2)) : 0);
  const high = item.highPrice || item.dayHigh || item.highestPrice || price;
  const low = item.lowPrice || item.dayLow || item.lowestPrice || price;
  const vol = Math.round((item.tradeVolume || item.volume || 0) / 1000);
  found[symbol] = { price, change, changePct, high, low, vol };
}

// ═══════════════════════════════════════════════════
//  Layer 6: Google Sheet 備援
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
