
const express = require("express");
const Mood = require("../models/Mood");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Save mood
router.post("/", protect, async (req, res) => {
  try {
    const { mood, note } = req.body;

    const savedMood = await Mood.create({
      user: req.user.id,
      mood,
      note: note || "",
    });

    res.status(201).json({
      message: "Mood saved successfully",
      data: savedMood,
    });
  } catch (error) {
    res.status(400).json({
      message: "Unable to save mood",
    });
  }
});

// Get mood history
router.get("/", protect, async (req, res) => {
  try {
    const moods = await Mood.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.json({
      count: moods.length,
      data: moods,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to fetch mood history",
    });
  }
});

module.exports = router;
