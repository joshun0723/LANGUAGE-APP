/**
 * bookmarks.js
 *
 * 單字「標記」功能的儲存邏輯。用 AsyncStorage 存在手機本機（不會同步雲端，
 * 換手機或清除 App 資料會重置，但一般使用完全沒問題）。
 * 存的只是被標記單字的 id 陣列，例如 [3, 12, 40]。
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "toeic_bookmarked_word_ids";

export async function getBookmarkedIds() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("讀取標記單字失敗：", e.message);
    return [];
  }
}

export async function setBookmarkedIds(ids) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn("儲存標記單字失敗：", e.message);
  }
}

/**
 * 切換某個單字的標記狀態，回傳更新後的完整標記 id 陣列。
 */
export async function toggleBookmark(id) {
  const ids = await getBookmarkedIds();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  await setBookmarkedIds(next);
  return next;
}
