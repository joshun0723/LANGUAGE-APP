/**
 * businessJapanese.js
 *
 * 讀 assets/data/business-japanese.json，提供「會議/簡報用語」和
 * 「日常職場對話」兩個情境句庫給 BusinessJapaneseScreen 使用。
 */

import bizData from "../../assets/data/business-japanese.json";

export function getMeetingPhrases() {
  return bizData.meeting_presentation || [];
}

export function getDailyWorkplacePhrases() {
  return bizData.daily_workplace || [];
}
