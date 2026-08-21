import content from "../../assets/data/toeic_daily_content.json";

/**
 * 文法練習題庫（Part 5 風格：句子填空＋4選項）
 */
export function getGrammarPoints() {
  return content.grammar_points;
}

/**
 * 閱讀短文題庫（Part 7 風格：短文＋理解題）
 */
export function getReadingPassages() {
  return content.reading_passages;
}

/**
 * 聽力短文題庫（Part 4 風格：短文播放＋理解題），
 * App 內用 expo-speech 現場朗讀 script_en，不需要額外的音檔。
 */
export function getListeningScripts() {
  return content.listening_scripts;
}
