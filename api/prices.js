// api/prices.js
// 三層資料源：
// Layer 1: Fugle Snapshot API（一次抓全部上市/上櫃）
// Layer 2: Fugle 個股報價 API（補抓 Snapshot 沒有的）
// Layer 3: Google Sheet CSV 備援

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const apiKey = process.env.FUGLE_API_KEY;
  if (!apiKey) {
    return fallbackToSheet(res);
  }

  try {
    const found = {};

    // ── Layer 1：Snapshot（一次抓全部）────────────
    await Promise.all([
      fetchSnapshot('TSE', apiKey, found),
      fetchSnapshot('OTC', apiKey, found),
    ]);

    // ── Layer 2：個股報價補抓（Snapshot 沒涵蓋的）──
    const missing = ALL_IDS.filter(id => !found[id]);
    if (missing.length > 0 && missing.length <= 60) {
      // 每次最多補抓60支（Fugle 免費版 60次/分鐘）
      const batchSize = 10;
      for (let i = 0; i < missing.length; i += batchSize) {
        const batch = missing.slice(i, i + batchSize);
        await Promise.all(batch.map(id => fetchQuote(id, apiKey, found)));
      }
    }

    // 組裝 CSV
    const rows = [];
    const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

    ALL_IDS.forEach(id => {
      const d = found[id];
      if (d && d.price > 0) {
        rows.push(`${id},${d.price},${d.change},${d.changePct},${d.high},${d.low},${d.vol},${now}`);
      }
    });

    if (rows.length === 0) {
      return fallbackToSheet(res);
    }

    const header = "代號,股價,漲跌,漲跌%,最高,最低,成交量(張),更新時間";
    const csv = header + "\n" + rows.join("\n");

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).send(csv);

  } catch (e) {
    console.error('Fugle error:', e.message);
    return fallbackToSheet(res);
  }
}

// ── Snapshot：一次抓整個市場 ─────────────────────
async function fetchSnapshot(market, apiKey, found) {
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
      if (!idSet.has(sym)) return;
      extractPrice(item, sym, found);
    });
  } catch (e) {
    console.error(`Snapshot ${market}:`, e.message);
  }
}

// ── 個股報價：逐一補抓 ──────────────────────────
async function fetchQuote(symbol, apiKey, found) {
  try {
    const url = `https://api.fugle.tw/marketdata/v1.0/stock/intraday/quote/${symbol}`;
    const resp = await fetch(url, { headers: { 'X-API-KEY': apiKey } });
    if (!resp.ok) return;
    const json = await resp.json();
    extractPrice(json, symbol, found);
  } catch (e) {
    // 靜默失敗
  }
}

// ── 從各種 Fugle 回應格式中提取價格 ─────────────
function extractPrice(item, symbol, found) {
  // Fugle 不同 endpoint 欄位名稱不同，全部嘗試
  const price = item.closePrice || item.lastPrice || item.tradePrice || item.previousClose || 0;
  if (price <= 0) return;

  const prevClose = item.previousClose || item.referencePrice || item.openPrice || price;
  const change = item.change !== undefined ? item.change : +(price - prevClose).toFixed(2);
  const changePct = item.changePercent !== undefined ? item.changePercent :
    (prevClose > 0 ? +((price - prevClose) / prevClose * 100).toFixed(2) : 0);
  const high = item.highPrice || item.dayHigh || item.highestPrice || price;
  const low = item.lowPrice || item.dayLow || item.lowestPrice || price;
  const vol = Math.round((item.tradeVolume || item.volume || 0) / 1000);

  found[symbol] = { price, change, changePct, high, low, vol };
}

// ── Layer 3：Google Sheet 備援 ──────────────────
async function fallbackToSheet(res) {
  try {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTrrO6l9FPJo1qdcEGO3X6OkqiV3qjt4xiQ04xAW3zJObl4z-W162x4yTRLfsiQMZYWTK64fXeECWvO/pub?gid=2111487283&single=true&output=csv";
    const resp = await fetch(url);
    const text = await resp.text();
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(text);
  } catch (e) {
    res.status(500).json({ error: '所有資料源均失敗：' + e.message });
  }
}
