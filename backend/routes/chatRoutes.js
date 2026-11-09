
const express = require("express");
const protect = require("../middleware/authMiddleware");
const Conversation = require("../models/Conversation");
const Mood = require("../models/Mood");

const router = express.Router();

const SYSTEM_INSTRUCTION = `
You are Lumi, the AI wellness companion inside Solace AI.

Be warm, empathetic, calm and non-judgmental.
Listen carefully and validate feelings.
Use simple language and reply in the user's language,
including Hindi or Hinglish.
Ask one gentle follow-up question when useful.
Suggest simple activities like breathing, journaling,
taking a break or talking to someone trusted.

The user’s latest recorded mood is provided as context.
Use it gently to personalize your reply.
Never assume that the mood describes how the user feels right now.
Never diagnose, prescribe medicine or claim to replace a therapist.
Never promise absolute confidentiality.
`;

const CRISIS_REPLY = `
I'm really sorry you're going through this. 💜
Thank you for telling me. Your safety matters.

If you may hurt yourself or are in immediate danger,
please move away from anything you could use to hurt yourself.
Try not to stay alone. Contact someone you trust and ask them
to stay with you.

If you are in India, call 112 for immediate emergency help.
You can also call Tele-MANAS at 14416 for free mental-health
support, available 24/7.

If you are somewhere else, contact your local emergency service
or crisis helpline.

Are you in immediate danger right now?
`;

function isCrisisMessage(text) {
  const value = text.toLowerCase();

  const patterns = [
    /\b(kill myself|suicide|end my life|want to die|wish i was dead)\b/i,
    /\b(hurt myself|harm myself|cut myself|self harm|self-harm)\b/i,
    /\b(plan to kill myself|going to kill myself)\b/i,
    /खुदकुशी/,
    /आत्महत्या/,
    /अपनी जान (देना|लेना)/,
    /खुद को मार/,
    /खुद को नुकसान/,
    /मर जाना चाहता/,
    /मर जाना चाहती/,
  ];

  return patterns.some((pattern) => pattern.test(value));
}

// Get user's saved conversations
router.get("/history", protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      user: req.user.id,
    })
      .select("title updatedAt messages")
      .sort({ updatedAt: -1 })
      .limit(50);

    res.json({ conversations });
  } catch (error) {
    console.error("Chat history error:", error.message);
    res.status(500).json({ message: "Unable to load chat history" });
  }
});

// Get one conversation
router.get("/:id", protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json({ conversation });
  } catch (error) {
    res.status(400).json({ message: "Invalid conversation ID" });
  }
});

// Rename a conversation
router.patch("/:id", protect, async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();

    if (!title || title.length > 100) {
      return res.status(400).json({
        message: "Title must be between 1 and 100 characters.",
      });
    }

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      { $set: { title } },
      { new: true, runValidators: true }
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found.",
      });
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Rename chat error:", error);

    res.status(500).json({
      message: "Unable to rename conversation.",
    });
  }
});

// Delete a conversation
router.delete("/:id", protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found.",
      });
    }

    res.json({
      success: true,
      message: "Conversation deleted successfully.",
    });
  } catch (error) {
    console.error("Delete chat error:", error);

    res.status(500).json({
      message: "Unable to delete conversation.",
    });
  }
});

// Send a message and save the conversation
router.post("/", protect, async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (message.length > 4000) {
      return res.status(400).json({ message: "Message is too long" });
    }

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        user: req.user.id,
      });

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
    } else {
      conversation = new Conversation({
        user: req.user.id,
        title: message.trim().slice(0, 60),
        messages: [],
      });
    }

    conversation.messages.push({
      role: "user",
      text: message.trim(),
    });

    // Safety response is checked before calling the AI model.
    if (isCrisisMessage(message)) {
      conversation.messages.push({
        role: "model",
        text: CRISIS_REPLY,
      });

      await conversation.save();

      return res.json({
        reply: CRISIS_REPLY,
        conversationId: conversation._id,
        safetyAlert: true,
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "AI service is not configured",
      });
    }

    // Get the user's latest recorded mood.
    const latestMood = await Mood.findOne({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    const moodContext = latestMood
      ? `The user's latest recorded mood is ${latestMood.mood}. 
         Their optional mood note is: ${latestMood.note || "No note"}.`
      : "The user has not recorded a mood yet.";

    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const recentMessages = conversation.messages.slice(-20);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: recentMessages.map((item) => ({
        role: item.role,
        parts: [{ text: item.text }],
      })),
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${moodContext}`,
        temperature: 0.7,
        maxOutputTokens: 700,
      },
    });

    const reply = response.text;

    if (!reply) {
      return res.status(502).json({
        message: "Lumi could not generate a response. Please try again.",
      });
    }

    conversation.messages.push({
      role: "model",
      text: reply,
    });

    await conversation.save();

    res.json({
      reply,
      conversationId: conversation._id,
      safetyAlert: false,
    });
  } catch (error) {
    console.error("Lumi AI Error:", error.message);

    res.status(500).json({
      message: "Unable to connect to Lumi right now. Please try again.",
    });
  }
});

module.exports = router;
