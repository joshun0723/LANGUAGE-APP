import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import * as Speech from "expo-speech";
import { getAllWords } from "../data/vocab";
import { getBookmarkedIds, toggleBookmark } from "../utils/bookmarks";

export default function FlashcardScreen({ onNavigate }) {
  const allWords = useMemo(() => getAllWords(), []);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [filterMode, setFilterMode] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // App 一打開就從手機本機讀出之前標記過的單字
    getBookmarkedIds().then(setBookmarkedIds);
  }, []);

  const words = filterMode
    ? allWords.filter((w) => bookmarkedIds.includes(w.id))
    : allWords;

  useEffect(() => {
    // 切換「只看標記」或標記被取消時，避免游標超出範圍
    if (index >= words.length) setIndex(0);
  }, [words.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const word = words[index];
  const isBookmarked = word ? bookmarkedIds.includes(word.id) : false;

  function playPronunciation() {
    // 用手機內建的語音合成朗讀單字，不需要下載音檔、不需要網路
    Speech.stop();
    Speech.speak(word.word, { language: "en-US", rate: 0.9 });
  }

  function playExample() {
    // 朗讀整句例句，練習聽自然語速的句子而不只是單字發音
    Speech.stop();
    Speech.speak(word.example_en, { language: "en-US", rate: 0.85 });
  }

  async function handleToggleBookmark() {
    const next = await toggleBookmark(word.id);
    setBookmarkedIds(next);
  }

  function next() {
    setRevealed(false);
    setIndex((i) => (i + 1) % words.length);
  }

  function prev() {
    setRevealed(false);
    setIndex((i) => (i - 1 + words.length) % words.length);
  }

  function toggleFilter() {
    setIndex(0);
    setRevealed(false);
    setFilterMode((f) => !f);
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => onNavigate("home")}>
        <Text style={styles.back}>← 返回</Text>
      </Pressable>

      <Pressable style={styles.filterToggle} onPress={toggleFilter}>
        <Text style={styles.filterToggleText}>
          {filterMode
            ? `⭐ 只看標記中（${bookmarkedIds.length}）　點一下顯示全部單字`
            : `顯示全部單字　點一下只看 ⭐ 標記（${bookmarkedIds.length}）`}
        </Text>
      </Pressable>

      {!word ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            還沒有標記任何單字{"\n"}在單字卡右上角點 ☆ 就可以標記喔
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.progress}>
            {index + 1} / {words.length}
          </Text>

          <Pressable style={styles.card} onPress={() => setRevealed((r) => !r)}>
            <Pressable
              style={styles.bookmarkBtn}
              onPress={handleToggleBookmark}
              hitSlop={12}
            >
              <Text style={styles.bookmarkIcon}>{isBookmarked ? "⭐" : "☆"}</Text>
            </Pressable>

            {!revealed ? (
              <>
                <Text style={styles.word}>{word.word}</Text>
                <Text style={styles.pos}>{word.pos}</Text>
                <Text style={styles.hint}>(點卡片查看意思)</Text>
              </>
            ) : (
              <>
                <Text style={styles.word}>{word.word}</Text>
                <Text style={styles.meaning}>{word.meaning_zh}</Text>
                <Text style={styles.example}>{word.example_en}</Text>
                <Text style={styles.exampleZh}>{word.example_zh}</Text>
              </>
            )}
          </Pressable>

          <View style={styles.speakRow}>
            <Pressable style={styles.speakBtn} onPress={playPronunciation}>
              <Text style={styles.speakBtnText}>🔊 播放單字</Text>
            </Pressable>
            <Pressable style={styles.speakBtn} onPress={playExample}>
              <Text style={styles.speakBtnText}>🔊 播放例句</Text>
            </Pressable>
          </View>

          <View style={styles.navRow}>
            <Pressable style={styles.navBtn} onPress={prev}>
              <Text style={styles.navBtnText}>上一個</Text>
            </Pressable>
            <Pressable
              style={[styles.navBtn, styles.navBtnPrimary]}
              onPress={next}
            >
              <Text style={[styles.navBtnText, styles.navBtnTextPrimary]}>
                下一個
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 64,
    backgroundColor: "#f5f7fa",
  },
  back: {
    fontSize: 16,
    color: "#3a5a8c",
    marginBottom: 12,
  },
  filterToggle: {
    alignSelf: "center",
    backgroundColor: "#eaf2ff",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterToggleText: {
    fontSize: 13,
    color: "#3a5a8c",
    fontWeight: "600",
  },
  emptyBox: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 32,
    minHeight: 260,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#8a97a8",
    textAlign: "center",
    lineHeight: 22,
  },
  progress: {
    textAlign: "center",
    color: "#8a97a8",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 32,
    minHeight: 260,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    position: "relative",
  },
  bookmarkBtn: {
    position: "absolute",
    top: 14,
    right: 16,
  },
  bookmarkIcon: {
    fontSize: 26,
  },
  word: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1e3a5f",
    textAlign: "center",
  },
  pos: {
    fontSize: 14,
    color: "#8a97a8",
    marginTop: 8,
  },
  hint: {
    fontSize: 13,
    color: "#b0bac6",
    marginTop: 20,
  },
  meaning: {
    fontSize: 20,
    color: "#2c5282",
    marginTop: 12,
    fontWeight: "600",
  },
  example: {
    fontSize: 14,
    color: "#4a5568",
    marginTop: 20,
    textAlign: "center",
  },
  exampleZh: {
    fontSize: 13,
    color: "#8a97a8",
    marginTop: 6,
    textAlign: "center",
  },
  speakRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 10,
  },
  speakBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#eaf2ff",
  },
  speakBtnText: {
    fontSize: 14,
    color: "#3a5a8c",
    fontWeight: "600",
  },
  navRow: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
  },
  navBtnPrimary: {
    backgroundColor: "#1e3a5f",
  },
  navBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a5568",
  },
  navBtnTextPrimary: {
    color: "#ffffff",
  },
});
