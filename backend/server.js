
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Solace AI API 💜",
    status: "Running",
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/moods", require("./routes/moodRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Solace API running on port ${PORT}`);
  });
};

startServer();
