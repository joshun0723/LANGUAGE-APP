import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";

export default function HomeScreen({ onNavigate }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>TOEIC Full Score</Text>
      <Text style={styles.subtitle}>目標：845 → 990 滿分</Text>

      <Pressable style={styles.card} onPress={() => onNavigate("flashcards")}>
        <Text style={styles.cardTitle}>📚 今日單字卡</Text>
        <Text style={styles.cardDesc}>
          跟你 LINE 每天收到的單字同步，點卡片看中文意思和例句
        </Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => onNavigate("quiz")}>
        <Text style={styles.cardTitle}>⏱ 全大題限時模擬測驗</Text>
        <Text style={styles.cardDesc}>
          單字、文法、閱讀、聽力都會出現（題數縮短版），每題限時作答，
          針對你「最後15題來不及寫」的弱點練習考試節奏感
        </Text>
      </Pressable>

      <View style={styles.tipBox}>
        <Text style={styles.tipText}>
          💡 小提醒：多益 Part 7 建議每題花費不超過 55-60 秒，這個測驗模式會幫你練習抓時間。
        </Text>
      </View>

      <Text style={styles.sectionTitle}>🇯🇵 日文｜N1滿分＋商用日文</Text>

      <Pressable
        style={styles.card}
        onPress={() => onNavigate("japanese-flashcards")}
      >
        <Text style={styles.cardTitle}>📘 N1滿分單字卡</Text>
        <Text style={styles.cardDesc}>
          語彙／漢字読み／文法／四字熟語／敬語／オノマトペ，跟你 LINE
          每天收到的日文內容同步，每則都附「滿分陷阱」提醒
        </Text>
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => onNavigate("japanese-business")}
      >
        <Text style={styles.cardTitle}>💼 商用日文</Text>
        <Text style={styles.cardDesc}>
          會議/簡報用語、日常職場對話（跟同事/主管），點開看中文翻譯和使用場合小提醒
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 64,
    backgroundColor: "#f5f7fa",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e3a5f",
  },
  subtitle: {
    fontSize: 15,
    color: "#5a6b7d",
    marginTop: 4,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e3a5f",
    marginTop: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e3a5f",
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    color: "#6b7a8d",
    lineHeight: 20,
  },
  tipBox: {
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    backgroundColor: "#eaf2ff",
    borderRadius: 12,
  },
  tipText: {
    fontSize: 13,
    color: "#3a5a8c",
    lineHeight: 19,
  },
});
