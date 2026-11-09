const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const Mood = require("../models/Mood");

function getDateKey(date) {
  const d = new Date(date);

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function getDayStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStreak(dateKeys) {
  const uniqueDays = [...new Set(dateKeys)].sort().reverse();

  if (!uniqueDays.length) return 0;

  const today = getDayStart(new Date());
  const todayKey = getDateKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);

  // Streak remains active if the latest check-in was today
  // or yesterday.
  if (
    uniqueDays[0] !== todayKey &&
    uniqueDays[0] !== yesterdayKey
  ) {
    return 0;
  }

  let streak = 0;
  let expected = new Date(
    uniqueDays[0] + "T00:00:00"
  );

  for (const key of uniqueDays) {
    if (key !== getDateKey(expected)) break;

    streak += 1;
    expected.setDate(expected.getDate() - 1);
  }

  return streak;
}

function getAchievements(streak, totalCheckIns) {
  const achievements = [
    {
      id: "first-checkin",
      title: "First Step",
      description: "Save your first mood check-in.",
      emoji: "🌱",
      unlocked: totalCheckIns >= 1,
    },
    {
      id: "three-day",
      title: "Getting Started",
      description: "Build a 3-day check-in streak.",
      emoji: "✨",
      unlocked: streak >= 3,
    },
    {
      id: "seven-day",
      title: "One Week Strong",
      description: "Build a 7-day check-in streak.",
      emoji: "🏅",
      unlocked: streak >= 7,
    },
    {
      id: "fifteen-day",
      title: "Growing Together",
      description: "Build a 15-day check-in streak.",
      emoji: "🌸",
      unlocked: streak >= 15,
    },
    {
      id: "thirty-day",
      title: "Wellness Champion",
      description: "Build a 30-day check-in streak.",
      emoji: "🏆",
      unlocked: streak >= 30,
    },
  ];

  return achievements;
}

// GET /api/progress
router.get("/", protect, async (req, res) => {
  try {
    const moods = await Mood.find({
      user: req.user.id,
    }).sort({ createdAt: 1 });

    const dateKeys = moods.map((item) =>
      getDateKey(item.createdAt)
    );

    const uniqueDays = [...new Set(dateKeys)];

    const currentStreak = getStreak(uniqueDays);

    const todayKey = getDateKey(new Date());

    const todayCheckIn = uniqueDays.includes(todayKey);

    const totalCheckIns = moods.length;

    const achievements = getAchievements(
      currentStreak,
      totalCheckIns
    );

    const now = new Date();

    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    if (
      month < 1 ||
      month > 12 ||
      year < 2000 ||
      year > 2100
    ) {
      return res.status(400).json({
        message: "Invalid month or year.",
      });
    }

    const monthMoods = moods.filter((item) => {
      const date = new Date(item.createdAt);

      return (
        date.getMonth() + 1 === month &&
        date.getFullYear() === year
      );
    });

    const calendar = {};

    monthMoods.forEach((item) => {
      const key = getDateKey(item.createdAt);
      calendar[key] = item.mood;
    });

    const lastSevenDays = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const key = getDateKey(date);

      const dayRecords = moods.filter(
        (item) => getDateKey(item.createdAt) === key
      );

      lastSevenDays.push({
        date: key,
        mood: dayRecords.length
          ? dayRecords[dayRecords.length - 1].mood
          : null,
        checkIns: dayRecords.length,
      });
    }

    const moodCounts = {};

    monthMoods.forEach((item) => {
      moodCounts[item.mood] =
        (moodCounts[item.mood] || 0) + 1;
    });

    res.json({
      success: true,
      summary: {
        totalCheckIns,
        currentStreak,
        todayCheckIn,
        activeDays: uniqueDays.length,
        unlockedAchievements: achievements.filter(
          (item) => item.unlocked
        ).length,
      },
      calendar,
      weeklyProgress: lastSevenDays,
      moodCounts,
      achievements,
    });
  } catch (error) {
    console.error("Progress API error:", error);

    res.status(500).json({
      message: "Unable to load progress.",
    });
  }
});

module.exports = router;