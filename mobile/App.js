import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import {
  registerUser,
  loginUser,
  saveMood,
  getMoodHistory,
} from "./services/api";
import ChatScreen from "./app/ChatScreen";
import ProgressScreen from "./app/ProgressScreen";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const COLORS = {
  bg: "#F8F6FF",
  white: "#FFFFFF",
  purple: "#7554D9",
  purpleDark: "#5636B5",
  lavender: "#EEE8FF",
  lavender2: "#F4F0FF",
  text: "#241B3D",
  muted: "#827A96",
  border: "#E9E3F4",
  green: "#4EAA86",
  pink: "#F5E8F2",
  orange: "#FFF0DF",
};

const MOODS = [
  { name: "Happy", emoji: "😊", color: "#FFF0C7" },
  { name: "Calm", emoji: "😌", color: "#DDF4EA" },
  { name: "Sad", emoji: "😔", color: "#E7E8FF" },
  { name: "Anxious", emoji: "😟", color: "#FFE8DF" },
  { name: "Tired", emoji: "😴", color: "#F0E5FA" },
];

const AFFIRMATIONS = [
  "I am allowed to take things one step at a time.",
  "My feelings are valid, and I can meet them with kindness.",
  "I do not need to have everything figured out today.",
  "Small progress is still progress.",
  "I deserve rest, care, and understanding.",
  "I can pause, breathe, and begin again.",
  "I am doing the best I can with what I have today.",
];

const STORAGE_KEYS = {
  journal: "solace_journal_entries_v1",
  reminder: "solace_daily_reminder_enabled_v1",
  reminderId: "solace_daily_reminder_id_v1",
  user: "solace_user_v1",
};

function dayLabel(dateValue) {
  return new Date(dateValue).toLocaleDateString(undefined, {
    weekday: "short",
  });
}

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function PrimaryButton({ title, onPress, disabled, loading }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.primaryButton,
        (disabled || loading) && styles.disabledButton,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.primaryButtonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

function Header({ title, subtitle, onBack }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {!!subtitle && (
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        )}
      </View>
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState("auth");
  const [authMode, setAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  const [selectedMood, setSelectedMood] = useState("");
  const [moodNote, setMoodNote] = useState("");
  const [moodHistory, setMoodHistory] = useState([]);

  const [journalEntries, setJournalEntries] = useState([]);
  const [journalText, setJournalText] = useState("");

  const [reminderEnabled, setReminderEnabled] = useState(false);

  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingSeconds, setBreathingSeconds] = useState(120);
  const [breathingTick, setBreathingTick] = useState(0);

  const [selectedTab, setSelectedTab] = useState("Home");

  const breathingInterval = useRef(null);

  useEffect(() => {
    restoreLocalState();

    return () => {
      if (breathingInterval.current) {
        clearInterval(breathingInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (token) {
      loadMoodHistory();
    }
  }, [token]);

  useEffect(() => {
    if (!breathingActive) {
      if (breathingInterval.current) {
        clearInterval(breathingInterval.current);
      }

      breathingInterval.current = null;
      return;
    }

    breathingInterval.current = setInterval(() => {
      setBreathingSeconds((current) => {
        if (current <= 1) {
          clearInterval(breathingInterval.current);
          breathingInterval.current = null;
          setBreathingActive(false);

          Alert.alert(
            "Well done",
            "You completed your breathing session. Take a moment to notice how you feel."
          );

          return 0;
        }

        return current - 1;
      });

      setBreathingTick((current) => current + 1);
    }, 1000);

    return () => {
      if (breathingInterval.current) {
        clearInterval(breathingInterval.current);
      }
    };
  }, [breathingActive]);

  async function restoreLocalState() {
    try {
      const [savedUser, savedJournal, savedReminder] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.user),
          AsyncStorage.getItem(STORAGE_KEYS.journal),
          AsyncStorage.getItem(STORAGE_KEYS.reminder),
        ]);

      if (savedJournal) {
        setJournalEntries(JSON.parse(savedJournal));
      }

      if (savedReminder === "true") {
        setReminderEnabled(true);
      }

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.log("Local restore error:", error.message);
    }
  }

  async function loadMoodHistory() {
    try {
      const result = await getMoodHistory(token);

      const records = Array.isArray(result)
        ? result
        : result.moods || result.data || [];

      setMoodHistory(records);
    } catch (error) {
      console.log("Mood history error:", error.message);
    }
  }

  async function handleAuth() {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing details",
        "Please enter your email and password."
      );
      return;
    }

    if (authMode === "register" && !name.trim()) {
      Alert.alert("Missing name", "Please enter your name.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Password",
        "Please use at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const result =
        authMode === "register"
          ? await registerUser(
              name.trim(),
              email.trim().toLowerCase(),
              password
            )
          : await loginUser(
              email.trim().toLowerCase(),
              password
            );

      const receivedToken =
        result.token || result.data?.token;

      const receivedUser =
        result.user ||
        result.data?.user || {
          name: name.trim() || email.split("@")[0],
          email: email.trim().toLowerCase(),
        };

      if (!receivedToken) {
        throw new Error(
          "The server did not return an authentication token."
        );
      }

      setToken(receivedToken);
      setUser(receivedUser);

      await AsyncStorage.setItem(
        STORAGE_KEYS.user,
        JSON.stringify(receivedUser)
      );

      setPassword("");
      setScreen("main");
      setSelectedTab("Home");
    } catch (error) {
      Alert.alert(
        "Unable to continue",
        error.message || "Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveMood() {
    if (!selectedMood) {
      Alert.alert(
        "Choose a mood",
        "Select how you are feeling first."
      );
      return;
    }

    setLoading(true);

    try {
      await saveMood(selectedMood, moodNote.trim(), token);

      setMoodNote("");
      await loadMoodHistory();

      Alert.alert(
        "Mood saved",
        "Thank you for checking in with yourself."
      );
    } catch (error) {
      Alert.alert(
        "Could not save mood",
        error.message || "Please try again."
      );
    } finally {
      setLoading(false);
    }
  }
    async function saveJournalEntry() {
    if (!journalText.trim()) {
      Alert.alert(
        "Write a little first",
        "Your journal entry is empty."
      );
      return;
    }

    const entry = {
      id: `${Date.now()}`,
      text: journalText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [entry, ...journalEntries];

    setJournalEntries(updated);
    setJournalText("");

    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.journal,
        JSON.stringify(updated)
      );

      Alert.alert(
        "Saved",
        "Your journal entry is stored on this device."
      );
    } catch (error) {
      Alert.alert("Save failed", "Please try again.");
    }
  }

  async function deleteJournalEntry(id) {
    Alert.alert(
      "Delete entry?",
      "This journal entry will be removed from this device.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updated = journalEntries.filter(
              (entry) => entry.id !== id
            );

            setJournalEntries(updated);

            await AsyncStorage.setItem(
              STORAGE_KEYS.journal,
              JSON.stringify(updated)
            );
          },
        },
      ]
    );
  }

  async function toggleReminder() {
    if (reminderEnabled) {
      try {
        const existingId = await AsyncStorage.getItem(
          STORAGE_KEYS.reminderId
        );

        if (existingId) {
          await Notifications.cancelScheduledNotificationAsync(
            existingId
          );
        }

        await AsyncStorage.multiRemove([
          STORAGE_KEYS.reminder,
          STORAGE_KEYS.reminderId,
        ]);

        setReminderEnabled(false);

        Alert.alert(
          "Reminder off",
          "Your daily reminder has been turned off."
        );
      } catch (error) {
        Alert.alert(
          "Reminder",
          "Could not turn off the reminder."
        );
      }

      return;
    }

    try {
      const permission =
        await Notifications.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Allow notifications in your phone settings to receive a reminder."
        );
        return;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync(
          "wellness",
          {
            name: "Wellness reminders",
            importance:
              Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
          }
        );
      }

      const id =
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "A gentle moment for yourself 💜",
            body: "Take a breath and check in with how you are feeling.",
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 20,
            minute: 0,
            channelId:
              Platform.OS === "android"
                ? "wellness"
                : undefined,
          },
        });

      await AsyncStorage.setItem(
        STORAGE_KEYS.reminder,
        "true"
      );

      await AsyncStorage.setItem(
        STORAGE_KEYS.reminderId,
        id
      );

      setReminderEnabled(true);

      Alert.alert(
        "Reminder set",
        "You will receive a gentle reminder every day at 8:00 PM."
      );
    } catch (error) {
      Alert.alert(
        "Reminder error",
        error.message || "Could not schedule notification."
      );
    }
  }

  function resetBreathing() {
    setBreathingActive(false);
    setBreathingSeconds(120);
    setBreathingTick(0);
  }

  async function handleLogout() {
    setToken(null);
    setUser(null);
    setScreen("auth");
    setSelectedTab("Home");

    await AsyncStorage.removeItem(STORAGE_KEYS.user);
  }

  const affirmation =
    AFFIRMATIONS[
      Math.floor(Date.now() / 86400000) %
        AFFIRMATIONS.length
    ];

  const lastSevenDays = useMemo(() => {
    const now = new Date();
    const days = [];

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);

      const key = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

      const record = moodHistory.find((item) => {
        const value = item.createdAt || item.date;

        return value && todayKeyFrom(value) === key;
      });

      days.push({
        key,
        label: dayLabel(d),
        mood: record?.mood || null,
      });
    }

    return days;
  }, [moodHistory]);

  const moodCounts = useMemo(() => {
    return moodHistory.reduce((acc, item) => {
      const mood = item.mood || "Other";

      acc[mood] = (acc[mood] || 0) + 1;

      return acc;
    }, {});
  }, [moodHistory]);

  function renderAuth() {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.bg}
          translucent={false}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={
            Platform.OS === "ios" ? "padding" : undefined
          }
        >
          <ScrollView
            contentContainerStyle={styles.authContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>☁️</Text>
            </View>

            <Text style={styles.brand}>solace</Text>

            <Text style={styles.tagline}>
              A little space to feel understood.
            </Text>

            <Card style={styles.authCard}>
              <Text style={styles.authTitle}>
                {authMode === "login"
                  ? "Welcome back"
                  : "Create your account"}
              </Text>

              <Text style={styles.authSubtitle}>
                Your wellbeing journey starts with one small step.
              </Text>

              {authMode === "register" && (
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={COLORS.muted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              )}

              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={COLORS.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={styles.input}
                placeholder="Password (minimum 6 characters)"
                placeholderTextColor={COLORS.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <PrimaryButton
                title={
                  authMode === "login"
                    ? "Log in"
                    : "Create account"
                }
                onPress={handleAuth}
                loading={loading}
              />

              <TouchableOpacity
                style={styles.switchAuth}
                onPress={() =>
                  setAuthMode(
                    authMode === "login"
                      ? "register"
                      : "login"
                  )
                }
              >
                <Text style={styles.switchAuthText}>
                  {authMode === "login"
                    ? "New to Solace? "
                    : "Already have an account? "}

                  <Text
                    style={{
                      color: COLORS.purple,
                      fontWeight: "800",
                    }}
                  >
                    {authMode === "login"
                      ? "Sign up"
                      : "Log in"}
                  </Text>
                </Text>
              </TouchableOpacity>
            </Card>

            <Text style={styles.disclaimer}>
              Solace is a wellbeing companion, not a replacement
              for professional care.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  function renderHome() {
    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.eyebrow}>
              YOUR SAFE SPACE
            </Text>

            <Text style={styles.greeting}>
              Hello, {user?.name?.split(" ")[0] || "there"} 💜
            </Text>

            <Text style={styles.subGreeting}>
              How are you feeling today?
            </Text>
          </View>

          <TouchableOpacity
            style={styles.avatar}
            onPress={() => setSelectedTab("Profile")}
          >
            <Text style={styles.avatarText}>
              {(user?.name || "S")
                .charAt(0)
                .toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.lumiBanner}
          onPress={() => setSelectedTab("Lumi")}
          activeOpacity={0.9}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerKicker}>
              MEET YOUR AI COMPANION
            </Text>

            <Text style={styles.bannerTitle}>
              A gentle space to talk.
            </Text>

            <Text style={styles.bannerBody}>
              Lumi is here to listen, one message at a time.
            </Text>

            <Text style={styles.bannerAction}>
              Chat with Lumi →
            </Text>
          </View>

          <Text style={styles.lumiEmoji}>🌙</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>
            Daily mood check-in
          </Text>

          <Text style={styles.sectionHint}>
            No right or wrong feelings
          </Text>
        </View>

        <View style={styles.moodGrid}>
          {MOODS.map((mood) => (
            <TouchableOpacity
              key={mood.name}
              onPress={() => setSelectedMood(mood.name)}
              style={[
                styles.moodOption,
                { backgroundColor: mood.color },
                selectedMood === mood.name &&
                  styles.moodSelected,
              ]}
            >
              <Text style={styles.moodEmoji}>
                {mood.emoji}
              </Text>

              <Text style={styles.moodName}>
                {mood.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="Would you like to add a note? (optional)"
          placeholderTextColor={COLORS.muted}
          value={moodNote}
          onChangeText={setMoodNote}
          multiline
          maxLength={1000}
        />

        <PrimaryButton
          title="Save today's check-in"
          onPress={handleSaveMood}
          loading={loading}
          disabled={!selectedMood}
        />

        <Card style={styles.affirmationCard}>
          <Text style={styles.affirmationLabel}>
            A THOUGHT TO CARRY TODAY ✨
          </Text>

          <Text style={styles.affirmationText}>
            “{affirmation}”
          </Text>
        </Card>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>
            Your wellness space
          </Text>
        </View>

        <View style={styles.shortcutGrid}>
          <Shortcut
            emoji="📈"
            title="Mood insights"
            subtitle="Notice your patterns"
            onPress={() => setSelectedTab("Insights")}
          />

          <Shortcut
            emoji="🌬️"
            title="Breathe"
            subtitle="Find a calmer moment"
            onPress={() => setSelectedTab("Wellness")}
          />

          <Shortcut
            emoji="📔"
            title="Journal"
            subtitle="Put thoughts into words"
            onPress={() => setSelectedTab("Journal")}
          />

          <Shortcut
            emoji="🔔"
            title="Daily reminder"
            subtitle={
              reminderEnabled
                ? "Enabled at 8 PM"
                : "Create a gentle habit"
            }
            onPress={toggleReminder}
          />
        </View>
      </ScrollView>
    );
  }
    function renderInsights() {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Header
          title="Mood insights"
          subtitle="A gentle look at your recent check-ins"
        />

        <Card>
          <Text style={styles.sectionTitle}>
            Last 7 days
          </Text>

          <Text style={styles.sectionHint}>
            Days without a check-in are left blank.
          </Text>

          <View style={styles.weekRow}>
            {lastSevenDays.map((day) => {
              const mood = MOODS.find(
                (item) => item.name === day.mood
              );

              return (
                <View key={day.key} style={styles.weekDay}>
                  <View
                    style={[
                      styles.weekMood,
                      {
                        backgroundColor:
                          mood?.color || COLORS.lavender2,
                      },
                    ]}
                  >
                    <Text style={styles.weekEmoji}>
                      {mood?.emoji || "·"}
                    </Text>
                  </View>

                  <Text style={styles.weekLabel}>
                    {day.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>
            Your check-ins
          </Text>

          <Text style={styles.bigNumber}>
            {moodHistory.length}
          </Text>

          <Text style={styles.sectionHint}>
            Total mood entries saved to your account
          </Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>
            Mood distribution
          </Text>

          {Object.keys(moodCounts).length === 0 ? (
            <Text style={styles.emptyText}>
              Your mood patterns will appear here after you add check-ins.
            </Text>
          ) : (
            Object.entries(moodCounts).map(
              ([moodName, count]) => {
                const mood = MOODS.find(
                  (item) => item.name === moodName
                );

                const percent = Math.round(
                  (count / moodHistory.length) * 100
                );

                return (
                  <View
                    key={moodName}
                    style={styles.distributionRow}
                  >
                    <Text style={styles.distributionName}>
                      {mood?.emoji || "•"} {moodName}
                    </Text>

                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${percent}%` },
                        ]}
                      />
                    </View>

                    <Text style={styles.distributionCount}>
                      {count}
                    </Text>
                  </View>
                );
              }
            )
          )}
        </Card>

        <Text style={styles.disclaimer}>
          These insights are simple summaries of the check-ins
          you saved, not a clinical assessment.
        </Text>

        <TouchableOpacity
          onPress={loadMoodHistory}
          style={styles.textButton}
        >
          <Text style={styles.textButtonText}>
            Refresh insights
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderWellness() {
    const phase = breathingTick % 12;

    const breathingText =
      phase < 4
        ? "Breathe in"
        : phase < 8
        ? "Breathe out"
        : "Rest";

    const minutes = Math.floor(breathingSeconds / 60);
    const seconds = breathingSeconds % 60;

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Header
          title="Wellness studio"
          subtitle="Small practices for the present moment"
        />

        <Card style={styles.breathCard}>
          <Text style={styles.breathIcon}>🌬️</Text>

          <Text style={styles.sectionTitle}>
            Two-minute breathing
          </Text>

          <Text style={styles.sectionHint}>
            Follow a gentle 4–4–4 rhythm: inhale, exhale, rest.
          </Text>

          <View style={styles.breathCircle}>
            <Text style={styles.breathPhase}>
              {breathingActive ? breathingText : "Your pace"}
            </Text>

            <Text style={styles.breathTime}>
              {`${String(minutes).padStart(2, "0")}:${String(
                seconds
              ).padStart(2, "0")}`}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.primaryButtonSmall}
              onPress={() => {
                if (breathingSeconds === 0) {
                  resetBreathing();
                }

                setBreathingActive(!breathingActive);
              }}
            >
              <Text style={styles.primaryButtonText}>
                {breathingActive
                  ? "Pause"
                  : breathingSeconds === 0
                  ? "Start again"
                  : "Start breathing"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={resetBreathing}
            >
              <Text style={styles.secondaryButtonText}>
                Reset
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>
            A small reminder
          </Text>

          <Text style={styles.bodyText}>
            You do not have to solve everything right now.
            Relax your shoulders, unclench your jaw, and give
            yourself one quiet minute.
          </Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>
            Daily affirmation
          </Text>

          <Text style={styles.affirmationText}>
            “{affirmation}”
          </Text>
        </Card>
      </ScrollView>
    );
  }

  function renderJournal() {
    return (
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Header
          title="Private journal"
          subtitle="A quiet place for your thoughts"
        />

        <Card>
          <Text style={styles.sectionTitle}>
            What is on your mind?
          </Text>

          <Text style={styles.sectionHint}>
            Your entries are stored locally on this device.
          </Text>

          <TextInput
            style={[styles.input, styles.journalInput]}
            placeholder="Start writing…"
            placeholderTextColor={COLORS.muted}
            multiline
            textAlignVertical="top"
            value={journalText}
            onChangeText={setJournalText}
            maxLength={5000}
          />

          <PrimaryButton
            title="Save journal entry"
            onPress={saveJournalEntry}
          />
        </Card>

        <Text style={styles.sectionTitle}>
          Past entries ({journalEntries.length})
        </Text>

        {journalEntries.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              No entries yet. Your first page can start with one sentence.
            </Text>
          </Card>
        ) : (
          journalEntries.map((entry) => (
            <Card key={entry.id}>
              <Text style={styles.entryDate}>
                {new Date(entry.createdAt).toLocaleString()}
              </Text>

              <Text style={styles.bodyText}>
                {entry.text}
              </Text>

              <TouchableOpacity
                onPress={() => deleteJournalEntry(entry.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteText}>
                  Delete entry
                </Text>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>
    );
  }

  function renderProfile() {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Header
          title="Your profile"
          subtitle="Manage your Solace experience"
        />

        <Card style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {(user?.name || "S")
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <Text style={styles.profileName}>
            {user?.name || "Solace member"}
          </Text>

          <Text style={styles.profileEmail}>
            {user?.email || ""}
          </Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>
            Daily wellness reminder
          </Text>

          <Text style={styles.sectionHint}>
            A gentle notification every day at 8:00 PM.
          </Text>

          <View style={styles.settingRow}>
            <Text style={styles.bodyText}>
              {reminderEnabled
                ? "Reminder is on"
                : "Reminder is off"}
            </Text>

            <TouchableOpacity
              style={[
                styles.toggle,
                reminderEnabled && styles.toggleOn,
              ]}
              onPress={toggleReminder}
            >
              <View
                style={[
                  styles.toggleKnob,
                  reminderEnabled && styles.toggleKnobOn,
                ]}
              />
            </TouchableOpacity>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>
            About Solace
          </Text>

          <Text style={styles.bodyText}>
            Solace is a supportive wellbeing companion for
            reflection, mood check-ins, and gentle self-care
            practices.
          </Text>

          <Text style={styles.disclaimer}>
            It is not a medical service and does not replace a
            qualified mental health professional or emergency support.
          </Text>
        </Card>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderHistory() {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Header
          title="Mood history"
          subtitle="Your saved check-ins"
          onBack={() => setSelectedTab("Home")}
        />

        {moodHistory.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              No mood check-ins yet. Your saved check-ins will appear here.
            </Text>
          </Card>
        ) : (
          moodHistory.map((item, index) => {
            const mood = MOODS.find(
              (m) => m.name === item.mood
            );

            return (
              <Card key={item._id || item.id || index}>
                <View style={styles.historyRow}>
                  <Text style={styles.historyEmoji}>
                    {mood?.emoji || "💜"}
                  </Text>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyMood}>
                      {item.mood}
                    </Text>

                    <Text style={styles.entryDate}>
                      {item.createdAt
                        ? new Date(
                            item.createdAt
                          ).toLocaleString()
                        : ""}
                    </Text>

                    {!!item.note && (
                      <Text style={styles.bodyText}>
                        {item.note}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    );
  }
    if (screen === "auth" || !token) {
    return renderAuth();
  }

  if (screen === "chat") {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.bg}
          translucent={false}
        />

        <ChatScreen
          token={token}
          onBack={() => {
            setScreen("main");
            setSelectedTab("Home");
          }}
        />
      </SafeAreaView>
    );
  }

  let activeContent;

  if (selectedTab === "Home") {
    activeContent = renderHome();
  } else if (selectedTab === "Insights") {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.bg}
        translucent={false}
      />

      <ProgressScreen
        token={token}
        onBack={() => setSelectedTab("Home")}
      />
    </SafeAreaView>
  );
  } else if (selectedTab === "Lumi") {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.bg}
          translucent={false}
        />

        <ChatScreen
          token={token}
          onBack={() => setSelectedTab("Home")}
        />
      </SafeAreaView>
    );
  } else if (selectedTab === "Wellness") {
    activeContent = renderWellness();
  } else if (selectedTab === "Journal") {
    activeContent = renderJournal();
  } else if (selectedTab === "Profile") {
    activeContent = renderProfile();
  } else if (selectedTab === "History") {
    activeContent = renderHistory();
  } else {
    activeContent = renderHome();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.bg}
        translucent={false}
      />

      <View style={styles.appShell}>
        {activeContent}

        <View style={styles.tabBar}>
          <TabButton
            icon="⌂"
            label="Home"
            active={selectedTab === "Home"}
            onPress={() => setSelectedTab("Home")}
          />

          <TabButton
            icon="♡"
            label="Insights"
            active={selectedTab === "Insights"}
            onPress={() => setSelectedTab("Insights")}
          />

          <TabButton
            icon="☾"
            label="Lumi"
            active={selectedTab === "Lumi"}
            onPress={() => setSelectedTab("Lumi")}
          />

          <TabButton
            icon="✧"
            label="Wellness"
            active={selectedTab === "Wellness"}
            onPress={() => setSelectedTab("Wellness")}
          />

          <TabButton
            icon="▤"
            label="Journal"
            active={selectedTab === "Journal"}
            onPress={() => setSelectedTab("Journal")}
          />

          <TabButton
            icon="○"
            label="Profile"
            active={selectedTab === "Profile"}
            onPress={() => setSelectedTab("Profile")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function todayKeyFrom(value) {
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function Shortcut({ emoji, title, subtitle, onPress }) {
  return (
    <TouchableOpacity
      style={styles.shortcut}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.shortcutEmoji}>{emoji}</Text>

      <Text style={styles.shortcutTitle}>{title}</Text>

      <Text style={styles.shortcutSubtitle}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

function TabButton({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.tabIcon,
          active && styles.tabActive,
        ]}
      >
        {icon}
      </Text>

      <Text
        style={[
          styles.tabLabel,
          active && styles.tabActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  appShell: {
    flex: 1,
  },

  authContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 40,
  },

  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 28,
    backgroundColor: COLORS.lavender,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },

  logoEmoji: {
    fontSize: 38,
  },

  brand: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.purpleDark,
    textAlign: "center",
    marginTop: 10,
    letterSpacing: 1,
  },

  tagline: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 28,
    fontSize: 14,
  },

  authCard: {
    padding: 22,
  },

  authTitle: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: "800",
  },

  authSubtitle: {
    color: COLORS.muted,
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },

  input: {
    backgroundColor: "#FBFAFE",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 12,
  },

  primaryButton: {
    backgroundColor: COLORS.purple,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },

  primaryButtonSmall: {
    backgroundColor: COLORS.purple,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
    flex: 1,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },

  disabledButton: {
    opacity: 0.5,
  },

  switchAuth: {
    paddingTop: 18,
    alignItems: "center",
  },

  switchAuthText: {
    color: COLORS.muted,
    fontSize: 13,
  },

  disclaimer: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 18,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0ECF7",
  },

  content: {
  paddingTop: Platform.OS === "android" ? 18 : 10,
  paddingHorizontal: 20,
  paddingBottom: 45,
},

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  eyebrow: {
    color: COLORS.purple,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  greeting: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: "900",
    marginTop: 5,
  },

  subGreeting: {
    color: COLORS.muted,
    marginTop: 4,
    fontSize: 13,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: COLORS.lavender,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: COLORS.purpleDark,
    fontWeight: "900",
    fontSize: 20,
  },

  lumiBanner: {
    backgroundColor: "#6D4BC7",
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  bannerKicker: {
    color: "#E6DCFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 8,
  },

  bannerBody: {
    color: "#EAE3FF",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 230,
  },

  bannerAction: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 14,
  },

  lumiEmoji: {
    fontSize: 50,
    marginLeft: 8,
  },

  sectionHeading: {
    marginBottom: 12,
    marginTop: 2,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },

  sectionHint: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },

  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  moodOption: {
    width: "18.8%",
    minHeight: 82,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 8,
  },

  moodSelected: {
    borderColor: COLORS.purple,
    transform: [{ scale: 1.03 }],
  },

  moodEmoji: {
    fontSize: 25,
  },

  moodName: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 6,
  },

  noteInput: {
    minHeight: 72,
    textAlignVertical: "top",
  },

  affirmationCard: {
    backgroundColor: "#F0EAFE",
    borderColor: "#E9DFFF",
    marginTop: 18,
  },

  affirmationLabel: {
    color: COLORS.purpleDark,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  affirmationText: {
    color: COLORS.text,
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "700",
    marginTop: 10,
  },

  shortcutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  shortcut: {
    width: "48.5%",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  shortcutEmoji: {
    fontSize: 25,
  },

  shortcutTitle: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 13,
    marginTop: 10,
  },

  shortcutSubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
    lineHeight: 15,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: COLORS.lavender,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  backText: {
    color: COLORS.purpleDark,
    fontSize: 30,
    lineHeight: 32,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  weekDay: {
    alignItems: "center",
    flex: 1,
  },

  weekMood: {
    width: 34,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  weekEmoji: {
    fontSize: 19,
    color: COLORS.muted,
  },

  weekLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 7,
  },

  bigNumber: {
    fontSize: 42,
    fontWeight: "900",
    color: COLORS.purple,
    marginTop: 10,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
  },

  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },

  distributionName: {
    width: 90,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },

  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 8,
    backgroundColor: COLORS.lavender2,
    overflow: "hidden",
  },

  barFill: {
    height: 8,
    backgroundColor: COLORS.purple,
    borderRadius: 8,
  },

  distributionCount: {
    width: 25,
    textAlign: "right",
    color: COLORS.muted,
    fontSize: 12,
  },

  textButton: {
    alignItems: "center",
    padding: 12,
  },

  textButtonText: {
    color: COLORS.purple,
    fontWeight: "800",
  },

  breathCard: {
    alignItems: "center",
    paddingVertical: 24,
  },

  breathIcon: {
    fontSize: 35,
    marginBottom: 8,
  },

  breathCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: COLORS.lavender,
    borderWidth: 9,
    borderColor: "#E3D8FF",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 22,
  },

  breathPhase: {
    color: COLORS.purpleDark,
    fontWeight: "800",
    fontSize: 16,
  },

  breathTime: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 28,
    marginTop: 7,
    fontVariant: ["tabular-nums"],
  },

  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 20,
    justifyContent: "center",
  },

  secondaryButtonText: {
    color: COLORS.purpleDark,
    fontWeight: "800",
  },

  bodyText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 9,
  },

  journalInput: {
    minHeight: 160,
    textAlignVertical: "top",
    marginTop: 15,
  },

  entryDate: {
    color: COLORS.muted,
    fontSize: 10,
    marginBottom: 6,
  },

  deleteButton: {
    alignSelf: "flex-end",
    paddingTop: 12,
  },

  deleteText: {
    color: "#C65B68",
    fontSize: 12,
    fontWeight: "800",
  },

  profileCard: {
    alignItems: "center",
    paddingVertical: 26,
  },

  profileAvatar: {
    width: 76,
    height: 76,
    borderRadius: 27,
    backgroundColor: COLORS.lavender,
    alignItems: "center",
    justifyContent: "center",
  },

  profileAvatarText: {
    color: COLORS.purpleDark,
    fontSize: 32,
    fontWeight: "900",
  },

  profileName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 12,
  },

  profileEmail: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },

  toggle: {
    width: 48,
    height: 28,
    borderRadius: 15,
    backgroundColor: "#D9D4E3",
    padding: 3,
    justifyContent: "center",
  },

  toggleOn: {
    backgroundColor: COLORS.purple,
  },

  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
  },

  toggleKnobOn: {
    alignSelf: "flex-end",
  },

  logoutButton: {
    borderWidth: 1,
    borderColor: "#E9C9D0",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 20,
  },

  logoutText: {
    color: "#B74F65",
    fontWeight: "900",
  },

  historyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  historyEmoji: {
    fontSize: 28,
    marginRight: 13,
  },

  historyMood: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },

  tabBar: {
  flexDirection: "row",
  backgroundColor: COLORS.white,
  borderTopWidth: 1,
  borderTopColor: COLORS.border,
  paddingTop: 12,
  paddingBottom: Platform.OS === "android" ? 32 : 12,
  justifyContent: "space-around",
  minHeight: Platform.OS === "android" ? 78 : 65,
},

  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  tabIcon: {
    color: "#A59CB7",
    fontSize: 20,
    fontWeight: "700",
  },

  tabLabel: {
    color: "#A59CB7",
    fontSize: 8,
    marginTop: 3,
    fontWeight: "700",
  },

  tabActive: {
    color: COLORS.purple,
    fontWeight: "900",
  },
});