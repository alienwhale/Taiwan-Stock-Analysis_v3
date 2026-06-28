// api/candles.js
// 從 Fugle API 取得個股歷史日K線資料（最近1年）
// API Key 從 Vercel 環境變數讀取，不會暴露在前端

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { symbol } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: '缺少 symbol 參數' });
  }

  const apiKey = process.env.FUGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: '伺服器未設定 FUGLE_API_KEY' });
  }

  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  const fmt = (d) => d.toISOString().split('T')[0];

  const url = `https://api.fugle.tw/marketdata/v1.0/stock/historical/candles/${symbol}?from=${fmt(from)}&to=${fmt(to)}&fields=open,high,low,close,volume`;

  try {
    const response = await fetch(url, {
      headers: { 'X-API-KEY': apiKey }
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `Fugle API 錯誤 ${response.status}`,
        detail: errText
      });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
