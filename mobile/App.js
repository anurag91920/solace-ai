
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from "react-native";

import {
  registerUser,
  loginUser,
  saveMood,
  getMoodHistory,
} from "./services/api";

import ChatScreen from "./app/ChatScreen";

const MOODS = [
  { name: "Happy", emoji: "😊", color: "#FFF0C2" },
  { name: "Calm", emoji: "😌", color: "#DDF5E8" },
  { name: "Sad", emoji: "😔", color: "#DFE9FF" },
  { name: "Anxious", emoji: "😟", color: "#FCE1E5" },
  { name: "Tired", emoji: "😴", color: "#EDE0FF" },
];

export default function App() {
  const [screen, setScreen] = useState("login");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const [selectedMood, setSelectedMood] = useState("");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState([]);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Missing details", "Please fill all fields.");
      return;
    }

    try {
      setLoading(true);

      const result = await registerUser(
        name.trim(),
        email.trim(),
        password
      );

      setToken(result.token);
      setUser(result.user);
      setScreen("home");

      setName("");
      setEmail("");
      setPassword("");

      Alert.alert("Welcome!", "Account created successfully.");
    } catch (error) {
      Alert.alert("Registration failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const result = await loginUser(email.trim(), password);

      setToken(result.token);
      setUser(result.user);
      setScreen("home");

      setEmail("");
      setPassword("");
    } catch (error) {
      Alert.alert("Login failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMood = async () => {
    if (!selectedMood) {
      Alert.alert("Select a mood", "Please select how you feel.");
      return;
    }

    try {
      setLoading(true);

      await saveMood(selectedMood, note.trim(), token);

      Alert.alert("Saved 💜", "Your mood has been saved.");

      setSelectedMood("");
      setNote("");
    } catch (error) {
      Alert.alert("Mood error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);

      const result = await getMoodHistory(token);
      setHistory(result.data || []);
      setScreen("history");
    } catch (error) {
      Alert.alert("History error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setSelectedMood("");
    setNote("");
    setHistory([]);
    setScreen("login");
  };

  const renderButton = (label, onPress, secondary = false) => (
    <TouchableOpacity
      style={[
        styles.button,
        secondary && styles.secondaryButton,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text
          style={[
            styles.buttonText,
            secondary && styles.secondaryButtonText,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderInput = (
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false
  ) => (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#999"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
    />
  );

  const renderAuthScreen = () => {
    const isRegister = screen === "register";

    return (
      <View style={styles.authContainer}>
        <Text style={styles.logo}>💜 SOLACE</Text>
        <Text style={styles.subtitle}>
          Your safe space to feel better.
        </Text>

        <View style={styles.card}>
          <Text style={styles.heading}>
            {isRegister ? "Create Account" : "Welcome Back"}
          </Text>

          {isRegister &&
            renderInput("Your name", name, setName)}

          {renderInput("Email address", email, setEmail)}

          {renderInput(
            "Password (minimum 8 characters)",
            password,
            setPassword,
            true
          )}

          {renderButton(
            isRegister ? "Create Account" : "Login",
            isRegister ? handleRegister : handleLogin
          )}

          <TouchableOpacity
            disabled={loading}
            onPress={() => {
              setScreen(isRegister ? "login" : "register");
              setEmail("");
              setPassword("");
              setName("");
            }}
          >
            <Text style={styles.switchText}>
              {isRegister
                ? "Already have an account? Login"
                : "New to Solace? Create an account"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHomeScreen = () => (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>💜 SOLACE</Text>
          <Text style={styles.greeting}>
            Hello, {user?.name || "Friend"}!
          </Text>
        </View>

        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.aiCard}
        onPress={() => setScreen("chat")}
      >
        <Text style={styles.aiTitle}>✨ Meet Lumi</Text>
        <Text style={styles.aiText}>
          Your AI wellness companion. A safe space to express yourself.
        </Text>
        <Text style={styles.comingSoon}>
          Start a conversation →
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>
        How are you feeling today?
      </Text>

      <View style={styles.moodGrid}>
        {MOODS.map((item) => (
          <TouchableOpacity
            key={item.name}
            onPress={() => setSelectedMood(item.name)}
            style={[
              styles.moodCard,
              { backgroundColor: item.color },
              selectedMood === item.name && styles.selectedMood,
            ]}
          >
            <Text style={styles.moodEmoji}>{item.emoji}</Text>
            <Text style={styles.moodName}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>
        Add a note (optional)
      </Text>

      <TextInput
        style={[styles.input, styles.noteInput]}
        placeholder="Write how you are feeling..."
        placeholderTextColor="#999"
        value={note}
        onChangeText={setNote}
        multiline
      />

      {renderButton("Save My Mood 💜", handleSaveMood)}

      <View style={styles.affirmationCard}>
        <Text style={styles.affirmationTitle}>
          Daily Affirmation
        </Text>
        <Text style={styles.affirmation}>
          "You are doing better than you think. Take it one day at a time."
        </Text>
      </View>

      {renderButton("View Mood History", loadHistory, true)}
    </ScrollView>
  );

  const renderHistoryScreen = () => (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>💜 SOLACE</Text>
      <Text style={styles.heading}>Your Mood History</Text>

      {history.length === 0 ? (
        <Text style={styles.emptyText}>
          No moods saved yet.
        </Text>
      ) : (
        history.map((item) => {
          const moodInfo = MOODS.find(
            (m) => m.name === item.mood
          );

          return (
            <View key={item._id} style={styles.historyCard}>
              <Text style={styles.historyMood}>
                {moodInfo?.emoji || "💜"} {item.mood}
              </Text>

              <Text style={styles.historyNote}>
                {item.note || "No note added."}
              </Text>

              <Text style={styles.historyDate}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          );
        })
      )}

      {renderButton(
        "Back to Home",
        () => setScreen("home"),
        true
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {screen === "chat" ? (
        <ChatScreen
          token={token}
          onBack={() => setScreen("home")}
        />
      ) : screen === "login" || screen === "register" ? (
        renderAuthScreen()
      ) : screen === "home" ? (
        renderHomeScreen()
      ) : (
        renderHistoryScreen()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F5FF",
  },
  authContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  container: {
    padding: 22,
    paddingBottom: 40,
  },
  logo: {
    fontSize: 27,
    fontWeight: "800",
    color: "#7654B8",
    marginBottom: 8,
  },
  subtitle: {
    color: "#777",
    fontSize: 15,
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 22,
    elevation: 3,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#302447",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#F7F5FA",
    borderWidth: 1,
    borderColor: "#E8E0F1",
    padding: 15,
    borderRadius: 13,
    marginBottom: 14,
    color: "#302447",
    fontSize: 15,
  },
  button: {
    backgroundColor: "#8060C5",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#EEE7FA",
  },
  secondaryButtonText: {
    color: "#7654B8",
  },
  switchText: {
    color: "#7654B8",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  greeting: {
    fontSize: 17,
    color: "#655879",
    marginTop: 5,
  },
  logout: {
    color: "#C14F68",
    fontWeight: "700",
  },
  aiCard: {
    backgroundColor: "#8060C5",
    borderRadius: 22,
    padding: 22,
    marginBottom: 26,
  },
  aiTitle: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "800",
    marginBottom: 10,
  },
  aiText: {
    color: "#F5EEFF",
    fontSize: 15,
    lineHeight: 23,
  },
  comingSoon: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#302447",
    marginBottom: 14,
    marginTop: 10,
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  moodCard: {
    width: "48%",
    padding: 20,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 13,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedMood: {
    borderColor: "#8060C5",
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodName: {
    fontSize: 16,
    color: "#302447",
    fontWeight: "700",
  },
  noteInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  affirmationCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  affirmationTitle: {
    color: "#8060C5",
    fontWeight: "800",
    marginBottom: 10,
  },
  affirmation: {
    color: "#514663",
    fontSize: 15,
    lineHeight: 23,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 2,
  },
  historyMood: {
    fontSize: 19,
    fontWeight: "800",
    color: "#7654B8",
  },
  historyNote: {
    fontSize: 15,
    color: "#514663",
    marginTop: 10,
  },
  historyDate: {
    color: "#999",
    fontSize: 12,
    marginTop: 12,
  },
  emptyText: {
    color: "#777",
    fontSize: 15,
    marginVertical: 20,
  },
});
