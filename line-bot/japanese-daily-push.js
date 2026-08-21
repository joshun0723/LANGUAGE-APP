/**
 * japanese-daily-push.js
 *
 * 每天推播一則日文學習內容到 LINE（沿用跟英文單字推播「同一個」LINE Official Account）。
 * 內容在「N1滿分內容」(語彙/漢字読み/文法/四字熟語/敬語/オノマトペ) 跟
 * 「商用日文」(會議簡報用語 / 日常職場對話) 之間輪替，比例約 2:1
 * （N1本身考試範圍大，需要的曝光量比較高；商用日文用短句記憶，密度可以低一點）。
 *
 * 設計成「跟英文推播共用同一組 GitHub Actions Secrets」：
 *   LINE_CHANNEL_ACCESS_TOKEN
 *   LINE_USER_ID
 * 不需要另外申請新帳號、新 Token。
 *
 * 用法：
 *   node line-bot/japanese-daily-push.js
 *
 * 需要 Node.js 18+（使用內建的全域 fetch）。
 */

const fs = require("fs");
const path = require("path");

// .trim() 避免複製貼上 Secrets 時夾帶看不見的空白或換行字元，
// 不然 LINE API 會回報 'to' 欄位格式不對 (400)。
const CHANNEL_ACCESS_TOKEN = (process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();
const USER_ID = (process.env.LINE_USER_ID || "").trim();

if (!CHANNEL_ACCESS_TOKEN || !USER_ID) {
  console.error(
    "缺少環境變數：請確認 LINE_CHANNEL_ACCESS_TOKEN 和 LINE_USER_ID 都已設定（跟英文推播共用同一組）。"
  );
  process.exit(1);
}

const DATA_DIR = path.join(__dirname, "..", "data");

function loadJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * 把 N1 資料庫的各個分類攤平成同一個陣列，每筆加上 sourceCategory 方便組訊息。
 */
function buildN1Pool(n1Data) {
  const pool = [];

  (n1Data.vocab || []).forEach((item) => {
    if (item.category === "文法") {
      pool.push({ type: "n1-grammar", ...item });
    } else {
      pool.push({ type: "n1-word", ...item });
    }
  });

  (n1Data.yoji_jukugo || []).forEach((item) => {
    pool.push({ type: "n1-yoji", category: "四字熟語", ...item });
  });

  (n1Data.keigo || []).forEach((item) => {
    pool.push({ type: "n1-keigo", category: "敬語", ...item });
  });

  (n1Data.onomatopoeia || []).forEach((item) => {
    pool.push({ type: "n1-onomatopoeia", category: "オノマトペ", ...item });
  });

  return pool;
}

function buildBusinessPool(bizData) {
  const pool = [];

  (bizData.meeting_presentation || []).forEach((item) => {
    pool.push({ type: "biz-meeting", category: "會議/簡報用語", ...item });
  });

  (bizData.daily_workplace || []).forEach((item) => {
    pool.push({ type: "biz-daily", category: "日常職場對話", ...item });
  });

  return pool;
}

/**
 * 用「距離某個固定起始日的天數」當作 index 來源，確保：
 * 1. 同一天不管腳本跑幾次，內容都一樣（不會因為重跑而跳題）
 * 2. 每天固定往前推進一筆，直到整個池子跑完一輪後才重複
 */
function daysSinceEpochStart() {
  const START_DATE = new Date("2026-08-24T00:00:00+09:00"); // 東京時間週一，跟課程清單的 Week 1 對齊
  const now = new Date();
  const diffMs = now.getTime() - START_DATE.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * 決定今天要從 N1 池還是商用日文池抽題，並算出「這是該池子第幾次被抽到」。
 * 週期為3天一輪：N1、N1、商用日文 → 大約 2:1 的曝光比例。
 *
 * 注意：這裡刻意不是直接用 dayIndex % pool.length 當索引——
 * 如果兩個池子共用同一把全域天數當索引，只要池子長度剛好是 3 的倍數
 * （目前 N1 池是 48 筆），就會有 1/3 的內容永遠排不到（因為那些索引
 * 剛好都落在「今天輪到商用日文」的日子上，N1 池永遠不會被查詢到那個索引）。
 * 改成「各自獨立計數第幾次被抽到」就能保證兩個池子都會完整跑過一輪。
 */
function pickPoolForToday(dayIndex, n1Pool, bizPool) {
  const fullCycles = Math.floor(dayIndex / 3);
  const remainder = dayIndex % 3;

  if (remainder === 0 || remainder === 1) {
    const occurrenceIndex = fullCycles * 2 + remainder;
    return {
      pool: n1Pool,
      poolName: "N1",
      itemIndex: occurrenceIndex % n1Pool.length,
    };
  }

  const occurrenceIndex = fullCycles;
  return {
    pool: bizPool,
    poolName: "商用日文",
    itemIndex: occurrenceIndex % bizPool.length,
  };
}

function formatN1Message(item, dayIndex) {
  const lines = [];
  lines.push(`📘 今日日文｜N1滿分特訓 (Day ${dayIndex + 1})`);
  lines.push("");

  if (item.type === "n1-grammar") {
    lines.push(`【文法】${item.pattern}`);
    lines.push(`意思：${item.meaning_zh}`);
  } else if (item.type === "n1-keigo") {
    lines.push(`【敬語】原型：${item.plain}`);
    lines.push(`尊敬語：${item.sonkeigo}`);
    lines.push(`謙讓語：${item.kenjougo}`);
  } else {
    const reading = item.reading ? `（${item.reading}）` : "";
    lines.push(`【${item.category}】${item.word}${reading}`);
    lines.push(`意思：${item.meaning_zh}`);
  }

  if (item.example_jp) {
    lines.push("");
    lines.push(`例句：${item.example_jp}`);
    if (item.example_zh) lines.push(`　　　${item.example_zh}`);
  }

  if (item.note) {
    lines.push("");
    lines.push(`⚠️ ${item.note}`);
  }

  return lines.join("\n");
}

function formatBusinessMessage(item, dayIndex) {
  const lines = [];
  lines.push(`💼 今日日文｜商用情境 (Day ${dayIndex + 1})`);
  lines.push("");
  lines.push(`情境：${item.scene}`);
  lines.push(`${item.jp}`);
  lines.push(`（${item.zh}）`);

  if (item.note) {
    lines.push("");
    lines.push(`💡 小提醒：${item.note}`);
  }

  return lines.join("\n");
}

async function pushToLine(messageText) {
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: USER_ID,
      messages: [
        {
          type: "text",
          text: messageText,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE API 回傳錯誤 (${res.status}): ${body}`);
  }

  console.log("✅ 日文每日推播已送出。");
}

async function main() {
  const n1Data = loadJson("japanese-n1-vocab.json");
  const bizData = loadJson("business-japanese.json");

  const n1Pool = buildN1Pool(n1Data);
  const bizPool = buildBusinessPool(bizData);

  const dayIndex = daysSinceEpochStart();
  const { pool, poolName, itemIndex } = pickPoolForToday(dayIndex, n1Pool, bizPool);

  if (!pool.length) {
    throw new Error(`資料池 ${poolName} 是空的，請確認 JSON 檔案內容。`);
  }

  const item = pool[itemIndex];

  const messageText =
    poolName === "N1"
      ? formatN1Message(item, dayIndex)
      : formatBusinessMessage(item, dayIndex);

  console.log("--- 今日內容預覽 ---");
  console.log(messageText);
  console.log("--------------------");

  await pushToLine(messageText);
}

main().catch((err) => {
  console.error("❌ 推播失敗：", err.message);
  process.exit(1);
});
