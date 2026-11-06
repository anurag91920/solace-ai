
import React, { useEffect, useState } from "react";
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
} from "react-native";

import {
  sendChatMessage,
  getChatHistory,
  getConversation,
} from "../services/api";

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "model",
  text: "Hi! I'm Lumi 💜 I'm here to listen. How are you feeling today?",
};

export default function ChatScreen({ token, onBack }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [conversationId, setConversationId] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadHistory = async () => {
    try {
      const result = await getChatHistory(token);
      setHistory(result.conversations || []);
      return result.conversations || [];
    } catch (error) {
      console.log("History error:", error.message);
      return [];
    }
  };

  useEffect(() => {
    const loadPreviousChat = async () => {
      const conversations = await loadHistory();

      if (conversations.length > 0) {
        await openConversation(conversations[0]._id);
      }
    };

    loadPreviousChat();
  }, []);

  const openConversation = async (id) => {
    try {
      setLoading(true);

      const result = await getConversation(id, token);
      const conversation = result.conversation;

      setConversationId(conversation._id);

      setMessages(
        conversation.messages.map((item, index) => ({
          id: `${conversation._id}-${index}`,
          role: item.role,
          text: item.text,
        }))
      );

      setShowHistory(false);
    } catch (error) {
      console.log("Open conversation error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setShowHistory(false);
  };

  const handleSend = async (quickMessage = null) => {
    const text = (quickMessage || input).trim();

    if (!text || loading) return;

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
        conversationId,
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
          text: `Sorry, I couldn't connect right now. ${error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.modelRow,
        ]}
      >
        {!isUser && <Text style={styles.avatar}>💜</Text>}

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.title}>💜 Lumi AI</Text>
          <Text style={styles.subtitle}>Your wellness companion</Text>
        </View>

        <TouchableOpacity onPress={() => setShowHistory(!showHistory)}>
          <Text style={styles.historyButton}>History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          A supportive space to talk. Lumi is not a substitute for
          professional mental health care.
        </Text>
      </View>

      {showHistory && (
        <View style={styles.historyPanel}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Previous Chats</Text>

            <TouchableOpacity onPress={startNewChat}>
              <Text style={styles.newChatButton}>+ New Chat</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.historyList}>
            {history.length === 0 ? (
              <Text style={styles.emptyHistory}>
                No previous conversations yet.
              </Text>
            ) : (
              history.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={[
                    styles.historyItem,
                    conversationId === item._id &&
                      styles.selectedHistoryItem,
                  ]}
                  onPress={() => openConversation(item._id)}
                >
                  <Text style={styles.historyItemText} numberOfLines={1}>
                    {item.title || "Conversation"}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        keyboardShouldPersistTaps="handled"
      />

      {messages.length === 1 && !conversationId && (
        <View style={styles.quickReplyContainer}>
          <Text style={styles.quickReplyTitle}>How would you like to start?</Text>

          <TouchableOpacity
            style={styles.quickReply}
            onPress={() => handleSend("I want to talk about what's on my mind.")}
            disabled={loading}
          >
            <Text style={styles.quickReplyText}>💬 I want to talk</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickReply}
            onPress={() =>
              handleSend("Please guide me through a quick breathing exercise.")
            }
            disabled={loading}
          >
            <Text style={styles.quickReplyText}>
              🌿 Try breathing exercise
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.typing}>
          <ActivityIndicator color="#8060C5" />
          <Text style={styles.typingText}>Lumi is typing...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.chatInput}
          placeholder="Share what's on your mind..."
          placeholderTextColor="#999"
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F5FF",
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE7F7",
  },
  backButton: {
    color: "#8060C5",
    fontSize: 16,
    fontWeight: "700",
  },
  headerCenter: {
    alignItems: "center",
  },
  title: {
    color: "#7654B8",
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    color: "#888",
    fontSize: 12,
    marginTop: 3,
  },
  historyButton: {
    color: "#8060C5",
    fontWeight: "700",
    fontSize: 13,
  },
  notice: {
    margin: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#EEE7FA",
  },
  noticeText: {
    color: "#655879",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  messageList: {
    padding: 14,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 15,
  },
  userRow: {
    justifyContent: "flex-end",
  },
  modelRow: {
    justifyContent: "flex-start",
  },
  avatar: {
    fontSize: 22,
    marginRight: 7,
    marginBottom: 5,
  },
  messageBubble: {
    maxWidth: "82%",
    padding: 13,
    borderRadius: 17,
  },
  userBubble: {
    backgroundColor: "#8060C5",
    borderBottomRightRadius: 4,
  },
  modelBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: "#FFFFFF",
  },
  modelText: {
    color: "#40354F",
  },
  quickReplyContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  quickReplyTitle: {
    color: "#655879",
    fontSize: 13,
    marginBottom: 8,
  },
  quickReply: {
    borderWidth: 1,
    borderColor: "#B9A5DD",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 11,
    marginBottom: 7,
  },
  quickReplyText: {
    color: "#7654B8",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  typing: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  typingText: {
    color: "#8060C5",
    marginLeft: 8,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEE7F7",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#F7F5FA",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 110,
    color: "#302447",
    fontSize: 15,
  },
  sendButton: {
    width: 46,
    height: 46,
    backgroundColor: "#8060C5",
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 9,
  },
  disabledButton: {
    opacity: 0.45,
  },
  sendText: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
  },
  historyPanel: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    maxHeight: 220,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  historyTitle: {
    color: "#40354F",
    fontWeight: "700",
  },
  newChatButton: {
    color: "#8060C5",
    fontWeight: "700",
  },
  historyList: {
    maxHeight: 160,
  },
  historyItem: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F8F5FF",
    marginBottom: 7,
  },
  selectedHistoryItem: {
    borderWidth: 1,
    borderColor: "#8060C5",
  },
  historyItemText: {
    color: "#40354F",
    fontSize: 14,
  },
  historyDate: {
    color: "#888",
    fontSize: 11,
    marginTop: 4,
  },
  emptyHistory: {
    color: "#888",
    padding: 10,
  },
});
