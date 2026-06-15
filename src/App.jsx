import { useState, useEffect, useMemo } from "react";

// ══════════════════════════════════════════════════
//  ⚠️  部署前請把下面這行換成你的 Google Sheet URL
//  執行 GAS 的 getPublicCsvUrl() 後複製 log 的網址
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1CE5ZJUBwkoicw5ZZJmKC2Gtwe9Z-dZEdkjhhrl1_GVM/export?format=csv&gid=2111487283";
// 多個 CORS proxy 備用，依序嘗試
const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://cors-anywhere.herokuapp.com/${url}`,
];

const STOCK_META = [
  {id:"2330",name:"台積電",cat:"核心製造",role:"晶圓代工龍頭"},
  {id:"2303",name:"聯電",cat:"核心製造",role:"晶圓代工"},
  {id:"3711",name:"日月光",cat:"核心製造",role:"封測龍頭"},
  {id:"6770",name:"力積電",cat:"核心製造",role:"晶圓代工"},
  {id:"2325",name:"矽品",cat:"核心製造",role:"封測"},
  {id:"2449",name:"京元電子",cat:"核心製造",role:"晶圓測試"},
  {id:"6223",name:"旺矽",cat:"核心製造",role:"晶圓測試探針卡"},
  {id:"5347",name:"世界",cat:"半導體設備",role:"特殊晶圓代工"},
  {id:"3583",name:"辛耘",cat:"半導體設備",role:"半導體製程設備"},
  {id:"3131",name:"弘塑",cat:"半導體設備",role:"晶圓清洗設備"},
  {id:"3680",name:"家登",cat:"半導體設備",role:"光罩盒/晶圓盒"},
  {id:"2404",name:"漢唐",cat:"半導體設備",role:"廠務工程"},
  {id:"1560",name:"中砂",cat:"半導體設備",role:"研磨材料/鑽石碟"},
  {id:"6488",name:"環球晶",cat:"半導體設備",role:"矽晶圓龍頭"},
  {id:"3016",name:"嘉晶",cat:"半導體設備",role:"化合物半導體磊晶"},
  {id:"5483",name:"中美晶",cat:"半導體設備",role:"矽晶圓/太陽能"},
  {id:"6509",name:"聚和",cat:"半導體設備",role:"化學品/封裝材料"},
  {id:"4766",name:"南寶",cat:"半導體設備",role:"黏著劑/電子材料"},
  {id:"6510",name:"精測",cat:"半導體設備",role:"IC測試介面板"},
  {id:"3289",name:"宜特",cat:"半導體設備",role:"可靠度測試"},
  {id:"3587",name:"閎康",cat:"半導體設備",role:"材料分析檢測"},
  {id:"6830",name:"汎銓",cat:"半導體設備",role:"半導體材料分析"},
  {id:"8150",name:"南茂",cat:"半導體設備",role:"記憶體封測"},
  {id:"6217",name:"中探針",cat:"半導體設備",role:"探針卡"},
  {id:"3563",name:"牧德",cat:"半導體設備",role:"PCB光學檢測AOI"},
  {id:"3264",name:"欣銓",cat:"半導體設備",role:"IC測試"},
  {id:"2329",name:"華泰",cat:"半導體設備",role:"MOSFET封測"},
  {id:"2454",name:"聯發科",cat:"IC設計",role:"AI/AP晶片"},
  {id:"2379",name:"瑞昱",cat:"IC設計",role:"網通晶片"},
  {id:"3034",name:"聯詠",cat:"IC設計",role:"顯示驅動IC"},
  {id:"2344",name:"華邦電",cat:"IC設計",role:"記憶體IC"},
  {id:"8299",name:"群聯",cat:"IC設計",role:"NAND控制IC"},
  {id:"2337",name:"旺宏",cat:"IC設計",role:"NOR Flash"},
  {id:"3443",name:"創意",cat:"IC設計",role:"ASIC設計"},
  {id:"5274",name:"信驊",cat:"IC設計",role:"BMC/AI伺服器晶片"},
  {id:"3661",name:"世芯-KY",cat:"IC設計",role:"ASIC設計龍頭"},
  {id:"2388",name:"威盛",cat:"IC設計",role:"系統晶片"},
  {id:"3006",name:"晶豪科",cat:"IC設計",role:"SRAM利基記憶體"},
  {id:"8086",name:"宏捷科",cat:"IC設計",role:"GaAs功率放大器"},
  {id:"5222",name:"全訊",cat:"IC設計",role:"GaN功率放大器·衛星"},
  {id:"3105",name:"穩懋",cat:"IC設計",role:"GaAs晶圓代工·SpaceX"},
  {id:"2455",name:"全新",cat:"IC設計",role:"化合物半導體磊晶"},
  {id:"3081",name:"聯亞",cat:"IC設計",role:"光通訊IC"},
  {id:"3529",name:"力旺",cat:"IC記憶體",role:"嵌入式非揮發記憶體"},
  {id:"8016",name:"矽創",cat:"IC記憶體",role:"LCD驅動IC"},
  {id:"6462",name:"神盾",cat:"IC記憶體",role:"指紋辨識IC"},
  {id:"3035",name:"智原",cat:"IC記憶體",role:"ASIC設計服務"},
  {id:"6643",name:"M31",cat:"IC記憶體",role:"矽智財IP"},
  {id:"3545",name:"敦泰",cat:"IC記憶體",role:"觸控/驅動IC"},
  {id:"3041",name:"揚智",cat:"IC記憶體",role:"多媒體SoC"},
  {id:"2436",name:"偉詮電",cat:"IC記憶體",role:"電源管理IC"},
  {id:"2458",name:"義隆",cat:"IC記憶體",role:"觸控/指紋IC"},
  {id:"6202",name:"盛群",cat:"IC記憶體",role:"MCU"},
  {id:"3094",name:"聯傑",cat:"IC記憶體",role:"有線通訊IC"},
  {id:"6411",name:"晶焱",cat:"IC記憶體",role:"ESD防護IC"},
  {id:"6291",name:"沛亨",cat:"IC記憶體",role:"電源管理IC"},
  {id:"4968",name:"立積",cat:"IC記憶體",role:"WiFi射頻前端IC"},
  {id:"3530",name:"晶相光",cat:"IC記憶體",role:"CMOS影像感測IC"},
  {id:"8081",name:"致新",cat:"IC記憶體",role:"電源管理IC"},
  {id:"3227",name:"原相",cat:"IC記憶體",role:"光學感測IC"},
  {id:"5269",name:"祥碩",cat:"IC記憶體",role:"USB/高速傳輸IC"},
  {id:"4966",name:"譜瑞-KY",cat:"IC記憶體",role:"顯示晶片/Type-C"},
  {id:"6104",name:"創惟",cat:"IC記憶體",role:"USB Hub IC"},
  {id:"4919",name:"新唐",cat:"IC記憶體",role:"MCU"},
  {id:"2317",name:"鴻海",cat:"AI伺服器",role:"伺服器代工龍頭"},
  {id:"2382",name:"廣達",cat:"AI伺服器",role:"雲端伺服器"},
  {id:"2356",name:"英業達",cat:"AI伺服器",role:"伺服器ODM"},
  {id:"6669",name:"緯穎",cat:"AI伺服器",role:"雲端伺服器"},
  {id:"3231",name:"緯創",cat:"AI伺服器",role:"伺服器ODM"},
  {id:"2353",name:"宏碁",cat:"AI伺服器",role:"PC/伺服器"},
  {id:"2357",name:"華碩",cat:"AI伺服器",role:"GPU伺服器主機板"},
  {id:"2376",name:"技嘉",cat:"AI伺服器",role:"GPU伺服器主機板"},
  {id:"2377",name:"微星",cat:"AI伺服器",role:"GPU伺服器主機板"},
  {id:"2345",name:"智邦",cat:"AI伺服器",role:"網路交換器"},
  {id:"6285",name:"啟碁",cat:"AI伺服器",role:"相位陣列天線·衛星"},
  {id:"2301",name:"光寶科",cat:"AI伺服器",role:"電源供應器"},
  {id:"5388",name:"中磊",cat:"AI伺服器",role:"低軌衛星Modem/CPE"},
  {id:"3062",name:"建漢",cat:"AI伺服器",role:"網通·衛星地面站"},
  {id:"3380",name:"明泰",cat:"AI伺服器",role:"網通·衛星地面站"},
  {id:"6414",name:"樺漢",cat:"PCB散熱",role:"工業電腦/AIoT"},
  {id:"2464",name:"盟立",cat:"PCB散熱",role:"自動化設備"},
  {id:"3324",name:"雙鴻",cat:"PCB散熱",role:"散熱模組"},
  {id:"2421",name:"建準",cat:"PCB散熱",role:"散熱風扇/馬達"},
  {id:"6282",name:"康舒",cat:"PCB散熱",role:"電源供應器"},
  {id:"2493",name:"揚博",cat:"PCB散熱",role:"高頻PCB"},
  {id:"8291",name:"尚茂",cat:"PCB散熱",role:"高頻PCB"},
  {id:"5349",name:"先豐",cat:"PCB散熱",role:"PCB/軟板"},
  {id:"3044",name:"健鼎",cat:"PCB散熱",role:"多層PCB"},
  {id:"6269",name:"台郡",cat:"PCB散熱",role:"軟板FPC"},
  {id:"4939",name:"亞電",cat:"PCB散熱",role:"PCB"},
  {id:"8039",name:"台虹",cat:"PCB散熱",role:"覆銅板CCL"},
  {id:"3013",name:"晟銘電",cat:"PCB散熱",role:"機殼/散熱"},
  {id:"2354",name:"鴻準",cat:"PCB散熱",role:"機殼/散熱"},
  {id:"2395",name:"研華",cat:"PCB散熱",role:"工業電腦龍頭"},
  {id:"8114",name:"振樺電",cat:"PCB散熱",role:"工業電腦"},
  {id:"3022",name:"威強電",cat:"PCB散熱",role:"工業電腦"},
  {id:"6245",name:"立端",cat:"PCB散熱",role:"嵌入式電腦"},
  {id:"3596",name:"智易",cat:"PCB散熱",role:"網通設備"},
  {id:"2352",name:"佳世達",cat:"PCB散熱",role:"網通/顯示設備"},
  {id:"2431",name:"聯昌",cat:"PCB散熱",role:"PCB供應鏈"},
  {id:"1802",name:"台玻",cat:"PCB散熱",role:"玻璃基板"},
  {id:"1815",name:"富喬",cat:"PCB散熱",role:"玻璃纖維/基板"},
  {id:"2316",name:"楠梓電",cat:"PCB散熱",role:"PCB"},
  {id:"5469",name:"瀚宇博",cat:"PCB散熱",role:"PCB"},
  {id:"3715",name:"定穎投控",cat:"PCB散熱",role:"PCB"},
  {id:"3374",name:"精材",cat:"CoWoS",role:"CoWoS基板(台積電子公司)"},
  {id:"8046",name:"南電",cat:"CoWoS",role:"ABF載板"},
  {id:"3037",name:"欣興",cat:"CoWoS",role:"ABF載板·千元股"},
  {id:"3189",name:"景碩",cat:"CoWoS",role:"IC載板"},
  {id:"4958",name:"臻鼎-KY",cat:"CoWoS",role:"FPC/AI載板"},
  {id:"7769",name:"鴻勁",cat:"CoWoS",role:"高階PCB"},
  {id:"2467",name:"志超",cat:"CoWoS",role:"高頻PCB"},
  {id:"2313",name:"華通",cat:"衛星PCB",role:"衛星板市占9成·SpaceX核心"},
  {id:"2367",name:"燿華",cat:"衛星PCB",role:"衛星PCB·泰國廠擴產"},
  {id:"2355",name:"敬鵬",cat:"衛星PCB",role:"高頻PCB·低軌衛星"},
  {id:"2368",name:"金像電",cat:"衛星PCB",role:"HDI PCB·衛星通訊"},
  {id:"4909",name:"新復興",cat:"衛星PCB",role:"衛星PCB"},
  {id:"2383",name:"台光電",cat:"衛星PCB",role:"銅箔基板CCL·高頻板材"},
  {id:"6274",name:"台燿",cat:"衛星PCB",role:"CCL銅箔基板·低軌衛星"},
  {id:"6213",name:"聯茂",cat:"衛星PCB",role:"高頻CCL板材"},
  {id:"2312",name:"金寶",cat:"衛星PCB",role:"衛星基地台主機板"},
  {id:"3491",name:"昇達科",cat:"衛星射頻",role:"血統最純·SpaceX核心"},
  {id:"6271",name:"同欣電",cat:"衛星射頻",role:"高頻陶瓷封裝·SpaceX"},
  {id:"3152",name:"璟德",cat:"衛星射頻",role:"LTCC陶瓷濾波器·全球前3"},
  {id:"3138",name:"耀登",cat:"衛星射頻",role:"無線射頻天線"},
  {id:"6568",name:"宏觀",cat:"衛星射頻",role:"衛星相位陣列天線"},
  {id:"2485",name:"兆赫",cat:"衛星射頻",role:"衛星通訊模組"},
  {id:"3305",name:"昇貿",cat:"衛星射頻",role:"衛星射頻封裝"},
  {id:"6127",name:"九豪",cat:"衛星射頻",role:"射頻封裝基板"},
  {id:"6152",name:"百一",cat:"衛星射頻",role:"通訊模組·衛星概念"},
  {id:"4916",name:"事欣科",cat:"衛星射頻",role:"ITAR認證·SpaceX星鏈"},
  {id:"2314",name:"台揚",cat:"衛星射頻",role:"寬頻衛星通訊設備"},
  {id:"6443",name:"元晶",cat:"衛星射頻",role:"太陽能·SpaceX供應"},
  {id:"6706",name:"惠特",cat:"衛星光通訊",role:"光通訊模組·ISL衛星間鏈路"},
  {id:"6442",name:"光聖",cat:"衛星光通訊",role:"光通訊模組"},
  {id:"7717",name:"萊德光電",cat:"衛星光通訊",role:"高功率光纖合束器"},
  {id:"6979",name:"聯鈞",cat:"衛星光通訊",role:"衛星間光通訊"},
  {id:"6413",name:"華星光",cat:"衛星光通訊",role:"光通訊模組"},
  {id:"2308",name:"台達電",cat:"散熱電源",role:"電源/AI伺服器電源"},
  {id:"3017",name:"奇鋐",cat:"散熱電源",role:"AI散熱方案"},
  {id:"3541",name:"建準",cat:"散熱電源",role:"散熱風扇"},
  {id:"3653",name:"健策",cat:"散熱電源",role:"均溫板/液冷"},
  {id:"3576",name:"新日興",cat:"散熱電源",role:"精密鉸鏈/散熱"},
  {id:"1519",name:"華城",cat:"散熱電源",role:"高壓變壓器/AI電網"},
  {id:"2408",name:"南亞科",cat:"HBM記憶體",role:"DRAM"},
  {id:"3260",name:"威剛",cat:"HBM記憶體",role:"記憶體模組"},
  {id:"4967",name:"十銓",cat:"HBM記憶體",role:"記憶體模組"},
  {id:"5289",name:"宜鼎",cat:"HBM記憶體",role:"工業級NAND"},
  {id:"3008",name:"大立光",cat:"光學感測",role:"鏡頭模組龍頭"},
  {id:"6239",name:"力成",cat:"光學感測",role:"感測器封測"},
  {id:"3714",name:"富采",cat:"光學感測",role:"LED/Mini LED"},
  {id:"2448",name:"晶電",cat:"光學感測",role:"LED磊晶"},
  {id:"2049",name:"上銀",cat:"設備材料",role:"精密機械/線性滑軌"},
  {id:"2360",name:"致茂",cat:"設備材料",role:"測試設備"},
  {id:"3533",name:"嘉澤",cat:"設備材料",role:"高速連接器"},
  {id:"2327",name:"國巨",cat:"設備材料",role:"被動元件龍頭"},
  {id:"6147",name:"頎邦",cat:"設備材料",role:"IC封裝材料"},
  {id:"3030",name:"德律",cat:"設備材料",role:"AOI/ICT檢測·NVIDIA供應"},
  {id:"3023",name:"信邦",cat:"設備材料",role:"線材連接器·衛星供應鏈"},
  {id:"6190",name:"萬泰科",cat:"設備材料",role:"線材·衛星供應鏈"},
  {id:"3665",name:"貿聯-KY",cat:"設備材料",role:"線材連接器"},
  {id:"3501",name:"維熹",cat:"設備材料",role:"連接器·衛星供應鏈"},
  {id:"2634",name:"漢翔",cat:"軍工航太",role:"航空工業龍頭"},
  {id:"4572",name:"駐龍",cat:"軍工航太",role:"無人機/國防"},
  {id:"2645",name:"長榮航太",cat:"軍工航太",role:"航空維修MRO"},
  {id:"8222",name:"寶一",cat:"軍工航太",role:"精密零件/國防"},
  {id:"5284",name:"jpp-KY",cat:"軍工航太",role:"無人機系統"},
  {id:"5009",name:"榮剛",cat:"軍工航太",role:"特殊鋼材/國防"},
  {id:"3490",name:"耀登",cat:"軍工航太",role:"天線/無人機"},
  {id:"8033",name:"雷虎",cat:"軍工航太",role:"遙控載具/無人機"},
  {id:"2497",name:"怡利電",cat:"軍工航太",role:"車用電子/航太"},
  {id:"3552",name:"同致",cat:"軍工航太",role:"車用感測/雷達"},
  {id:"6235",name:"華孚",cat:"軍工航太",role:"精密機械"},
  {id:"1536",name:"和大",cat:"軍工航太",role:"齒輪箱/風電"},
  {id:"4551",name:"智伸科",cat:"軍工航太",role:"精密零件"},
  {id:"4529",name:"昶瑞機電",cat:"軍工航太",role:"精密機電"},
  {id:"6863",name:"瑞鼎",cat:"軍工航太",role:"OLED驅動IC"},
  {id:"4934",name:"太極",cat:"軍工航太",role:"系統整合"},
  {id:"3691",name:"碩禾",cat:"軍工航太",role:"導電漿/太陽能"},
  {id:"2243",name:"宏佳騰",cat:"軍工航太",role:"電動車/機車"},
  {id:"1568",name:"倉佑",cat:"軍工航太",role:"精密零件"},
  {id:"3707",name:"漢磊",cat:"軍工航太",role:"化合物半導體"},
  {id:"1513",name:"中興電",cat:"能源重電",role:"重電設備"},
  {id:"1514",name:"亞力",cat:"能源重電",role:"配電設備"},
  {id:"1504",name:"東元",cat:"能源重電",role:"馬達/重電"},
  {id:"6806",name:"森崴能源",cat:"能源重電",role:"風力發電"},
  {id:"3708",name:"上緯投控",cat:"能源重電",role:"離岸風電材料"},
  {id:"6869",name:"雲豹能源",cat:"能源重電",role:"再生能源"},
  {id:"8996",name:"高力",cat:"能源重電",role:"熱交換器/散熱"},
  {id:"1609",name:"大亞",cat:"能源重電",role:"電線電纜"},
  {id:"8936",name:"國統",cat:"能源重電",role:"管線工程"},
  {id:"1605",name:"華新",cat:"能源重電",role:"電線電纜"},
  {id:"1517",name:"士電",cat:"能源重電",role:"重電設備"},
  {id:"1503",name:"大同",cat:"能源重電",role:"重電/能源"},
  {id:"1589",name:"永冠-KY",cat:"能源重電",role:"螺帽/精密件"},
  {id:"9958",name:"世紀鋼",cat:"能源重電",role:"離岸風電鋼構"},
  {id:"6793",name:"天力離岸",cat:"能源重電",role:"離岸風電安裝"},
  {id:"6873",name:"泓德能源",cat:"能源重電",role:"電力工程"},
  {id:"1529",name:"樂事綠能",cat:"能源重電",role:"再生能源"},
  {id:"6477",name:"安集",cat:"能源重電",role:"電動車充電"},
  {id:"3686",name:"達能",cat:"能源重電",role:"電源管理"},
  {id:"8104",name:"錸寶",cat:"能源重電",role:"OLED/能源"},
  {id:"5309",name:"系統電",cat:"能源重電",role:"電力設備"},
  {id:"6441",name:"廣錠",cat:"能源重電",role:"電力電子"},
  {id:"1521",name:"大億",cat:"能源重電",role:"汽車零件"},
  {id:"2412",name:"中華電",cat:"網通基建",role:"電信/AI雲"},
  {id:"4904",name:"遠傳",cat:"網通基建",role:"電信"},
  {id:"3702",name:"大聯大",cat:"網通基建",role:"IC通路"},
  {id:"2409",name:"友達",cat:"面板",role:"面板/顯示"},
  {id:"3481",name:"群創",cat:"面板",role:"FOPLP封裝·SpaceX"},
  {id:"2881",name:"富邦金",cat:"金融",role:"金控"},
  {id:"2882",name:"國泰金",cat:"金融",role:"金控"},
  {id:"2891",name:"中信金",cat:"金融",role:"金控"},
];

// ── CSV 解析（處理含逗號欄位）──────────────────
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
    const id        = cols[0].replace(/"/g, "").trim();
    const price     = parseFloat(cols[1]) || 0;
    const change    = parseFloat(cols[2]) || 0;
    const changePct = parseFloat(cols[3]) || 0;
    const high      = parseFloat(cols[4]) || 0;
    const low       = parseFloat(cols[5]) || 0;
    const vol       = parseInt(cols[6])   || 0;
    const updated   = (cols[7] || "").replace(/"/g, "").trim();
    if (id) result[id] = { price, change, changePct, high, low, vol, updated };
  });
  return result;
}

// ── 多 proxy 備援抓取 ────────────────────────────
async function fetchWithFallback(url) {
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy(url), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.includes(",")) return text; // 簡單驗證是 CSV
    } catch (_) { /* 嘗試下一個 */ }
  }
  throw new Error("所有 proxy 均無法連線，請確認 Sheet 已設為公開");
}

const CC = v => v > 0 ? "#00f5a0" : v < 0 ? "#ff5252" : "#888";
const isConfigured = !SHEET_CSV_URL.includes("YOUR_SHEET_CSV_URL_HERE");

export default function App() {
  const [prices, setPrices]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [lastFetch, setLastFetch] = useState("");
  const [cat, setCat]             = useState("全部");
  const [q, setQ]                 = useState("");
  const [custom, setCustom]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("twstock_custom") || "[]"); } catch { return []; }
  });
  const [showAdd, setShowAdd]     = useState(false);
  const [form, setForm]           = useState({id:"", name:"", cat:"核心製造", role:""});
  const [formErr, setFormErr]     = useState("");

  async function fetchPrices() {
    if (!isConfigured) return;
    setLoading(true); setError("");
    try {
      const text = await fetchWithFallback(SHEET_CSV_URL);
      const data = parseCSV(text);
      if (Object.keys(data).length === 0) throw new Error("資料格式異常，請確認 Sheet 有資料");
      setPrices(data);
      setLastFetch(new Date().toLocaleTimeString("zh-TW"));
    } catch(e) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { fetchPrices(); }, []);

  const allStocks = useMemo(() => {
    const ids = new Set(STOCK_META.map(s => s.id));
    return [...STOCK_META, ...custom.filter(s => !ids.has(s.id))];
  }, [custom]);

  const allCats = useMemo(() =>
    ["全部", ...([...new Set(allStocks.map(s => s.cat))])],
  [allStocks]);

  const filtered = useMemo(() => allStocks.filter(s =>
    (cat === "全部" || s.cat === cat) &&
    (q === "" || s.id.includes(q) || s.name.includes(q) || s.role.includes(q))
  ), [allStocks, cat, q]);

  function addStock() {
    if (!form.id.trim())   { setFormErr("請輸入代號"); return; }
    if (!form.name.trim()) { setFormErr("請輸入名稱"); return; }
    if (allStocks.find(s => s.id === form.id.trim())) { setFormErr("此代號已存在"); return; }
    const next = [...custom, {
      id: form.id.trim(), name: form.name.trim(),
      cat: form.cat, role: form.role.trim() || "自訂"
    }];
    setCustom(next);
    try { localStorage.setItem("twstock_custom", JSON.stringify(next)); } catch(_) {}
    setForm({id:"", name:"", cat:"核心製造", role:""}); setFormErr(""); setShowAdd(false);
  }

  function removeCustom(id) {
    const next = custom.filter(s => s.id !== id);
    setCustom(next);
    try { localStorage.setItem("twstock_custom", JSON.stringify(next)); } catch(_) {}
  }

  const isCustom = id => custom.some(s => s.id === id);

  return (
    <div style={{minHeight:"100vh", background:"#070b12", color:"#dce8f0", fontFamily:"'IBM Plex Mono','Courier New',monospace"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600&family=Noto+Sans+TC:wght@300;400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px;}
        .btn{background:none;border:none;cursor:pointer;font-family:inherit;transition:all .18s;}
        .btn:hover{opacity:.75;}
        .row{transition:background .12s;}
        .row:hover{background:rgba(0,245,160,.04)!important;}
        .inp{background:#0c1620;border:1px solid #1e3a5f;color:#dce8f0;padding:6px 10px;border-radius:5px;font-family:inherit;font-size:13px;outline:none;width:100%;}
        .inp:focus{border-color:#00f5a0;}
        .chip{padding:4px 10px;border-radius:20px;font-size:11px;cursor:pointer;border:1px solid transparent;font-family:inherit;background:none;transition:all .15s;}
        .card{background:#0c1620;border:1px solid #192d44;border-radius:8px;}
        @keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu .28s ease forwards;}
        .tag{display:inline-block;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:700;}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;}
        select.inp{cursor:pointer;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{display:inline-block;animation:spin 1s linear infinite;}
        thead th{position:sticky;top:0;z-index:2;}
      `}</style>

      {/* Header */}
      <div style={{background:"#060a10",borderBottom:"1px solid #192d44",padding:"13px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:17,fontWeight:700,color:"#00f5a0",fontFamily:"'Noto Sans TC'",letterSpacing:1}}>📋 台股追蹤清單</div>
          <div style={{fontSize:10,color:"#3a6a8a",marginTop:2}}>
            共 <span style={{color:"#00f5a0",fontWeight:700}}>{allStocks.length}</span> 支 · 19大產業
            {custom.length > 0 && <span style={{color:"#ffd54f"}}> · 自訂 {custom.length} 支</span>}
            {lastFetch && <span> · 資料更新 {lastFetch}</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn" onClick={fetchPrices} disabled={loading || !isConfigured}
            title={!isConfigured ? "請先設定 SHEET_CSV_URL" : ""}
            style={{padding:"7px 14px",borderRadius:6,border:"1px solid #1e3a5f",color: isConfigured?"#4a8aaa":"#2a4a5a",fontSize:13,fontFamily:"'Noto Sans TC'"}}>
            {loading ? <span className="spin">⟳</span> : "⟳"} 更新
          </button>
          <button className="btn" onClick={() => setShowAdd(true)} style={{background:"#00f5a0",color:"#070b12",padding:"7px 16px",borderRadius:6,fontWeight:700,fontSize:13,fontFamily:"'Noto Sans TC'"}}>
            ＋ 新增股票
          </button>
        </div>
      </div>

      {/* 提示橫幅 */}
      {!isConfigured && (
        <div style={{background:"#1a1400",borderBottom:"1px solid #3a2a00",padding:"9px 18px",fontSize:12,color:"#ffd54f",fontFamily:"'Noto Sans TC'"}}>
          ⚠️ 尚未連接 Google Sheet，目前只顯示股票清單（無股價）。完成 GAS 設定後，將程式碼第 6 行的 <b>SHEET_CSV_URL</b> 換成你的網址即可。
        </div>
      )}
      {error && (
        <div style={{background:"#1a0000",borderBottom:"1px solid #3a0000",padding:"9px 18px",fontSize:12,color:"#ff8a65",fontFamily:"'Noto Sans TC'"}}>
          ❌ {error}
        </div>
      )}

      {/* 篩選列 */}
      <div style={{padding:"12px 16px",background:"#060a10",borderBottom:"1px solid #192d44"}}>
        <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
          <input className="inp" placeholder="搜尋代號 / 名稱 / 角色..." value={q}
            onChange={e => setQ(e.target.value)} style={{maxWidth:240,fontSize:12}}/>
          <span style={{fontSize:11,color:"#3a6a8a",whiteSpace:"nowrap"}}>
            顯示 <span style={{color:"#00f5a0",fontWeight:700}}>{filtered.length}</span> 支
          </span>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {allCats.map(c => (
            <button key={c} className="chip" onClick={() => setCat(c)} style={{
              color: cat===c ? "#070b12" : "#4a8aaa",
              background: cat===c ? "#00f5a0" : "transparent",
              borderColor: cat===c ? "#00f5a0" : "#1e3a5f",
              fontFamily:"'Noto Sans TC'",
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* 股票表格 */}
      <div style={{padding:"14px 16px",maxWidth:1200,margin:"0 auto"}}>
        <div className="card fu" style={{overflow:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#060a10",borderBottom:"1px solid #192d44"}}>
                {["代號","名稱","產業","角色",
                  ...(isConfigured ? ["股價","漲跌","漲跌%","最高","最低","量(張)"] : []),
                  ""].map(h => (
                  <th key={h} style={{
                    padding:"8px 11px", background:"#060a10",
                    textAlign:["代號","名稱","產業","角色"].includes(h)?"left":"right",
                    color:"#3a6a8a", fontWeight:500, fontFamily:"'Noto Sans TC'",
                    fontSize:11, whiteSpace:"nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const p   = prices[s.id];
                const hp  = p && p.price > 0;
                return (
                  <tr key={s.id + i} className="row" style={{borderBottom:"1px solid #0c1620"}}>
                    <td style={{padding:"8px 11px"}}>
                      <span style={{color:"#00c876",fontWeight:700}}>{s.id}</span>
                      {isCustom(s.id) && (
                        <span className="tag" style={{background:"#ffd54f18",color:"#ffd54f",border:"1px solid #ffd54f30",marginLeft:5}}>自訂</span>
                      )}
                    </td>
                    <td style={{padding:"8px 11px",color:"#e0e8f0",fontFamily:"'Noto Sans TC'",fontWeight:500,whiteSpace:"nowrap"}}>{s.name}</td>
                    <td style={{padding:"8px 11px"}}>
                      <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:"#1a2d45",color:"#5a8aaa",fontFamily:"'Noto Sans TC'",whiteSpace:"nowrap"}}>{s.cat}</span>
                    </td>
                    <td style={{padding:"8px 11px",color:"#3a6a8a",fontSize:11,fontFamily:"'Noto Sans TC'",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.role}</td>

                    {isConfigured && <>
                      <td style={{padding:"8px 11px",textAlign:"right",color:"#e0e8f0",fontWeight:600}}>
                        {loading ? "…" : hp ? p.price.toFixed(2) : <span style={{color:"#2a4a5a"}}>—</span>}
                      </td>
                      <td style={{padding:"8px 11px",textAlign:"right",color:hp?CC(p.change):"#2a4a5a",fontWeight:600}}>
                        {loading ? "…" : hp ? (p.change > 0 ? "+" : "") + p.change.toFixed(2) : "—"}
                      </td>
                      <td style={{padding:"8px 11px",textAlign:"right",color:hp?CC(p.changePct):"#2a4a5a",fontWeight:700}}>
                        {loading ? "…" : hp ? (p.changePct > 0 ? "▲" : "▼") + Math.abs(p.changePct).toFixed(2) + "%" : "—"}
                      </td>
                      <td style={{padding:"8px 11px",textAlign:"right",color:"#7a9ab8"}}>
                        {loading ? "…" : hp ? p.high.toFixed(2) : "—"}
                      </td>
                      <td style={{padding:"8px 11px",textAlign:"right",color:"#7a9ab8"}}>
                        {loading ? "…" : hp ? p.low.toFixed(2) : "—"}
                      </td>
                      <td style={{padding:"8px 11px",textAlign:"right",color:"#4a7a9a"}}>
                        {loading ? "…" : hp ? p.vol.toLocaleString() : "—"}
                      </td>
                    </>}

                    <td style={{padding:"8px 11px",textAlign:"right"}}>
                      {isCustom(s.id) && (
                        <button className="btn" onClick={() => removeCustom(s.id)}
                          style={{color:"#ff5252",fontSize:17,lineHeight:1}}>×</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={isConfigured?11:5} style={{padding:40,textAlign:"center",color:"#3a6a8a",fontFamily:"'Noto Sans TC'"}}>沒有符合條件的股票</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增 Modal */}
      {showAdd && (
        <div className="modal-bg" onClick={e => { if(e.target===e.currentTarget){setShowAdd(false);setFormErr("");} }}>
          <div className="card fu" style={{width:"100%",maxWidth:420,padding:24,borderColor:"#1e3a5f"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontSize:15,fontWeight:700,color:"#00f5a0",fontFamily:"'Noto Sans TC'"}}>＋ 新增股票</div>
              <button className="btn" onClick={()=>{setShowAdd(false);setFormErr("");}} style={{color:"#3a6a8a",fontSize:22}}>×</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:13}}>
              <div>
                <div style={{fontSize:11,color:"#3a6a8a",marginBottom:5,fontFamily:"'Noto Sans TC'"}}>股票代號 *</div>
                <input className="inp" placeholder="例：0050" value={form.id} onChange={e=>setForm(f=>({...f,id:e.target.value}))}/>
              </div>
              <div>
                <div style={{fontSize:11,color:"#3a6a8a",marginBottom:5,fontFamily:"'Noto Sans TC'"}}>公司名稱 *</div>
                <input className="inp" placeholder="例：元大台灣50" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
              </div>
              <div>
                <div style={{fontSize:11,color:"#3a6a8a",marginBottom:5,fontFamily:"'Noto Sans TC'"}}>產業類別</div>
                <select className="inp" value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>
                  {[...new Set(STOCK_META.map(s=>s.cat))].map(c=><option key={c} value={c}>{c}</option>)}
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:"#3a6a8a",marginBottom:5,fontFamily:"'Noto Sans TC'"}}>角色定位（選填）</div>
                <input className="inp" placeholder="例：ETF 台灣加權指數" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}/>
              </div>
              {formErr && <div style={{fontSize:12,color:"#ff5252",fontFamily:"'Noto Sans TC'"}}>⚠ {formErr}</div>}
              <div style={{display:"flex",gap:10,marginTop:4}}>
                <button className="btn" onClick={()=>{setShowAdd(false);setFormErr("");}}
                  style={{flex:1,padding:"10px",borderRadius:6,border:"1px solid #1e3a5f",color:"#3a6a8a",fontSize:13,fontFamily:"'Noto Sans TC'"}}>取消</button>
                <button className="btn" onClick={addStock}
                  style={{flex:2,padding:"10px",borderRadius:6,background:"#00f5a0",color:"#070b12",fontWeight:700,fontSize:13,fontFamily:"'Noto Sans TC'"}}>確認新增</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
