import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import * as Speech from "expo-speech";
import { getAllCards, getCategories } from "../data/japaneseN1";

export default function JapaneseFlashcardScreen({ onNavigate }) {
  const allCards = useMemo(() => getAllCards(), []);
  const categories = useMemo(() => getCategories(), []);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const cards =
    activeCategory === "全部"
      ? allCards
      : allCards.filter((c) => c.category === activeCategory);

  const card = cards[index] || cards[0];

  function selectCategory(cat) {
    setActiveCategory(cat);
    setIndex(0);
    setRevealed(false);
  }

  function playFront() {
    if (!card) return;
    Speech.stop();
    Speech.speak(card.reading || card.front, { language: "ja-JP" });
  }

  function playExample() {
    if (!card || !card.example_jp) return;
    Speech.stop();
    Speech.speak(card.example_jp, { language: "ja-JP", rate: 0.9 });
  }

  function next() {
    setRevealed(false);
    setIndex((i) => (i + 1) % cards.length);
  }

  function prev() {
    setRevealed(false);
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => onNavigate("home")}>
        <Text style={styles.back}>← 返回</Text>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
      >
        {categories.map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.categoryChip,
              activeCategory === cat && styles.categoryChipActive,
            ]}
            onPress={() => selectCategory(cat)}
          >
            <Text
              style={[
                styles.categoryChipText,
                activeCategory === cat && styles.categoryChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {!card ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>這個分類目前還沒有內容</Text>
        </View>
      ) : (
        <>
          <Text style={styles.progress}>
            {index + 1} / {cards.length}
          </Text>

          <Pressable style={styles.card} onPress={() => setRevealed((r) => !r)}>
            {!revealed ? (
              <>
                <Text style={styles.categoryLabel}>{card.category}</Text>
                <Text style={styles.word}>{card.front}</Text>
                {card.reading && (
                  <Text style={styles.reading}>{card.reading}</Text>
                )}
                <Text style={styles.hint}>(點卡片查看意思)</Text>
              </>
            ) : (
              <>
                <Text style={styles.meaning}>{card.meaning}</Text>
                {card.example_jp && (
                  <>
                    <Text style={styles.example}>{card.example_jp}</Text>
                    {card.example_zh && (
                      <Text style={styles.exampleZh}>{card.example_zh}</Text>
                    )}
                  </>
                )}
                {card.note && <Text style={styles.note}>⚠️ {card.note}</Text>}
              </>
            )}
          </Pressable>

          <View style={styles.speakRow}>
            <Pressable style={styles.speakBtn} onPress={playFront}>
              <Text style={styles.speakBtnText}>🔊 播放發音</Text>
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
  categoryRow: {
    flexGrow: 0,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#eaf2ff",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#1e3a5f",
  },
  categoryChipText: {
    fontSize: 13,
    color: "#3a5a8c",
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: "#ffffff",
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
  },
  categoryLabel: {
    fontSize: 13,
    color: "#8a97a8",
    marginBottom: 10,
  },
  word: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1e3a5f",
    textAlign: "center",
  },
  reading: {
    fontSize: 16,
    color: "#5a6b7d",
    marginTop: 6,
  },
  hint: {
    fontSize: 13,
    color: "#b0bac6",
    marginTop: 20,
  },
  meaning: {
    fontSize: 19,
    color: "#2c5282",
    fontWeight: "600",
    textAlign: "center",
  },
  example: {
    fontSize: 14,
    color: "#4a5568",
    marginTop: 16,
    textAlign: "center",
  },
  exampleZh: {
    fontSize: 13,
    color: "#8a97a8",
    marginTop: 6,
    textAlign: "center",
  },
  note: {
    fontSize: 13,
    color: "#b5651d",
    marginTop: 16,
    textAlign: "center",
    lineHeight: 19,
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
