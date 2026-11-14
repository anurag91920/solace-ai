
const API_URL = "https://solace-ai-47sj.onrender.com";


async function request(endpoint, method = "GET", body = null, token = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: "Invalid server response" };
  }

  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.status = response.status;
    throw error;
  }

  return data;
}

export const registerUser = (name, email, password) =>
  request("/api/auth/register", "POST", { name, email, password });

export const loginUser = (email, password) =>
  request("/api/auth/login", "POST", { email, password });


// Verify saved login token
export const getCurrentUser = (token) =>
  request("/api/auth/me", "GET", null, token);


export const saveMood = (mood, note, token) =>
  request("/api/moods", "POST", { mood, note }, token);

export const getMoodHistory = (token) =>
  request("/api/moods", "GET", null, token);

// Lumi chat
export const sendChatMessage = (message, conversationId, token) =>
  request(
    "/api/chat",
    "POST",
    { message, conversationId },
    token
  );

export const getChatHistory = (token) =>
  request("/api/chat/history", "GET", null, token);

export const getConversation = (id, token) =>
  request(`/api/chat/${id}`, "GET", null, token);

export const getProgress = (token, month, year) =>
  request(
    `/api/progress?month=${month}&year=${year}`,
    "GET",
    null,
    token
  );

  export const renameConversation = (id, title, token) =>
  request(
    `/api/chat/${id}`,
    "PATCH",
    { title },
    token
  );

export const deleteConversation = (id, token) =>
  request(
    `/api/chat/${id}`,
    "DELETE",
    null,
    token
  );