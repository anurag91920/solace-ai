import React, { useEffect, useState, useCallback } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
} from "react-native";

import {
  sendChatMessage,
  getChatHistory,
  getConversation,
  renameConversation,
  deleteConversation,
} from "../services/api";

const COLORS = {
  background: "#F8F5FF",
  white: "#FFFFFF",
  primary: "#8060C5",
  dark: "#40354F",
  muted: "#8B8298",
  lightPurple: "#EEE7FA",
  border: "#E8E0F2",
  userBubble: "#8060C5",
};

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "model",
  text: "Hi! I'm Lumi 💜 I'm here to listen. How are you feeling today?",
};

const SUGGESTIONS = [
  {
    emoji: "💬",
    title: "I want to talk",
    message: "I want to talk about what's on my mind.",
  },
  {
    emoji: "🌿",
    title: "Help me relax",
    message: "Can you help me relax with a calming exercise?",
  },
  {
    emoji: "✨",
    title: "Daily motivation",
    message: "Can you share some positive motivation for today?",
  },
  {
    emoji: "💜",
    title: "I'm feeling low",
    message: "I'm feeling low today. Can you listen to me?",
  },
];

export default function ChatScreen({ token, onBack }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [conversationId, setConversationId] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [renameModal, setRenameModal] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Load chat history
  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);

      const result = await getChatHistory(token);
      const conversations = result.conversations || [];

      setHistory(conversations);

      return conversations;
    } catch (error) {
      console.log("Chat history error:", error.message);
      return [];
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  // Open an existing conversation
  const openConversation = async (id) => {
    if (loading) return;

    try {
      setLoading(true);

      const result = await getConversation(id, token);
      const conversation = result.conversation;

      if (!conversation) {
        throw new Error("Conversation not found.");
      }

      setConversationId(conversation._id);

      setMessages(
        conversation.messages.map((item, index) => ({
          id: `${conversation._id}-${index}`,
          role: item.role,
          text: item.text,
        }))
      );

      setShowHistory(false);
      setInput("");
    } catch (error) {
      Alert.alert("Chat error", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load most recent conversation when screen opens
  useEffect(() => {
    let active = true;

    const initializeChat = async () => {
      try {
        const result = await getChatHistory(token);
        const conversations = result.conversations || [];

        if (!active) return;

        setHistory(conversations);

        if (conversations.length > 0) {
          const latest = await getConversation(
            conversations[0]._id,
            token
          );

          if (!active) return;

          const conversation = latest.conversation;

          setConversationId(conversation._id);

          setMessages(
            conversation.messages.map((item, index) => ({
              id: `${conversation._id}-${index}`,
              role: item.role,
              text: item.text,
            }))
          );
        }
      } catch (error) {
        console.log("Initialize chat error:", error.message);
      }
    };

    initializeChat();

    return () => {
      active = false;
    };
  }, [token]);

  // Start a new conversation
  const startNewChat = () => {
    setConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setShowHistory(false);
  };

  // Send message to Lumi
  const handleSend = async (quickMessage = null) => {
    const text = (quickMessage || input).trim();

    if (!text || loading) return;

    const currentConversationId = conversationId;

    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await sendChatMessage(
        text,
        currentConversationId,
        token
      );

      setConversationId(result.conversationId);

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-lumi`,
          role: "model",
          text: result.reply,
        },
      ]);

      await loadHistory();
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-error`,
          role: "model",
          text:
            "I'm sorry, I couldn't connect right now. Please try again in a moment.",
        },
      ]);

      console.log("Send message error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Open rename modal
  const openRenameModal = (conversation) => {
    setSelectedConversation(conversation);
    setRenameTitle(conversation.title || "");
    setRenameModal(true);
  };

  // Save renamed conversation
  const handleRename = async () => {
    const title = renameTitle.trim();

    if (!title) {
      Alert.alert("Missing title", "Please enter a chat title.");
      return;
    }

    if (!selectedConversation) return;

    try {
      setLoading(true);

      await renameConversation(
        selectedConversation._id,
        title,
        token
      );

      setHistory((previous) =>
        previous.map((item) =>
          item._id === selectedConversation._id
            ? { ...item, title }
            : item
        )
      );

      setRenameModal(false);
      setSelectedConversation(null);

      Alert.alert("Updated 💜", "Chat title changed successfully.");
    } catch (error) {
      Alert.alert("Rename failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete conversation
  const confirmDelete = (conversation) => {
    Alert.alert(
      "Delete conversation?",
      "This conversation and its messages will be permanently deleted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(conversation),
        },
      ]
    );
  };

  const handleDelete = async (conversation) => {
    try {
      setLoading(true);

      await deleteConversation(conversation._id, token);

      setHistory((previous) =>
        previous.filter((item) => item._id !== conversation._id)
      );

      if (conversationId === conversation._id) {
        setConversationId(null);
        setMessages([WELCOME_MESSAGE]);
      }

      Alert.alert("Deleted", "Conversation deleted successfully.");
    } catch (error) {
      Alert.alert("Delete failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render individual chat message
  const renderMessage = ({ item }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.modelRow,
        ]}
      >
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>💜</Text>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.modelBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.modelText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  // Header
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={onBack}
      >
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>💜 Lumi AI</Text>
        <Text style={styles.headerSubtitle}>
          Your wellness companion
        </Text>
        <View style={styles.onlineRow}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Here for you</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => {
          setShowHistory((previous) => !previous);
          loadHistory();
        }}
      >
        <Text style={styles.historyButton}>History</Text>
      </TouchableOpacity>
    </View>
  );

  // Previous conversations panel
  const renderHistory = () => (
    <View style={styles.historyPanel}>
      <View style={styles.historyHeader}>
        <View>
          <Text style={styles.historyTitle}>Your Conversations</Text>
          <Text style={styles.historySubtitle}>
            Continue where you left off
          </Text>
        </View>

        <TouchableOpacity
          style={styles.newChatButton}
          onPress={startNewChat}
        >
          <Text style={styles.newChatText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {historyLoading ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : history.length === 0 ? (
        <Text style={styles.emptyHistory}>
          No previous conversations yet.
        </Text>
      ) : (
        <ScrollView
          style={styles.historyList}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {history.map((item) => (
            <View
              key={item._id}
              style={[
                styles.historyItem,
                conversationId === item._id &&
                  styles.selectedHistoryItem,
              ]}
            >
              <TouchableOpacity
                style={styles.historyMain}
                onPress={() => openConversation(item._id)}
              >
                <Text style={styles.historyEmoji}>💬</Text>

                <View style={styles.historyInfo}>
                  <Text
                    style={styles.historyItemText}
                    numberOfLines={1}
                  >
                    {item.title || "New conversation"}
                  </Text>

                  <Text style={styles.historyDate}>
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openRenameModal(item)}
              >
                <Text style={styles.actionText}>✏️</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => confirmDelete(item)}
              >
                <Text style={styles.actionText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  // Suggested prompts
  const renderSuggestions = () => (
    <View style={styles.suggestionsContainer}>
      <Text style={styles.suggestionHeading}>
        What would you like to talk about?
      </Text>

      <View style={styles.suggestionGrid}>
        {SUGGESTIONS.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.suggestionCard}
            onPress={() => handleSend(item.message)}
            disabled={loading}
          >
            <Text style={styles.suggestionEmoji}>{item.emoji}</Text>
            <Text style={styles.suggestionText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        {renderHeader()}

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            A supportive space to talk. Lumi is an AI companion,
            not a substitute for professional mental health care.
          </Text>
        </View>

        {showHistory && renderHistory()}

        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {messages.length === 1 &&
          !conversationId &&
          !showHistory &&
          renderSuggestions()}

        {loading && (
          <View style={styles.typing}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.typingText}>Lumi is typing...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="Share what's on your mind..."
            placeholderTextColor="#A39AAF"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={4000}
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() || loading) && styles.disabledButton,
            ]}
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Take your time. You deserve kindness. 💜
        </Text>

        {/* Rename conversation modal */}
        <Modal
          visible={renameModal}
          transparent
          animationType="fade"
          onRequestClose={() => setRenameModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Rename Chat</Text>

              <Text style={styles.modalSubtitle}>
                Give this conversation a new title.
              </Text>

              <TextInput
                style={styles.renameInput}
                placeholder="Enter chat title"
                placeholderTextColor="#A39AAF"
                value={renameTitle}
                onChangeText={setRenameTitle}
                maxLength={100}
                autoFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setRenameModal(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleRename}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerButton: {
    minWidth: 55,
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
  },

  headerCenter: {
    alignItems: "center",
  },

  headerTitle: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },

  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#48B982",
    marginRight: 5,
  },

  onlineText: {
    fontSize: 10,
    color: "#48A477",
  },

  historyButton: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  notice: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.lightPurple,
  },

  noticeText: {
    color: "#655879",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  messageList: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    paddingBottom: 20,
    flexGrow: 1,
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
  },

  userRow: {
    justifyContent: "flex-end",
  },

  modelRow: {
    justifyContent: "flex-start",
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightPurple,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginBottom: 4,
  },

  avatarText: {
    fontSize: 16,
  },

  messageBubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
  },

  userBubble: {
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 4,
  },

  modelBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    elevation: 1,
  },

  messageText: {
    fontSize: 14,
    lineHeight: 22,
  },

  userText: {
    color: COLORS.white,
  },

  modelText: {
    color: COLORS.dark,
  },

  suggestionsContainer: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },

  suggestionHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 10,
  },

  suggestionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  suggestionCard: {
    width: "48%",
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 9,
  },

  suggestionEmoji: {
    fontSize: 20,
    marginBottom: 6,
  },

  suggestionText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  typing: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },

  typingText: {
    color: COLORS.primary,
    marginLeft: 8,
    fontSize: 12,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  chatInput: {
    flex: 1,
    backgroundColor: "#F7F5FA",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 110,
    color: COLORS.dark,
    fontSize: 14,
  },

  sendButton: {
    width: 45,
    height: 45,
    backgroundColor: COLORS.primary,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 9,
  },

  disabledButton: {
    opacity: 0.4,
  },

  sendText: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: "800",
  },

  footerText: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 10,
    paddingBottom: 5,
    backgroundColor: COLORS.white,
  },

  historyPanel: {
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 6,
    padding: 12,
    borderRadius: 16,
    maxHeight: 260,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  historyTitle: {
    fontSize: 15,
    color: COLORS.dark,
    fontWeight: "800",
  },

  historySubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 3,
  },

  newChatButton: {
    backgroundColor: COLORS.lightPurple,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },

  newChatText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 12,
  },

  historyList: {
    maxHeight: 190,
  },

  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F7FC",
    padding: 9,
    borderRadius: 12,
    marginBottom: 8,
  },

  selectedHistoryItem: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: "#F2ECFC",
  },

  historyMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  historyEmoji: {
    fontSize: 18,
    marginRight: 9,
  },

  historyInfo: {
    flex: 1,
  },

  historyItemText: {
    color: COLORS.dark,
    fontSize: 12,
    fontWeight: "700",
  },

  historyDate: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },

  actionButton: {
    padding: 7,
  },

  actionText: {
    fontSize: 15,
  },

  emptyHistory: {
    color: COLORS.muted,
    textAlign: "center",
    padding: 15,
    fontSize: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(25, 15, 40, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    padding: 22,
    borderRadius: 20,
  },

  modalTitle: {
    fontSize: 20,
    color: COLORS.dark,
    fontWeight: "800",
  },

  modalSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 6,
    marginBottom: 18,
  },

  renameInput: {
    backgroundColor: "#F7F5FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.dark,
    fontSize: 14,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 18,
  },

  cancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 10,
  },

  cancelText: {
    color: COLORS.muted,
    fontWeight: "700",
  },

  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 85,
    alignItems: "center",
  },

  saveText: {
    color: COLORS.white,
    fontWeight: "800",
  },
});