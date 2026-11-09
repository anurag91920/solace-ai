import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getProgress } from "../services/api";

const COLORS = {
  background: "#F8F6FF",
  white: "#FFFFFF",
  purple: "#7554D9",
  darkPurple: "#5636B5",
  text: "#241B3D",
  muted: "#827A96",
  lavender: "#EEE8FF",
  border: "#E9E3F4",
  green: "#DDF4EA",
};

const MOODS = {
  Happy: { emoji: "😊", color: "#FFF0C7" },
  Calm: { emoji: "😌", color: "#DDF4EA" },
  Sad: { emoji: "😔", color: "#E7E8FF" },
  Anxious: { emoji: "😟", color: "#FFE8DF" },
  Tired: { emoji: "😴", color: "#F0E5FA" },
};

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

function StatCard({ emoji, value, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProgressScreen({ token, onBack }) {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProgress(selectedMonth, selectedYear) {
    try {
      setLoading(true);

      const result = await getProgress(
        token,
        selectedMonth,
        selectedYear
      );

      setData(result);
    } catch (error) {
      Alert.alert(
        "Progress unavailable",
        error.message || "Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProgress(month, year);
  }, [token, month, year]);

  function changeMonth(direction) {
    let nextMonth = month + direction;
    let nextYear = year;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }

    const selected = new Date(
      nextYear,
      nextMonth - 1,
      1
    );

    const currentMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    if (selected > currentMonth) return;

    setMonth(nextMonth);
    setYear(nextYear);
  }

  const summary = data?.summary || {};
  const calendar = data?.calendar || {};
  const weekly = data?.weeklyProgress || [];
  const achievements = data?.achievements || [];

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const calendarCells = [
    ...Array(firstDay).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => index + 1
    ),
  ];

  if (loading && !data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.purple} />
        <Text style={styles.loadingText}>
          Loading your progress...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Your progress ✨</Text>
          <Text style={styles.subtitle}>
            Every small step matters.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => loadProgress(month, year)}
        >
          <Text style={styles.refresh}>↻</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🌱</Text>
        <Text style={styles.heroTitle}>
          Your wellness journey
        </Text>
        <Text style={styles.heroText}>
          Celebrate your consistency, not perfection.
        </Text>
      </View>

      <View style={styles.stats}>
        <StatCard
          emoji="🔥"
          value={summary.currentStreak || 0}
          label="Day streak"
        />

        <StatCard
          emoji="💜"
          value={summary.totalCheckIns || 0}
          label="Check-ins"
        />

        <StatCard
          emoji="🌸"
          value={summary.activeDays || 0}
          label="Active days"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Weekly mood journey
        </Text>

        <Text style={styles.cardSubtitle}>
          Your most recent check-in for each day
        </Text>

        <View style={styles.weekRow}>
          {weekly.map((item) => {
            const mood = MOODS[item.mood];

            const day = new Date(
              item.date + "T00:00:00"
            ).toLocaleDateString(undefined, {
              weekday: "short",
            });

            return (
              <View key={item.date} style={styles.weekItem}>
                <View
                  style={[
                    styles.weekCircle,
                    {
                      backgroundColor:
                        mood?.color || COLORS.lavender,
                    },
                  ]}
                >
                  <Text style={styles.weekEmoji}>
                    {mood?.emoji || "·"}
                  </Text>
                </View>

                <Text style={styles.weekDay}>{day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.monthHeader}>
          <Text style={styles.cardTitle}>
            Mood calendar
          </Text>

          <View style={styles.monthControls}>
            <TouchableOpacity
              onPress={() => changeMonth(-1)}
              style={styles.monthButton}
            >
              <Text style={styles.monthButtonText}>‹</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => changeMonth(1)}
              style={styles.monthButton}
            >
              <Text style={styles.monthButtonText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.monthName}>
          {MONTHS[month - 1]} {year}
        </Text>

        <View style={styles.calendarGrid}>
          {["S", "M", "T", "W", "T", "F", "S"].map(
            (day, index) => (
              <Text key={index} style={styles.calendarWeekday}>
                {day}
              </Text>
            )
          )}

          {calendarCells.map((day, index) => {
            const key = day
              ? `${year}-${String(month).padStart(2, "0")}-${String(
                  day
                ).padStart(2, "0")}`
              : `empty-${index}`;

            const moodName = day ? calendar[key] : null;
            const mood = MOODS[moodName];

            return (
              <View
                key={key}
                style={[
                  styles.calendarDay,
                  mood && { backgroundColor: mood.color },
                ]}
              >
                {day ? (
                  <>
                    <Text style={styles.calendarDate}>
                      {day}
                    </Text>

                    <Text style={styles.calendarEmoji}>
                      {mood?.emoji || ""}
                    </Text>
                  </>
                ) : null}
              </View>
            );
          })}
        </View>

        <Text style={styles.calendarHint}>
          An emoji means you saved a mood check-in that day.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Achievements 🏆
        </Text>

        <Text style={styles.cardSubtitle}>
          Keep showing up for yourself.
        </Text>

        {achievements.map((item) => (
          <View
            key={item.id}
            style={[
              styles.achievement,
              !item.unlocked && styles.lockedAchievement,
            ]}
          >
            <View style={styles.achievementIcon}>
              <Text style={styles.achievementEmoji}>
                {item.emoji}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.achievementTitle}>
                {item.title}
              </Text>

              <Text style={styles.achievementDescription}>
                {item.description}
              </Text>
            </View>

            <Text style={styles.achievementStatus}>
              {item.unlocked ? "✓" : "🔒"}
            </Text>
          </View>
        ))}

        <Text style={styles.achievementCount}>
          {summary.unlockedAchievements || 0} of{" "}
          {achievements.length} achievements unlocked
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Progress is personal. Take it one day at a time. 💜
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.lavender,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  backText: {
    color: COLORS.purple,
    fontSize: 28,
  },

  title: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "900",
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  refresh: {
    fontSize: 28,
    color: COLORS.purple,
    padding: 5,
  },

  hero: {
    backgroundColor: COLORS.purple,
    borderRadius: 24,
    padding: 22,
    marginBottom: 15,
  },

  heroEmoji: {
    fontSize: 34,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 12,
  },

  heroText: {
    color: "#EAE3FF",
    fontSize: 13,
    marginTop: 7,
    lineHeight: 20,
  },

  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  statCard: {
    width: "31.5%",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statEmoji: {
    fontSize: 23,
  },

  statValue: {
    color: COLORS.purple,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 6,
  },

  statLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 21,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },

  cardSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 5,
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  weekItem: {
    alignItems: "center",
    flex: 1,
  },

  weekCircle: {
    width: 36,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  weekEmoji: {
    fontSize: 20,
  },

  weekDay: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 7,
  },

  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  monthControls: {
    flexDirection: "row",
    gap: 8,
  },

  monthButton: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.lavender,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  monthButtonText: {
    color: COLORS.purple,
    fontSize: 22,
    fontWeight: "900",
  },

  monthName: {
    color: COLORS.purple,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 15,
    marginBottom: 12,
  },

  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  calendarWeekday: {
    width: "14.2857%",
    textAlign: "center",
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 11,
    paddingBottom: 10,
  },

  calendarDay: {
    width: "14.2857%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginBottom: 4,
  },

  calendarDate: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: "700",
  },

  calendarEmoji: {
    fontSize: 13,
    marginTop: 1,
  },

  calendarHint: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 12,
    lineHeight: 16,
  },

  achievement: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F2EFF7",
  },

  lockedAchievement: {
    opacity: 0.48,
  },

  achievementIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.lavender,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  achievementEmoji: {
    fontSize: 23,
  },

  achievementTitle: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 13,
  },

  achievementDescription: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },

  achievementStatus: {
    color: COLORS.green,
    fontWeight: "900",
    fontSize: 18,
  },

  achievementCount: {
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 16,
  },

  footer: {
    alignItems: "center",
    padding: 12,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: "center",
  },
});