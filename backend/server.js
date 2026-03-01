const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db.config");

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URI,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/rooms", require("./routes/room.routes"));
app.use("/api/messages", require("./routes/message.routes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));

app.get("/", (req, res) => {
  res.send("API Running...");
});

const server = http.createServer(app);

const PORT = process.env.PORT || 4000;

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URI,
    credentials: true
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

module.exports = { io };

const Message = require("./models/message.model");
const Room = require("./models/room.model");
const { runAIModeration } = require("./services/aiModerationService");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const User = require("./models/user.model");
const { scoreMessage } = require("./services/reasoningScoringService");
const { updateRoomAnalytics } = require("./services/analyticsService");

io.use(async (socket, next) => {
  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    const token = cookies.jwt;

    if (!token) {
      return next(new Error("Not authenticated"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;

    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", async ({ roomId }) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("sendMessage", async ({ roomId, content }) => {
    try {
      const room = await Room.findById(roomId);

      if (!room || room.status !== "active") return;

      const message = await Message.create({
        room: roomId,
        sender: socket.user._id,
        content,
        stage: room.currentStage,
      });

      scoreMessage(message._id, io);

      updateRoomAnalytics(roomId);

      const populatedMessage = await message.populate("sender", "name email");

      io.to(roomId).emit("newMessage", populatedMessage);

      const messageCount = await Message.countDocuments({
        room: roomId,
        messageType: "user",
      });

      if (messageCount % 3 === 0) {
        await runAIModeration(roomId, io);
      }

    } catch (error) {
      console.error("Socket message error:", error);
    }
  });

  socket.on("stageChanged", ({ roomId, stage }) => {
    io.to(roomId).emit("stageUpdated", stage);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
