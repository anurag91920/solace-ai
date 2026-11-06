
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const moods = [
  { emoji: "😊", name: "Happy" },
  { emoji: "😌", name: "Calm" },
  { emoji: "😔", name: "Sad" },
  { emoji: "😰", name: "Anxious" },
  { emoji: "😴", name: "Tired" },
];

export default function HomeScreen() {
  const [selectedMood, setSelectedMood] = useState("");

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>SOLACE ✦</Text>
          <Text style={styles.greeting}>Hello, Anurag 👋</Text>
          <Text style={styles.subtitle}>
            Take a moment for yourself.
          </Text>
        </View>
        <Text style={styles.avatar}>🌸</Text>
      </View>

      <LinearGradient
        colors={["#BCA6F5", "#8D73D9"]}
        style={styles.hero}
      >
        <Text style={styles.tag}>YOUR AI COMPANION</Text>
        <Text style={styles.heroTitle}>
          You deserve a{"\n"}moment of peace.
        </Text>
        <Text style={styles.heroText}>
          I'm Lumi. I'm here to listen whenever you need.
        </Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>
            💬 Talk to Lumi
          </Text>
        </TouchableOpacity>
        <Text style={styles.cloud}>☁️✨</Text>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.title}>
          How are you feeling today?
        </Text>
        <Text style={styles.subtitle}>
          Your feelings matter. Check in with yourself.
        </Text>

        <View style={styles.moods}>
          {moods.map((mood) => (
            <TouchableOpacity
              key={mood.name}
              onPress={() => setSelectedMood(mood.name)}
              style={[
                styles.mood,
                selectedMood === mood.name &&
                  styles.selectedMood,
              ]}
            >
              <Text style={styles.emoji}>{mood.emoji}</Text>
              <Text style={styles.moodName}>{mood.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedMood ? (
          <Text style={styles.response}>
            You're feeling {selectedMood}. Thank you for checking in 💜
          </Text>
        ) : null}
      </View>

      <View style={styles.affirmation}>
        <Text style={styles.tag}>✨ TODAY'S AFFIRMATION</Text>
        <Text style={styles.quote}>
          "I am allowed to grow at my own pace."
        </Text>
        <Text style={styles.subtitle}>
          A gentle reminder for you 💜
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Your daily wellness</Text>

        <View style={styles.activity}>
          <Text style={styles.activityEmoji}>🌿</Text>
          <View>
            <Text style={styles.activityTitle}>
              Mindful Breathing
            </Text>
            <Text style={styles.subtitle}>
              Find calm in just 2 minutes.
            </Text>
          </View>
        </View>

        <View style={styles.activity}>
          <Text style={styles.activityEmoji}>💗</Text>
          <View>
            <Text style={styles.activityTitle}>
              Daily Reflection
            </Text>
            <Text style={styles.subtitle}>
              Connect with your thoughts.
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>
        Made with love, for your wellbeing 💜
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F5FF",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 22,
    paddingBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    color: "#9276D5",
    fontWeight: "800",
    letterSpacing: 3,
  },
  greeting: {
    fontSize: 25,
    fontWeight: "800",
    color: "#30264B",
    marginTop: 12,
  },
  subtitle: {
    color: "#9189A5",
    fontSize: 12,
    marginTop: 6,
  },
  avatar: {
    fontSize: 35,
    backgroundColor: "#EAE1FF",
    padding: 10,
    borderRadius: 18,
  },
  hero: {
    marginHorizontal: 20,
    padding: 23,
    borderRadius: 25,
    minHeight: 225,
  },
  tag: {
    color: "#9276D5",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1,
  },
  heroTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 15,
  },
  heroText: {
    color: "white",
    fontSize: 12,
    marginTop: 10,
  },
  button: {
    backgroundColor: "white",
    padding: 13,
    borderRadius: 14,
    alignSelf: "flex-start",
    marginTop: 18,
  },
  buttonText: {
    color: "#8065C7",
    fontWeight: "700",
  },
  cloud: {
    position: "absolute",
    right: 18,
    bottom: 40,
    fontSize: 35,
  },
  section: {
    marginTop: 28,
    paddingHorizontal: 21,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    color: "#34294D",
  },
  moods: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  mood: {
    backgroundColor: "white",
    width: 59,
    height: 76,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F0EAFB",
  },
  selectedMood: {
    backgroundColor: "#EAE1FF",
    borderColor: "#9276D5",
    borderWidth: 2,
  },
  emoji: {
    fontSize: 23,
  },
  moodName: {
    color: "#706782",
    fontSize: 9,
    marginTop: 6,
  },
  response: {
    color: "#8065C7",
    fontSize: 12,
    marginTop: 12,
  },
  affirmation: {
    backgroundColor: "#EEE8FC",
    marginHorizontal: 20,
    marginTop: 28,
    padding: 20,
    borderRadius: 22,
  },
  quote: {
    fontSize: 19,
    fontWeight: "700",
    color: "#493967",
    marginTop: 14,
    marginBottom: 8,
  },
  activity: {
    backgroundColor: "white",
    padding: 17,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 14,
  },
  activityEmoji: {
    fontSize: 28,
  },
  activityTitle: {
    color: "#45365F",
    fontWeight: "700",
    fontSize: 14,
  },
  footer: {
    textAlign: "center",
    marginVertical: 30,
    color: "#AAA0BC",
  },
});
