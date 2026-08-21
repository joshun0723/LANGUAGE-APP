/**
 * japaneseN1.js
 *
 * 讀 assets/data/japanese-n1-vocab.json，把 vocab / yoji_jukugo / keigo /
 * onomatopoeia 幾個分類攤平成同一份陣列，統一成單字卡可以直接用的格式。
 * 攤平邏輯跟 line-bot/japanese-daily-push.js 是同一套，確保 App 上看到的
 * 分類跟 LINE 每天收到的內容口徑一致。
 */

import n1Data from "../../assets/data/japanese-n1-vocab.json";

function flatten() {
  const cards = [];

  (n1Data.vocab || []).forEach((item) => {
    if (item.category === "文法") {
      cards.push({
        id: item.id,
        category: "文法",
        front: item.pattern,
        reading: null,
        meaning: item.meaning_zh,
        example_jp: item.example_jp,
        example_zh: item.example_zh,
        note: item.note,
      });
    } else {
      cards.push({
        id: item.id,
        category: item.category,
        front: item.word,
        reading: item.reading,
        meaning: item.meaning_zh,
        example_jp: item.example_jp,
        example_zh: item.example_zh,
        note: item.note,
      });
    }
  });

  (n1Data.yoji_jukugo || []).forEach((item) => {
    cards.push({
      id: item.id,
      category: "四字熟語",
      front: item.word,
      reading: item.reading,
      meaning: item.meaning_zh,
      example_jp: item.example_jp,
      example_zh: item.example_zh,
      note: null,
    });
  });

  (n1Data.keigo || []).forEach((item) => {
    cards.push({
      id: item.id,
      category: "敬語",
      front: item.plain,
      reading: null,
      meaning: `尊敬語：${item.sonkeigo}　／　謙讓語：${item.kenjougo}`,
      example_jp: item.example_jp,
      example_zh: null,
      note: item.note,
    });
  });

  (n1Data.onomatopoeia || []).forEach((item) => {
    cards.push({
      id: item.id,
      category: "オノマトペ",
      front: item.word,
      reading: null,
      meaning: item.meaning_zh,
      example_jp: item.example_jp,
      example_zh: item.example_zh,
      note: null,
    });
  });

  return cards;
}

export function getAllCards() {
  return flatten();
}

export function getCategories() {
  return ["全部", "語彙", "漢字読み", "文法", "四字熟語", "敬語", "オノマトペ"];
}
