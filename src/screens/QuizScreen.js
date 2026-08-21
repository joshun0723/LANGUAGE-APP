import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import * as Speech from "expo-speech";
import { getRandomWords, getAllWords } from "../data/vocab";
import {
  getGrammarPoints,
  getReadingPassages,
  getListeningScripts,
} from "../data/dailyContent";

// 全大題模擬測驗：單字/文法/閱讀/聽力都會出現，只是每大題題數比正式考試少很多，
// 目的是練習「整體作答節奏」，不是只練單字。
const VOCAB_COUNT = 4;
const GRAMMAR_COUNT = 3;
const READING_COUNT = 3;
const LISTENING_COUNT = 2;

const TIME_BY_TYPE = {
  vocab: 15,
  grammar: 20,
  reading: 30,
  listening: 30,
};

const SECTION_ORDER = ["單字", "文法", "閱讀", "聽力"];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildVocabQuestions() {
  const allWords = getAllWords();
  const chosen = getRandomWords(VOCAB_COUNT);
  return chosen.map((word) => {
    const distractorPool = allWords.filter((w) => w.id !== word.id);
    const distractors = [];
    const usedIdx = new Set();
    while (distractors.length < 3 && distractors.length < distractorPool.length) {
      const idx = Math.floor(Math.random() * distractorPool.length);
      if (!usedIdx.has(idx)) {
        usedIdx.add(idx);
        distractors.push(distractorPool[idx].meaning_zh);
      }
    }
    return {
      type: "vocab",
      sectionLabel: "單字",
      prompt: "這個字的中文意思是？",
      stem: word.word,
      subStem: word.pos,
      options: shuffle([word.meaning_zh, ...distractors]),
      correctAnswer: word.meaning_zh,
    };
  });
}

function buildGrammarQuestions() {
  const points = shuffle(getGrammarPoints()).slice(0, GRAMMAR_COUNT);
  return points.map((g) => ({
    type: "grammar",
    sectionLabel: "文法",
    prompt: `文法重點：${g.topic}`,
    stem: g.question_stem,
    subStem: null,
    options: g.options,
    correctAnswer: g.options[g.correct_index],
    explanation: g.answer_explanation_zh,
  }));
}

function buildReadingQuestions() {
  const pool = [];
  getReadingPassages().forEach((passage) => {
    passage.questions.forEach((q) => {
      pool.push({
        type: "reading",
        sectionLabel: "閱讀",
        passageTitle: passage.title_zh,
        passageText: passage.passage_en,
        prompt: q.q,
        stem: null,
        options: q.options,
        correctAnswer: q.options[q.correct_index],
      });
    });
  });
  return shuffle(pool).slice(0, READING_COUNT);
}

function buildListeningQuestions() {
  const pool = [];
  getListeningScripts().forEach((script) => {
    script.questions.forEach((q) => {
      pool.push({
        type: "listening",
        sectionLabel: "聽力",
        scriptText: script.script_en,
        topicZh: script.topic_zh,
        prompt: q.q,
        stem: null,
        options: q.options,
        correctAnswer: q.options[q.correct_index],
      });
    });
  });
  return shuffle(pool).slice(0, LISTENING_COUNT);
}

function buildQuestions() {
  return [
    ...buildVocabQuestions(),
    ...buildGrammarQuestions(),
    ...buildReadingQuestions(),
    ...buildListeningQuestions(),
  ];
}

export default function QuizScreen({ onNavigate }) {
  const questions = useMemo(() => buildQuestions(), []);
  const [qIndex, setQIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(TIME_BY_TYPE[questions[0]?.type] || 20);
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState([]); // { correct, timedOut, timeUsed }
  const [finished, setFinished] = useState(false);

  const current = questions[qIndex];

  useEffect(() => {
    // 每題換題目時重設倒數秒數（依題型給不同秒數），聽力題自動播放一次
    if (!current) return;
    setSecondsLeft(TIME_BY_TYPE[current.type] || 20);
    setSelected(null);
    if (current.type === "listening") {
      Speech.stop();
      Speech.speak(current.scriptText, { language: "en-US", rate: 0.9 });
    }
    return () => Speech.stop();
  }, [qIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = useCallback(
    (record) => {
      setResults((prev) => [...prev, record]);
      if (qIndex + 1 >= questions.length) {
        setFinished(true);
      } else {
        setQIndex((i) => i + 1);
      }
    },
    [qIndex, questions.length]
  );

  useEffect(() => {
    if (finished || selected || !current) return;
    const total = TIME_BY_TYPE[current.type] || 20;
    if (secondsLeft <= 0) {
      goNext({ correct: false, timedOut: true, timeUsed: total });
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, finished, selected, current, goNext]);

  function handleSelect(option) {
    if (selected || !current) return;
    setSelected(option);
    const total = TIME_BY_TYPE[current.type] || 20;
    const timeUsed = total - secondsLeft;
    const correct = option === current.correctAnswer;
    setTimeout(() => goNext({ correct, timedOut: false, timeUsed }), 600);
  }

  function replayAudio() {
    if (!current || current.type !== "listening") return;
    Speech.stop();
    Speech.speak(current.scriptText, { language: "en-US", rate: 0.9 });
  }

  if (finished) {
    const correctCount = results.filter((r) => r.correct).length;
    const timedOutCount = results.filter((r) => r.timedOut).length;
    const avgTime = results.reduce((sum, r) => sum + r.timeUsed, 0) / results.length;

    const bySection = {};
    questions.forEach((q, i) => {
      const r = results[i];
      if (!bySection[q.sectionLabel]) bySection[q.sectionLabel] = { correct: 0, total: 0 };
      bySection[q.sectionLabel].total += 1;
      if (r?.correct) bySection[q.sectionLabel].correct += 1;
    });

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.resultTitle}>模擬測驗結果</Text>
        <Text style={styles.resultScore}>
          {correctCount} / {questions.length} 答對
        </Text>

        <View style={styles.statBox}>
          <Text style={styles.breakdownTitle}>各大題表現</Text>
          {SECTION_ORDER.filter((s) => bySection[s]).map((s) => (
            <View key={s} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{s}</Text>
              <Text style={styles.breakdownScore}>
                {bySection[s].correct} / {bySection[s].total}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLine}>⏱ 平均作答時間：{avgTime.toFixed(1)} 秒</Text>
          <Text style={styles.statLine}>⌛ 因超時未答：{timedOutCount} 題</Text>
        </View>

        {timedOutCount > 0 && (
          <View style={styles.tipBox}>
            <Text style={styles.tipText}>
              有 {timedOutCount} 題超時 — 這正是模擬你在正式考試最後段來不及作答的狀況。
              建議：先讀題目關鍵字（誰/做什麼/何時），不要每個字都讀完再選答案。
            </Text>
          </View>
        )}

        <Pressable style={styles.primaryBtn} onPress={() => onNavigate("home")}>
          <Text style={styles.primaryBtnText}>返回首頁</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (!current) return null;

  const showFeedback = selected !== null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => onNavigate("home")}>
          <Text style={styles.back}>← 離開測驗</Text>
        </Pressable>
        <Text style={styles.progress}>
          {qIndex + 1} / {questions.length}
        </Text>
      </View>

      <View style={styles.sectionBadge}>
        <Text style={styles.sectionBadgeText}>{current.sectionLabel}</Text>
      </View>

      <View style={[styles.timerBox, secondsLeft <= 5 && styles.timerBoxUrgent]}>
        <Text style={[styles.timerText, secondsLeft <= 5 && styles.timerTextUrgent]}>
          {secondsLeft}s
        </Text>
      </View>

      {current.type === "reading" && (
        <View style={styles.passageBox}>
          <Text style={styles.passageTitle}>{current.passageTitle}</Text>
          <Text style={styles.passageText}>{current.passageText}</Text>
        </View>
      )}

      {current.type === "listening" && (
        <View style={styles.passageBox}>
          <Text style={styles.passageTitle}>🎧 {current.topicZh}</Text>
          <Text style={styles.listeningHint}>
            音檔已自動播放一次，沒聽清楚可以按下面重播
          </Text>
          <Pressable style={styles.replayBtn} onPress={replayAudio}>
            <Text style={styles.replayBtnText}>🔊 再聽一次</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.questionCard}>
        <Text style={styles.questionLabel}>{current.prompt}</Text>
        {current.stem ? (
          <>
            <Text style={styles.questionWord}>{current.stem}</Text>
            {current.subStem ? (
              <Text style={styles.questionPos}>{current.subStem}</Text>
            ) : null}
          </>
        ) : null}
      </View>

      {current.options.map((option) => {
        const isSelected = selected === option;
        const isCorrect = option === current.correctAnswer;
        return (
          <Pressable
            key={option}
            style={[
              styles.optionBtn,
              showFeedback && isCorrect && styles.optionCorrect,
              showFeedback && isSelected && !isCorrect && styles.optionWrong,
            ]}
            onPress={() => handleSelect(option)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </Pressable>
        );
      })}

      {showFeedback && current.explanation && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>{current.explanation}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 64,
    paddingBottom: 48,
    backgroundColor: "#f5f7fa",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  back: {
    fontSize: 15,
    color: "#3a5a8c",
  },
  progress: {
    color: "#8a97a8",
  },
  sectionBadge: {
    alignSelf: "center",
    backgroundColor: "#1e3a5f",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionBadgeText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  timerBox: {
    alignSelf: "center",
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  timerBoxUrgent: {
    backgroundColor: "#fed7d7",
  },
  timerText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4a5568",
  },
  timerTextUrgent: {
    color: "#c53030",
  },
  passageBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  passageTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e3a5f",
    marginBottom: 8,
  },
  passageText: {
    fontSize: 14,
    color: "#4a5568",
    lineHeight: 21,
  },
  listeningHint: {
    fontSize: 13,
    color: "#8a97a8",
    marginBottom: 12,
  },
  replayBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#eaf2ff",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  replayBtnText: {
    fontSize: 14,
    color: "#3a5a8c",
    fontWeight: "600",
  },
  questionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 13,
    color: "#8a97a8",
    marginBottom: 8,
    textAlign: "center",
  },
  questionWord: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e3a5f",
    textAlign: "center",
  },
  questionPos: {
    fontSize: 13,
    color: "#8a97a8",
    marginTop: 4,
  },
  optionBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  optionCorrect: {
    backgroundColor: "#c6f6d5",
    borderColor: "#38a169",
  },
  optionWrong: {
    backgroundColor: "#fed7d7",
    borderColor: "#c53030",
  },
  optionText: {
    fontSize: 15,
    color: "#2d3748",
  },
  explanationBox: {
    backgroundColor: "#eaf2ff",
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  explanationText: {
    fontSize: 13,
    color: "#3a5a8c",
    lineHeight: 19,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e3a5f",
    textAlign: "center",
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 20,
    textAlign: "center",
    color: "#2c5282",
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e3a5f",
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 14,
    color: "#4a5568",
  },
  breakdownScore: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c5282",
  },
  statLine: {
    fontSize: 15,
    color: "#4a5568",
    marginBottom: 6,
  },
  tipBox: {
    backgroundColor: "#eaf2ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipText: {
    fontSize: 13,
    color: "#3a5a8c",
    lineHeight: 19,
  },
  primaryBtn: {
    backgroundColor: "#1e3a5f",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
  },
});
