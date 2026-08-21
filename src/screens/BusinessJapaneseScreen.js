import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import * as Speech from "expo-speech";
import {
  getMeetingPhrases,
  getDailyWorkplacePhrases,
} from "../data/businessJapanese";

const TABS = [
  { key: "meeting", label: "會議/簡報用語" },
  { key: "daily", label: "日常職場對話" },
];

export default function BusinessJapaneseScreen({ onNavigate }) {
  const meetingPhrases = useMemo(() => getMeetingPhrases(), []);
  const dailyPhrases = useMemo(() => getDailyWorkplacePhrases(), []);
  const [activeTab, setActiveTab] = useState("meeting");
  const [expandedId, setExpandedId] = useState(null);

  const list = activeTab === "meeting" ? meetingPhrases : dailyPhrases;

  function speak(text) {
    Speech.stop();
    Speech.speak(text, { language: "ja-JP" });
  }

  function selectTab(key) {
    setActiveTab(key);
    setExpandedId(null);
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => onNavigate("home")}>
        <Text style={styles.back}>← 返回</Text>
      </Pressable>

      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => selectTab(tab.key)}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === tab.key && styles.tabBtnTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {list.map((item) => {
          const expanded = expandedId === item.id;
          return (
            <Pressable
              key={item.id}
              style={styles.phraseCard}
              onPress={() => setExpandedId(expanded ? null : item.id)}
            >
              <Text style={styles.scene}>{item.scene}</Text>
              <View style={styles.jpRow}>
                <Text style={styles.jpText}>{item.jp}</Text>
                <Pressable
                  hitSlop={10}
                  onPress={() => speak(item.jp)}
                  style={styles.speakIcon}
                >
                  <Text style={styles.speakIconText}>🔊</Text>
                </Pressable>
              </View>

              {expanded ? (
                <View style={styles.expandedBox}>
                  <Text style={styles.zhText}>{item.zh}</Text>
                  {item.note && (
                    <Text style={styles.noteText}>💡 {item.note}</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.tapHint}>點開看翻譯／說明</Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
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
  tabRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#eaf2ff",
  },
  tabBtnActive: {
    backgroundColor: "#1e3a5f",
  },
  tabBtnText: {
    fontSize: 13,
    color: "#3a5a8c",
    fontWeight: "600",
  },
  tabBtnTextActive: {
    color: "#ffffff",
  },
  list: {
    paddingBottom: 24,
  },
  phraseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  scene: {
    fontSize: 12,
    color: "#8a97a8",
    marginBottom: 6,
  },
  jpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  jpText: {
    fontSize: 16,
    color: "#1e3a5f",
    flex: 1,
    lineHeight: 22,
  },
  speakIcon: {
    paddingLeft: 10,
  },
  speakIconText: {
    fontSize: 18,
  },
  expandedBox: {
    marginTop: 10,
  },
  zhText: {
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 6,
  },
  noteText: {
    fontSize: 13,
    color: "#b5651d",
    lineHeight: 19,
  },
  tapHint: {
    fontSize: 11,
    color: "#b0bac6",
    marginTop: 8,
  },
});
