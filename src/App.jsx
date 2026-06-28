import { useState, useEffect, useMemo, useRef, useCallback } from "react";

const STOCK_META = [
  {id:"2330",name:"台積電",cat:"核心製造",role:"晶圓代工龍頭"},
  {id:"3711",name:"日月光",cat:"核心製造",role:"封測龍頭"},
  {id:"2449",name:"京元電子",cat:"核心製造",role:"晶圓測試"},
  {id:"6488",name:"環球晶",cat:"半導體設備",role:"矽晶圓龍頭"},
  {id:"6510",name:"精測",cat:"半導體設備",role:"IC測試介面板"},
  {id:"3680",name:"家登",cat:"半導體設備",role:"光罩盒/晶圓盒"},
  {id:"6830",name:"汎銓",cat:"半導體設備",role:"半導體材料分析"},
  {id:"3131",name:"弘塑",cat:"半導體設備",role:"晶圓清洗設備"},
  {id:"3563",name:"牧德",cat:"半導體設備",role:"PCB光學檢測AOI"},
  {id:"2404",name:"漢唐",cat:"半導體設備",role:"廠務工程"},
  {id:"1560",name:"中砂",cat:"半導體設備",role:"研磨材料/鑽石碟"},
  {id:"3583",name:"辛耘",cat:"半導體設備",role:"半導體製程設備"},
  {id:"3587",name:"閎康",cat:"半導體設備",role:"材料分析檢測"},
  {id:"8150",name:"南茂",cat:"半導體設備",role:"記憶體封測"},
  {id:"2454",name:"聯發科",cat:"IC設計",role:"AI/AP晶片"},
  {id:"5274",name:"信驊",cat:"IC設計",role:"BMC/AI伺服器晶片"},
  {id:"3661",name:"世芯-KY",cat:"IC設計",role:"ASIC設計龍頭"},
  {id:"2379",name:"瑞昱",cat:"IC設計",role:"網通晶片"},
  {id:"3034",name:"聯詠",cat:"IC設計",role:"顯示驅動IC"},
  {id:"3443",name:"創意",cat:"IC設計",role:"ASIC設計"},
  {id:"3105",name:"穩懋",cat:"IC設計",role:"GaAs晶圓代工·SpaceX"},
  {id:"3529",name:"力旺",cat:"IC記憶體",role:"嵌入式非揮發記憶體"},
  {id:"6643",name:"M31",cat:"IC記憶體",role:"矽智財IP"},
  {id:"5269",name:"祥碩",cat:"IC記憶體",role:"USB/高速傳輸IC"},
  {id:"8299",name:"群聯",cat:"IC記憶體",role:"NAND控制IC"},
  {id:"4966",name:"譜瑞-KY",cat:"IC記憶體",role:"顯示晶片/Type-C"},
  {id:"3035",name:"智原",cat:"IC記憶體",role:"ASIC設計服務"},
  {id:"4919",name:"新唐",cat:"IC記憶體",role:"MCU"},
  {id:"3227",name:"原相",cat:"IC記憶體",role:"光學感測IC"},
  {id:"6462",name:"神盾",cat:"IC記憶體",role:"指紋辨識IC"},
  {id:"2317",name:"鴻海",cat:"AI伺服器",role:"伺服器代工龍頭"},
  {id:"2382",name:"廣達",cat:"AI伺服器",role:"雲端伺服器"},
  {id:"6669",name:"緯穎",cat:"AI伺服器",role:"雲端伺服器"},
  {id:"2345",name:"智邦",cat:"AI伺服器",role:"網路交換器"},
  {id:"3231",name:"緯創",cat:"AI伺服器",role:"伺服器ODM"},
  {id:"2376",name:"技嘉",cat:"AI伺服器",role:"GPU伺服器主機板"},
  {id:"3017",name:"奇鋐",cat:"PCB散熱",role:"AI散熱方案"},
  {id:"3324",name:"雙鴻",cat:"PCB散熱",role:"散熱模組"},
  {id:"3037",name:"欣興",cat:"PCB散熱",role:"ABF載板·千元股"},
  {id:"2395",name:"研華",cat:"PCB散熱",role:"工業電腦龍頭"},
  {id:"3044",name:"健鼎",cat:"PCB散熱",role:"多層PCB"},
  {id:"2308",name:"台達電",cat:"PCB散熱",role:"電源/AI伺服器電源"},
  {id:"6245",name:"立端",cat:"PCB散熱",role:"嵌入式電腦"},
  {id:"3653",name:"健策",cat:"PCB散熱",role:"均溫板/液冷"},
  {id:"2354",name:"鴻準",cat:"PCB散熱",role:"機殼/散熱"},
  {id:"3013",name:"晟銘電",cat:"PCB散熱",role:"機殼/散熱"},
  {id:"8039",name:"台虹",cat:"PCB散熱",role:"覆銅板CCL"},
  {id:"3374",name:"精材",cat:"CoWoS",role:"CoWoS基板(台積電子公司)"},
  {id:"8046",name:"南電",cat:"CoWoS",role:"ABF載板"},
  {id:"3189",name:"景碩",cat:"CoWoS",role:"IC載板"},
  {id:"2313",name:"華通",cat:"衛星PCB",role:"衛星板市占9成·SpaceX核心"},
  {id:"2383",name:"台光電",cat:"衛星PCB",role:"銅箔基板CCL·高頻板材"},
  {id:"6274",name:"台燿",cat:"衛星PCB",role:"CCL銅箔基板·低軌衛星"},
  {id:"6213",name:"聯茂",cat:"衛星PCB",role:"高頻CCL板材"},
  {id:"3491",name:"昇達科",cat:"衛星射頻",role:"血統最純·SpaceX核心"},
  {id:"3152",name:"璟德",cat:"衛星射頻",role:"LTCC陶瓷濾波器·全球前3"},
  {id:"6271",name:"同欣電",cat:"衛星射頻",role:"高頻陶瓷封裝·SpaceX"},
  {id:"4916",name:"事欣科",cat:"衛星射頻",role:"ITAR認證·SpaceX星鏈"},
  {id:"3138",name:"耀登",cat:"衛星射頻",role:"無線射頻天線"},
  {id:"6706",name:"惠特",cat:"衛星光通訊",role:"光通訊模組·ISL衛星間鏈路"},
  {id:"6979",name:"聯鈞",cat:"衛星光通訊",role:"衛星間光通訊"},
  {id:"1519",name:"華城",cat:"散熱電源",role:"高壓變壓器/AI電網"},
  {id:"3576",name:"新日興",cat:"散熱電源",role:"精密鉸鏈/散熱"},
  {id:"2408",name:"南亞科",cat:"HBM記憶體",role:"DRAM"},
  {id:"5289",name:"宜鼎",cat:"HBM記憶體",role:"工業級NAND"},
  {id:"3008",name:"大立光",cat:"光學感測",role:"鏡頭模組龍頭"},
  {id:"6239",name:"力成",cat:"光學感測",role:"感測器封測"},
  {id:"2327",name:"國巨",cat:"設備材料",role:"被動元件龍頭"},
  {id:"3533",name:"嘉澤",cat:"設備材料",role:"高速連接器"},
  {id:"2049",name:"上銀",cat:"設備材料",role:"精密機械/線性滑軌"},
  {id:"3030",name:"德律",cat:"設備材料",role:"AOI/ICT檢測·NVIDIA供應"},
  {id:"2634",name:"漢翔",cat:"軍工航太",role:"航空工業龍頭"},
  {id:"6863",name:"瑞鼎",cat:"軍工航太",role:"OLED驅動IC"},
  {id:"3707",name:"漢磊",cat:"軍工航太",role:"化合物半導體"},
  {id:"2645",name:"長榮航太",cat:"軍工航太",role:"航空維修MRO"},
  {id:"8033",name:"雷虎",cat:"軍工航太",role:"遙控載具/無人機"},
  {id:"3691",name:"碩禾",cat:"軍工航太",role:"導電漿/太陽能"},
  {id:"4934",name:"太極",cat:"軍工航太",role:"系統整合"},
  {id:"1536",name:"和大",cat:"軍工航太",role:"齒輪箱/風電"},
  {id:"9958",name:"世紀鋼",cat:"能源重電",role:"離岸風電鋼構"},
  {id:"1513",name:"中興電",cat:"能源重電",role:"重電設備"},
  {id:"1504",name:"東元",cat:"能源重電",role:"馬達/重電"},
  {id:"8996",name:"高力",cat:"能源重電",role:"熱交換器/散熱"},
  {id:"1605",name:"華新",cat:"能源重電",role:"電線電纜"},
  {id:"1503",name:"大同",cat:"能源重電",role:"重電/能源"},
  {id:"3708",name:"上緯投控",cat:"能源重電",role:"離岸風電材料"},
  {id:"1517",name:"士電",cat:"能源重電",role:"重電設備"},
  {id:"2412",name:"中華電",cat:"網通基建",role:"電信/AI雲"},
  {id:"2409",name:"友達",cat:"面板",role:"面板/顯示"},
  {id:"2881",name:"富邦金",cat:"金融",role:"金控"},
];

function parseCSVLine(line) {
  const result = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === "," && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const result = {};
  lines.slice(1).forEach(line => {
    if (!line.trim()) return;
    const cols = parseCSVLine(line);
    if (cols.length < 7) return;
    const id = cols[0].replace(/"/g,"").trim();
    const price = parseFloat(cols[1]) || 0;
    const change = parseFloat(cols[2]) || 0;
    const changePct = parseFloat(cols[3]) || 0;
    const high = parseFloat(cols[4]) || 0;
    const low = parseFloat(cols[5]) || 0;
    const vol = parseInt(cols[6]) || 0;
    if (id) result[id] = { price, change, changePct, high, low, vol };
  });
  return result;
}

const TCC = v => v > 0 ? "#ff5252" : v < 0 ? "#00c876" : "#888"; // 台股：紅漲綠跌（表格用）

function aggregateCandles(daily, unit) {
  if (unit === "day") return daily;
  const groups = {};
  daily.forEach(d => {
    const date = new Date(d.date);
    let key;
    if (unit === "week") {
      const day = date.getDay();
      const mon = new Date(date);
      mon.setDate(date.getDate() - ((day + 6) % 7));
      key = mon.toISOString().split("T")[0];
    } else { key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`; }
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  });
  return Object.keys(groups).sort().map(k => {
    const items = groups[k].sort((a,b) => new Date(a.date) - new Date(b.date));
    return { date:items[0].date, open:items[0].open, high:Math.max(...items.map(i=>i.high)), low:Math.min(...items.map(i=>i.low)), close:items[items.length-1].close, volume:items.reduce((s,i)=>s+i.volume,0) };
  });
}

function filterByRange(data, range) {
  const cutoff = new Date();
  if (range === "3m") cutoff.setMonth(cutoff.getMonth() - 3);
  else if (range === "6m") cutoff.setMonth(cutoff.getMonth() - 6);
  else cutoff.setFullYear(cutoff.getFullYear() - 1);
  return data.filter(d => new Date(d.date) >= cutoff);
}

function calcMA(data, period) {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j].close;
    return sum / period;
  });
}

// ═══ 專業級 K 線圖元件 ═══════════════════════════════
function CandleChart({ data }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(-1);

  const W = 820, H = 420;
  const padL = 60, padR = 18, padT = 32, padB = 28;
  const chartH = (H - padT - padB) * 0.70;
  const volH = (H - padT - padB) * 0.20;
  const volTop = padT + chartH + 18;
  const chartW = W - padL - padR;

  const ma5 = useMemo(() => calcMA(data, 5), [data]);
  const ma10 = useMemo(() => calcMA(data, 10), [data]);
  const ma20 = useMemo(() => calcMA(data, 20), [data]);
  const ma60 = useMemo(() => calcMA(data, 60), [data]);

  const { yMax, yMin, maxV, xStep, candleW } = useMemo(() => {
    if (!data.length) return { yMax:1, yMin:0, maxV:1, xStep:1, candleW:1 };
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const allMa = [...ma5,...ma10,...ma20,...ma60].filter(v=>v!==null);
    const maxP = Math.max(...highs, ...allMa);
    const minP = Math.min(...lows, ...allMa);
    const pad = (maxP - minP) * 0.06 || 1;
    return {
      yMax: maxP + pad, yMin: minP - pad,
      maxV: Math.max(...data.map(d => d.volume), 1),
      xStep: chartW / data.length,
      candleW: Math.max(1, (chartW / data.length) * 0.6),
    };
  }, [data, ma5, ma10, ma20, ma60]);

  const yToPx = useCallback(v => padT + chartH - ((v - yMin) / (yMax - yMin)) * chartH, [yMin, yMax]);
  const volToPx = useCallback(v => volTop + volH - (v / maxV) * volH, [maxV]);

  // 繪製主圖
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0a0e18";
    ctx.fillRect(0, 0, W, H);

    // 水平格線 + Y軸刻度
    ctx.strokeStyle = "#1a2540";
    ctx.fillStyle = "#506880";
    ctx.font = "10px 'IBM Plex Mono'";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const v = yMin + (yMax - yMin) * (i / 5);
      const y = yToPx(v);
      ctx.beginPath(); ctx.setLineDash([2,3]); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = "right";
      ctx.fillText(v.toFixed(v >= 100 ? 0 : 1), padL - 6, y + 3);
    }

    // X軸日期
    const labelN = Math.min(6, data.length);
    ctx.textAlign = "center";
    for (let i = 0; i < labelN; i++) {
      const idx = Math.floor((data.length - 1) * (i / (labelN - 1 || 1)));
      const x = padL + idx * xStep + xStep / 2;
      ctx.fillStyle = "#506880";
      ctx.fillText(data[idx].date.slice(0, 10), x, H - 6);
    }

    // K棒蠟燭
    data.forEach((d, i) => {
      const x = padL + i * xStep + (xStep - candleW) / 2;
      const isUp = d.close >= d.open;
      const color = isUp ? "#ff4444" : "#00c876"; // 台股：紅漲綠跌

      // 影線
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleW / 2, yToPx(d.high));
      ctx.lineTo(x + candleW / 2, yToPx(d.low));
      ctx.stroke();

      // 實體
      const oY = yToPx(d.open), cY = yToPx(d.close);
      const top = Math.min(oY, cY), bH = Math.max(1, Math.abs(cY - oY));
      if (isUp) {
        ctx.strokeStyle = color;
        ctx.strokeRect(x, top, candleW, bH); // 紅漲空心
      } else {
        ctx.fillStyle = color;
        ctx.fillRect(x, top, candleW, bH); // 綠跌實心
      }

      // 成交量柱
      const vColor = isUp ? "rgba(255,68,68,0.45)" : "rgba(0,200,118,0.45)";
      ctx.fillStyle = vColor;
      const vY = volToPx(d.volume);
      ctx.fillRect(x, vY, candleW, volTop + volH - vY);
    });

    // 均線
    const drawMA = (maArr, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([]);
      ctx.beginPath();
      let started = false;
      maArr.forEach((v, i) => {
        if (v === null) return;
        const x = padL + i * xStep + xStep / 2;
        const y = yToPx(v);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    drawMA(ma5,  "#ffcc00"); // 5MA 黃
    drawMA(ma10, "#ff88cc"); // 10MA 粉
    drawMA(ma20, "#4488ff"); // 20MA 藍
    drawMA(ma60, "#88ccff"); // 60MA 淺藍

    // 量軸刻度
    ctx.fillStyle = "#506880";
    ctx.font = "9px 'IBM Plex Mono'";
    ctx.textAlign = "right";
    const volLabel = maxV >= 10000 ? (maxV/1000).toFixed(0)+"K" : maxV.toFixed(0);
    ctx.fillText(volLabel, padL - 6, volTop + 8);
    ctx.fillText("0", padL - 6, volTop + volH);

  }, [data, ma5, ma10, ma20, ma60, yMax, yMin, maxV, xStep, candleW, yToPx, volToPx]);

  // 十字線 + 資訊框 overlay
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !data.length) return;
    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    if (hoverIdx < 0 || hoverIdx >= data.length) return;
    const d = data[hoverIdx];
    const x = padL + hoverIdx * xStep + xStep / 2;

    // 垂直線
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, H - padB); ctx.stroke();

    // 水平線（收盤價位置）
    const cy = yToPx(d.close);
    ctx.beginPath(); ctx.moveTo(padL, cy); ctx.lineTo(W - padR, cy); ctx.stroke();
    ctx.setLineDash([]);

    // 右側價格標籤
    ctx.fillStyle = d.close >= d.open ? "#ff4444" : "#00c876";
    ctx.fillRect(W - padR, cy - 8, padR, 16);
    ctx.fillStyle = "#fff";
    ctx.font = "9px 'IBM Plex Mono'";
    ctx.textAlign = "left";
    ctx.fillText(d.close.toFixed(1), W - padR + 2, cy + 3);

    // 底部日期標籤
    ctx.fillStyle = "#2a3a55";
    const dateLabel = d.date.slice(0, 10);
    ctx.fillRect(x - 36, H - padB + 1, 72, 16);
    ctx.fillStyle = "#ddd";
    ctx.textAlign = "center";
    ctx.fillText(dateLabel, x, H - padB + 12);

  }, [data, hoverIdx, xStep, yToPx]);

  const handleMouse = useCallback((e) => {
    const canvas = overlayRef.current;
    if (!canvas || !data.length) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    const idx = Math.floor((mx - padL) / xStep);
    setHoverIdx(idx >= 0 && idx < data.length ? idx : -1);
  }, [data, xStep]);

  const hd = hoverIdx >= 0 && hoverIdx < data.length ? data[hoverIdx] : null;
  const isUp = hd ? hd.close >= hd.open : true;
  const prevClose = hd && hoverIdx > 0 ? data[hoverIdx - 1].close : (hd ? hd.open : 0);
  const chg = hd ? hd.close - prevClose : 0;
  const chgPct = prevClose > 0 ? (chg / prevClose * 100) : 0;

  return (
    <div style={{ position:"relative" }}>
      {/* MA 標題列 */}
      <div style={{ display:"flex", gap:14, padding:"0 0 4px 60px", fontSize:11, fontFamily:"'IBM Plex Mono'" }}>
        <span style={{color:"#ffcc00"}}>5MA:{hd && ma5[hoverIdx] ? ma5[hoverIdx].toFixed(2) : "—"}</span>
        <span style={{color:"#ff88cc"}}>10MA:{hd && ma10[hoverIdx] ? ma10[hoverIdx].toFixed(2) : "—"}</span>
        <span style={{color:"#4488ff"}}>20MA:{hd && ma20[hoverIdx] ? ma20[hoverIdx].toFixed(2) : "—"}</span>
        <span style={{color:"#88ccff"}}>60MA:{hd && ma60[hoverIdx] ? ma60[hoverIdx].toFixed(2) : "—"}</span>
      </div>

      {/* OHLC 資訊框 */}
      {hd && (
        <div style={{
          position:"absolute", top:32, left:62, background:"rgba(10,14,24,0.92)",
          border:"1px solid #2a3a55", borderRadius:6, padding:"6px 10px",
          fontSize:11, fontFamily:"'Noto Sans TC',sans-serif", zIndex:10, lineHeight:1.7,
          color: isUp ? "#ff6666" : "#00d88a",
        }}>
          <div style={{color:"#8ab0c0",marginBottom:2}}>{hd.date.slice(0,10)}</div>
          <div>開: <b>{hd.open.toFixed(2)}</b></div>
          <div>高: <b>{hd.high.toFixed(2)}</b></div>
          <div>低: <b>{hd.low.toFixed(2)}</b></div>
          <div>收: <b>{hd.close.toFixed(2)}</b></div>
          <div>漲: <b>{chg >= 0 ? "+" : ""}{chg.toFixed(2)}</b></div>
          <div>幅: <b>{chgPct >= 0 ? "+" : ""}{chgPct.toFixed(2)}%</b></div>
          <div style={{color:"#8ab0c0"}}>量: <b>{(hd.volume || 0).toLocaleString()}</b>張</div>
        </div>
      )}

      {/* Canvas 層 */}
      <div style={{ position:"relative" }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ width:"100%", maxWidth:W, height:"auto", display:"block" }} />
        <canvas ref={overlayRef} width={W} height={H}
          onMouseMove={handleMouse}
          onMouseLeave={() => setHoverIdx(-1)}
          style={{ position:"absolute", top:0, left:0, width:"100%", maxWidth:W, height:"auto", cursor:"crosshair" }} />
      </div>
    </div>
  );
}

// ═══ Modal ════════════════════════════════════════════
function StockModal({ stock, priceInfo, onClose }) {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("day");
  const [range, setRange] = useState("6m");

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError("");
    fetch(`/api/candles?symbol=${stock.id}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        if (json.error) { setError(json.error); setLoading(false); return; }
        const candles = (json.data || json.candles || []).map(c => ({
          date:c.date, open:c.open, high:c.high, low:c.low, close:c.close, volume:c.volume||0,
        })).sort((a,b) => new Date(a.date) - new Date(b.date));
        setRawData(candles);
        setLoading(false);
      })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [stock.id]);

  const displayData = useMemo(() => {
    if (!rawData) return [];
    return aggregateCandles(filterByRange(rawData, range), unit);
  }, [rawData, unit, range]);

  const UNITS = [["day","日"],["week","週"],["month","月"]];
  const RANGES = [["3m","3個月"],["6m","半年"],["1y","1年"]];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:12}}
      onClick={e=>{if(e.target===e.currentTarget) onClose();}}>
      <div style={{background:"#0c1620",border:"1px solid #1e3a5f",borderRadius:10,width:"100%",maxWidth:880,maxHeight:"94vh",overflow:"auto",padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{display:"flex",alignItems:"baseline",gap:10}}>
              <span style={{fontSize:20,fontWeight:700,color:"#e0e8f0"}}>{stock.id}</span>
              <span style={{fontSize:15,color:"#8ab0c0",fontFamily:"'Noto Sans TC'"}}>{stock.name}</span>
            </div>
            <div style={{fontSize:11,color:"#3a6a8a",fontFamily:"'Noto Sans TC'",marginTop:2}}>{stock.cat} · {stock.role}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#3a6a8a",fontSize:24,cursor:"pointer"}}>×</button>
        </div>

        {priceInfo && priceInfo.price > 0 && (
          <div style={{display:"flex",gap:20,marginBottom:14,padding:"8px 14px",background:"#070b12",borderRadius:8,flexWrap:"wrap"}}>
            <div><div style={{fontSize:10,color:"#3a6a8a"}}>股價</div><div style={{fontSize:18,fontWeight:700,color:"#e0e8f0"}}>{priceInfo.price.toFixed(2)}</div></div>
            <div><div style={{fontSize:10,color:"#3a6a8a"}}>漲跌</div><div style={{fontSize:14,fontWeight:600,color:TCC(priceInfo.change)}}>{priceInfo.change>0?"+":""}{priceInfo.change.toFixed(2)} ({priceInfo.changePct>0?"+":""}{priceInfo.changePct.toFixed(2)}%)</div></div>
            <div><div style={{fontSize:10,color:"#3a6a8a"}}>最高</div><div style={{fontSize:14,color:"#7a9ab8"}}>{priceInfo.high.toFixed(2)}</div></div>
            <div><div style={{fontSize:10,color:"#3a6a8a"}}>最低</div><div style={{fontSize:14,color:"#7a9ab8"}}>{priceInfo.low.toFixed(2)}</div></div>
          </div>
        )}

        <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:10}}>
          <div style={{display:"flex",gap:4}}>
            {UNITS.map(([k,l])=>(<button key={k} onClick={()=>setUnit(k)} style={{padding:"5px 14px",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"'Noto Sans TC'",border:"1px solid "+(unit===k?"#ff5252":"#1e3a5f"),background:unit===k?"#ff5252":"transparent",color:unit===k?"#fff":"#4a8aaa"}}>{l}K</button>))}
          </div>
          <div style={{display:"flex",gap:4}}>
            {RANGES.map(([k,l])=>(<button key={k} onClick={()=>setRange(k)} style={{padding:"5px 14px",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"'Noto Sans TC'",border:"1px solid "+(range===k?"#4fc3f7":"#1e3a5f"),background:range===k?"#4fc3f7":"transparent",color:range===k?"#070b12":"#4a8aaa"}}>{l}</button>))}
          </div>
        </div>

        <div style={{background:"#0a0e18",borderRadius:8,padding:"8px 4px",marginBottom:10,minHeight:200}}>
          {loading && <div style={{textAlign:"center",padding:60,color:"#3a6a8a",fontFamily:"'Noto Sans TC'"}}>載入K線資料中...</div>}
          {error && <div style={{textAlign:"center",padding:60,color:"#ff8a65",fontFamily:"'Noto Sans TC'"}}>❌ {error}</div>}
          {!loading && !error && displayData.length===0 && <div style={{textAlign:"center",padding:60,color:"#3a6a8a",fontFamily:"'Noto Sans TC'"}}>無資料</div>}
          {!loading && !error && displayData.length>0 && <CandleChart data={displayData} />}
        </div>

        {!loading && !error && displayData.length>0 && (
          <div style={{fontSize:11,color:"#3a6a8a",fontFamily:"'Noto Sans TC'",textAlign:"right"}}>
            共 {displayData.length} 根{unit==="day"?"日":unit==="week"?"週":"月"}K · 資料來源 Fugle
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ 主程式 ════════════════════════════════════════════
export default function App() {
  const [prices,setPrices]=useState({}); const [loading,setLoading]=useState(false);
  const [error,setError]=useState(""); const [lastFetch,setLastFetch]=useState("");
  const [cat,setCat]=useState("全部"); const [q,setQ]=useState("");
  const [custom,setCustom]=useState(()=>{try{return JSON.parse(localStorage.getItem("twstock_custom")||"[]")}catch{return[]}});
  const [showAdd,setShowAdd]=useState(false); const [form,setForm]=useState({id:"",name:"",cat:"核心製造",role:""});
  const [formErr,setFormErr]=useState(""); const [selectedStock,setSelectedStock]=useState(null);
  const [hidden,setHidden]=useState(()=>{try{return JSON.parse(localStorage.getItem("twstock_hidden")||"[]")}catch{return[]}});
  const [showHidden,setShowHidden]=useState(false);

  async function fetchPrices(){setLoading(true);setError("");try{const res=await fetch("/api/prices");if(!res.ok)throw new Error("API "+res.status);const text=await res.text();const data=parseCSV(text);if(Object.keys(data).length===0)throw new Error("無資料");setPrices(data);setLastFetch(new Date().toLocaleTimeString("zh-TW"));}catch(e){setError(e.message);}setLoading(false);}
  useEffect(()=>{fetchPrices();},[]);

  const allStocks=useMemo(()=>{const ids=new Set(STOCK_META.map(s=>s.id));return[...STOCK_META,...custom.filter(s=>!ids.has(s.id))];},[custom]);
  const hiddenSet=useMemo(()=>new Set(hidden),[hidden]);
  const visibleStocks=useMemo(()=>allStocks.filter(s=>!hiddenSet.has(s.id)),[allStocks,hiddenSet]);
  const allCats=useMemo(()=>["全部",...([...new Set(visibleStocks.map(s=>s.cat))])]  ,[visibleStocks]);
  const filtered=useMemo(()=>visibleStocks.filter(s=>(cat==="全部"||s.cat===cat)&&(q===""||s.id.includes(q)||s.name.includes(q)||s.role.includes(q))),[visibleStocks,cat,q]);

  function addStock(){if(!form.id.trim()){setFormErr("請輸入代號");return;}if(!form.name.trim()){setFormErr("請輸入名稱");return;}if(allStocks.find(s=>s.id===form.id.trim())){setFormErr("此代號已存在");return;}const next=[...custom,{id:form.id.trim(),name:form.name.trim(),cat:form.cat,role:form.role.trim()||"自訂"}];setCustom(next);try{localStorage.setItem("twstock_custom",JSON.stringify(next));}catch(_){}setForm({id:"",name:"",cat:"核心製造",role:""});setFormErr("");setShowAdd(false);}
  function removeCustom(id){const next=custom.filter(s=>s.id!==id);setCustom(next);try{localStorage.setItem("twstock_custom",JSON.stringify(next));}catch(_){}}
  function hideStock(id){const next=[...hidden,id];setHidden(next);try{localStorage.setItem("twstock_hidden",JSON.stringify(next));}catch(_){}}
  function unhideStock(id){const next=hidden.filter(h=>h!==id);setHidden(next);try{localStorage.setItem("twstock_hidden",JSON.stringify(next));}catch(_){}}
  function removeStock(id){if(isCustom(id)){removeCustom(id);}else{hideStock(id);}}
  const isCustom=id=>custom.some(s=>s.id===id);
  const hiddenStocks=useMemo(()=>allStocks.filter(s=>hiddenSet.has(s.id)),[allStocks,hiddenSet]);

  return (
    <div style={{minHeight:"100vh",background:"#070b12",color:"#dce8f0",fontFamily:"'IBM Plex Mono','Courier New',monospace"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600&family=Noto+Sans+TC:wght@300;400;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px;}.btn{background:none;border:none;cursor:pointer;font-family:inherit;transition:all .18s;}.btn:hover{opacity:.75;}.row{transition:background .12s;cursor:pointer;}.row:hover{background:rgba(0,245,160,.06)!important;}.inp{background:#0c1620;border:1px solid #1e3a5f;color:#dce8f0;padding:6px 10px;border-radius:5px;font-family:inherit;font-size:13px;outline:none;width:100%;}.inp:focus{border-color:#00f5a0;}.chip{padding:4px 10px;border-radius:20px;font-size:11px;cursor:pointer;border:1px solid transparent;font-family:inherit;background:none;transition:all .15s;}.card{background:#0c1620;border:1px solid #192d44;border-radius:8px;}@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fu .28s ease forwards;}.tag{display:inline-block;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:700;}.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;}select.inp{cursor:pointer;}@keyframes spin{to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin 1s linear infinite;}thead th{position:sticky;top:0;z-index:2;}`}</style>

      <div style={{background:"#060a10",borderBottom:"1px solid #192d44",padding:"13px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:17,fontWeight:700,color:"#00f5a0",fontFamily:"'Noto Sans TC'",letterSpacing:1}}>📋 台股精選清單</div>
          <div style={{fontSize:10,color:"#3a6a8a",marginTop:2}}>共 <span style={{color:"#00f5a0",fontWeight:700}}>{visibleStocks.length}</span> 支 · 19大產業精選{custom.length>0&&<span style={{color:"#ffd54f"}}> · 自訂 {custom.length}</span>}{hidden.length>0&&<span style={{color:"#ff8a65"}}> · 隱藏 {hidden.length}</span>}{lastFetch&&<span> · 更新 {lastFetch}</span>}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn" onClick={fetchPrices} disabled={loading} style={{padding:"7px 14px",borderRadius:6,border:"1px solid #1e3a5f",color:"#4a8aaa",fontSize:13,fontFamily:"'Noto Sans TC'"}}>{loading?<span className="spin">⟳</span>:"⟳"} 更新</button>
          {hidden.length>0&&<button className="btn" onClick={()=>setShowHidden(true)} style={{padding:"7px 14px",borderRadius:6,border:"1px solid #ff8a65",color:"#ff8a65",fontSize:12,fontFamily:"'Noto Sans TC'"}}>隱藏 {hidden.length}</button>}
          <button className="btn" onClick={()=>setShowAdd(true)} style={{background:"#00f5a0",color:"#070b12",padding:"7px 16px",borderRadius:6,fontWeight:700,fontSize:13,fontFamily:"'Noto Sans TC'"}}>＋ 新增股票</button>
        </div>
      </div>

      {error&&<div style={{background:"#1a0000",borderBottom:"1px solid #3a0000",padding:"9px 18px",fontSize:12,color:"#ff8a65",fontFamily:"'Noto Sans TC'"}}>❌ {error}</div>}

      <div style={{padding:"12px 16px",background:"#060a10",borderBottom:"1px solid #192d44"}}>
        <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
          <input className="inp" placeholder="搜尋代號 / 名稱 / 角色..." value={q} onChange={e=>setQ(e.target.value)} style={{maxWidth:240,fontSize:12}}/>
          <span style={{fontSize:11,color:"#3a6a8a",whiteSpace:"nowrap"}}>顯示 <span style={{color:"#00f5a0",fontWeight:700}}>{filtered.length}</span> 支</span>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {allCats.map(c=>(<button key={c} className="chip" onClick={()=>setCat(c)} style={{color:cat===c?"#070b12":"#4a8aaa",background:cat===c?"#00f5a0":"transparent",borderColor:cat===c?"#00f5a0":"#1e3a5f",fontFamily:"'Noto Sans TC'"}}>{c}</button>))}
        </div>
      </div>

      <div style={{padding:"14px 16px",maxWidth:1200,margin:"0 auto"}}>
        <div className="card fu" style={{overflow:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{background:"#060a10",borderBottom:"1px solid #192d44"}}>
              {["代號","名稱","產業","角色","股價","漲跌","漲跌%","最高","最低","量(張)",""].map(h=>(<th key={h} style={{padding:"8px 11px",background:"#060a10",textAlign:["代號","名稱","產業","角色"].includes(h)?"left":"right",color:"#3a6a8a",fontWeight:500,fontFamily:"'Noto Sans TC'",fontSize:11,whiteSpace:"nowrap"}}>{h}</th>))}
            </tr></thead>
            <tbody>
              {filtered.map((s,i)=>{const p=prices[s.id];const hp=p&&p.price>0;return(
                <tr key={s.id+i} className="row" onClick={()=>setSelectedStock(s)} style={{borderBottom:"1px solid #0c1620"}}>
                  <td style={{padding:"8px 11px"}}><span style={{color:"#00c876",fontWeight:700}}>{s.id}</span>{isCustom(s.id)&&<span className="tag" style={{background:"#ffd54f18",color:"#ffd54f",border:"1px solid #ffd54f30",marginLeft:5}}>自訂</span>}</td>
                  <td style={{padding:"8px 11px",color:"#e0e8f0",fontFamily:"'Noto Sans TC'",fontWeight:500,whiteSpace:"nowrap"}}>{s.name}</td>
                  <td style={{padding:"8px 11px"}}><span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:"#1a2d45",color:"#5a8aaa",fontFamily:"'Noto Sans TC'",whiteSpace:"nowrap"}}>{s.cat}</span></td>
                  <td style={{padding:"8px 11px",color:"#3a6a8a",fontSize:11,fontFamily:"'Noto Sans TC'",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.role}</td>
                  <td style={{padding:"8px 11px",textAlign:"right",color:"#e0e8f0",fontWeight:600}}>{loading?"…":hp?p.price.toFixed(2):<span style={{color:"#2a4a5a"}}>—</span>}</td>
                  <td style={{padding:"8px 11px",textAlign:"right",color:hp?TCC(p.change):"#2a4a5a",fontWeight:600}}>{loading?"…":hp?(p.change>0?"+":"")+p.change.toFixed(2):"—"}</td>
                  <td style={{padding:"8px 11px",textAlign:"right",color:hp?TCC(p.changePct):"#2a4a5a",fontWeight:700}}>{loading?"…":hp?(p.changePct>0?"▲":"▼")+Math.abs(p.changePct).toFixed(2)+"%":"—"}</td>
                  <td style={{padding:"8px 11px",textAlign:"right",color:"#7a9ab8"}}>{loading?"…":hp?p.high.toFixed(2):"—"}</td>
                  <td style={{padding:"8px 11px",textAlign:"right",color:"#7a9ab8"}}>{loading?"…":hp?p.low.toFixed(2):"—"}</td>
                  <td style={{padding:"8px 11px",textAlign:"right",color:"#4a7a9a"}}>{loading?"…":hp?p.vol.toLocaleString():"—"}</td>
                  <td style={{padding:"8px 11px",textAlign:"right"}}><button className="btn" onClick={e=>{e.stopPropagation();removeStock(s.id);}} style={{color:"#ff5252",fontSize:15,lineHeight:1,opacity:0.4}} onMouseOver={e=>e.target.style.opacity=1} onMouseOut={e=>e.target.style.opacity=0.4}>×</button></td>
                </tr>);})}
              {filtered.length===0&&<tr><td colSpan={11} style={{padding:40,textAlign:"center",color:"#3a6a8a",fontFamily:"'Noto Sans TC'"}}>沒有符合條件的股票</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd&&(<div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget){setShowAdd(false);setFormErr("");}}}>
        <div className="card fu" style={{width:"100%",maxWidth:420,padding:24,borderColor:"#1e3a5f"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontSize:15,fontWeight:700,color:"#00f5a0",fontFamily:"'Noto Sans TC'"}}>＋ 新增股票</div><button className="btn" onClick={()=>{setShowAdd(false);setFormErr("");}} style={{color:"#3a6a8a",fontSize:22}}>×</button></div>
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            <div><div style={{fontSize:11,color:"#3a6a8a",marginBottom:5,fontFamily:"'Noto Sans TC'"}}>股票代號 *</div><input className="inp" placeholder="例：0050" value={form.id} onChange={e=>setForm(f=>({...f,id:e.target.value}))}/></div>
            <div><div style={{fontSize:11,color:"#3a6a8a",marginBottom:5,fontFamily:"'Noto Sans TC'"}}>公司名稱 *</div><input className="inp" placeholder="例：元大台灣50" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
            <div><div style={{fontSize:11,color:"#3a6a8a",marginBottom:5,fontFamily:"'Noto Sans TC'"}}>產業類別</div><select className="inp" value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>{[...new Set(STOCK_META.map(s=>s.cat))].map(c=><option key={c} value={c}>{c}</option>)}<option value="其他">其他</option></select></div>
            <div><div style={{fontSize:11,color:"#3a6a8a",marginBottom:5,fontFamily:"'Noto Sans TC'"}}>角色定位（選填）</div><input className="inp" placeholder="例：ETF 台灣加權指數" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}/></div>
            {formErr&&<div style={{fontSize:12,color:"#ff5252",fontFamily:"'Noto Sans TC'"}}>⚠ {formErr}</div>}
            <div style={{display:"flex",gap:10,marginTop:4}}>
              <button className="btn" onClick={()=>{setShowAdd(false);setFormErr("");}} style={{flex:1,padding:"10px",borderRadius:6,border:"1px solid #1e3a5f",color:"#3a6a8a",fontSize:13,fontFamily:"'Noto Sans TC'"}}>取消</button>
              <button className="btn" onClick={addStock} style={{flex:2,padding:"10px",borderRadius:6,background:"#00f5a0",color:"#070b12",fontWeight:700,fontSize:13,fontFamily:"'Noto Sans TC'"}}>確認新增</button>
            </div>
          </div>
        </div>
      </div>)}

      {selectedStock&&<StockModal stock={selectedStock} priceInfo={prices[selectedStock.id]} onClose={()=>setSelectedStock(null)} />}

      {/* 管理隱藏股票 Modal */}
      {showHidden&&(<div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget)setShowHidden(false);}}>
        <div className="card fu" style={{width:"100%",maxWidth:500,padding:24,borderColor:"#1e3a5f",maxHeight:"80vh",overflow:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:700,color:"#ff8a65",fontFamily:"'Noto Sans TC'"}}>已隱藏的股票（{hiddenStocks.length}支）</div>
            <button className="btn" onClick={()=>setShowHidden(false)} style={{color:"#3a6a8a",fontSize:22}}>×</button>
          </div>
          {hiddenStocks.length===0?<div style={{padding:30,textAlign:"center",color:"#3a6a8a",fontFamily:"'Noto Sans TC'"}}>沒有隱藏的股票</div>:
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {hiddenStocks.map(s=>(
              <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"#070b12",borderRadius:6}}>
                <div>
                  <span style={{color:"#00c876",fontWeight:700,marginRight:8}}>{s.id}</span>
                  <span style={{color:"#e0e8f0",fontFamily:"'Noto Sans TC'",fontSize:13}}>{s.name}</span>
                  <span style={{color:"#3a6a8a",fontSize:11,marginLeft:8}}>{s.cat}</span>
                </div>
                <button className="btn" onClick={()=>unhideStock(s.id)} style={{padding:"4px 12px",borderRadius:5,border:"1px solid #00f5a0",color:"#00f5a0",fontSize:11,fontFamily:"'Noto Sans TC'"}}>恢復</button>
              </div>
            ))}
            <button className="btn" onClick={()=>{setHidden([]);try{localStorage.setItem("twstock_hidden","[]");}catch(_){}}} style={{marginTop:10,padding:"8px",borderRadius:6,border:"1px solid #ff8a65",color:"#ff8a65",fontSize:12,fontFamily:"'Noto Sans TC'",width:"100%"}}>全部恢復</button>
          </div>}
        </div>
      </div>)}
    </div>
  );
}
