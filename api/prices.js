// api/prices.js
// 主要資料源：Fugle Snapshot API（即時報價）
// 備援資料源：Google Sheet CSV
// 只需 2 次 API 呼叫（TSE + OTC）即可取得全部股票

const TSE_IDS = new Set([
  "2330","3711","2449",
  "2454","2379","3034",
  "2317","2382","3231","2376","2345","2301",
  "3037","2395","2308","2354","3044",
  "3189",
  "2313","2383",
  "6706",
  "1519",
  "2408",
  "3008",
  "2049","2327",
  "2634","2645",
  "9958","1513","1504","1605","1503","1517",
  "2412","2409","2881"
]);

const OTC_IDS = new Set([
  "6488","6510","3680","6830","3131","3563","2404","1560","3583","3587","8150",
  "5274","3661","3443","3105",
  "3529","6643","5269","8299","4966","3035","4919","3227","6462",
  "6669",
  "3017","3324","6245","3653","3013","8039",
  "3374","8046",
  "6274","6213",
  "3491","3152","6271","4916","3138",
  "6979",
  "3576",
  "5289",
  "6239",
  "3533","3030",
  "6863","3707","8033","3691","4934","1536",
  "8996","6806","3708"
]);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const apiKey = process.env.FUGLE_API_KEY;

  // 如果沒有 Fugle API Key，走 Google Sheet 備援
  if (!apiKey) {
    return fallbackToSheet(res);
  }

  try {
    // 同時抓上市 + 上櫃快照
    const [tseData, otcData] = await Promise.all([
      fetchSnapshot('TSE', apiKey),
      fetchSnapshot('OTC', apiKey),
    ]);

    const rows = [];

    // 處理上市
    if (tseData) {
      processSnapshot(tseData, TSE_IDS, rows);
    }

    // 處理上櫃
    if (otcData) {
      processSnapshot(otcData, OTC_IDS, rows);
    }

    if (rows.length === 0) {
      // Fugle 全部失敗，走備援
      return fallbackToSheet(res);
    }

    // 輸出 CSV 格式（與前端 parseCSV 相容）
    const header = "代號,股價,漲跌,漲跌%,最高,最低,成交量(張),更新時間";
    const csv = header + "\n" + rows.join("\n");

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).send(csv);

  } catch (e) {
    // 出錯走備援
    console.error('Fugle error:', e.message);
    return fallbackToSheet(res);
  }
}

async function fetchSnapshot(market, apiKey) {
  try {
    const url = `https://api.fugle.tw/marketdata/v1.0/stock/snapshot/quotes/${market}`;
    const resp = await fetch(url, {
      headers: { 'X-API-KEY': apiKey }
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    console.error(`Snapshot ${market} error:`, e.message);
    return null;
  }
}

function processSnapshot(data, idSet, rows) {
  const items = data.data || data;
  if (!Array.isArray(items)) return;

  items.forEach(item => {
    const symbol = item.symbol || item.code || "";
    if (!idSet.has(symbol)) return;

    const price = item.closePrice || item.lastPrice || item.tradePrice || 0;
    const prevClose = item.previousClose || item.referencePrice || 0;
    const change = item.change ?? (prevClose > 0 ? +(price - prevClose).toFixed(2) : 0);
    const changePct = item.changePercent ?? (prevClose > 0 ? +((price - prevClose) / prevClose * 100).toFixed(2) : 0);
    const high = item.highPrice || item.dayHigh || price;
    const low = item.lowPrice || item.dayLow || price;
    const vol = Math.round((item.tradeVolume || item.volume || 0) / 1000);
    const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

    if (price > 0) {
      rows.push(`${symbol},${price},${change},${changePct},${high},${low},${vol},${now}`);
    }
  });
}

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
