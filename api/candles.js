// api/candles.js
// 從 Fugle API 取得個股歷史日K線資料
// API Key 從 Vercel 環境變數讀取

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { symbol } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: '缺少 symbol 參數' });
  }

  const apiKey = process.env.FUGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: '伺服器未設定 FUGLE_API_KEY，請到 Vercel Settings → Environments → Production → Environment Variables 設定' });
  }

  // 安全範圍：最近 11 個月（避免超過 Fugle 免費版 1 年限制）
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 11);

  const fmt = (d) => d.toISOString().split('T')[0];

  // 先嘗試有日期範圍的請求
  let url = `https://api.fugle.tw/marketdata/v1.0/stock/historical/candles/${symbol}?from=${fmt(from)}&to=${fmt(to)}&fields=open,high,low,close,volume`;

  try {
    let response = await fetch(url, {
      headers: { 'X-API-KEY': apiKey }
    });

    // 如果 400，嘗試不帶日期範圍（用 Fugle 預設範圍）
    if (response.status === 400) {
      url = `https://api.fugle.tw/marketdata/v1.0/stock/historical/candles/${symbol}?fields=open,high,low,close,volume`;
      response = await fetch(url, {
        headers: { 'X-API-KEY': apiKey }
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `Fugle API ${response.status}`,
        detail: errText,
        hint: response.status === 401 ? '請確認 API Key 是否正確' :
              response.status === 403 ? '請確認 API Key 權限' :
              response.status === 400 ? '請求參數異常' : '未知錯誤',
        url_tried: url
      });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
