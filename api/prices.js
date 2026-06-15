export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTrrO6l9FPJo1qdcEGO3X6OkqiV3qjt4xiQ04xAW3zJObl4z-W162x4yTRLfsiQMZYWTK64fXeECWvO/pub?gid=2111487283&single=true&output=csv";
  try {
    const response = await fetch(url);
    const text = await response.text();
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(text);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
