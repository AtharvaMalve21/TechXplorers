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

const Message = require("./models/message.model");
const Room = require("./models/room.model");

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join Room
  socket.on("joinRoom", async ({ roomId }) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Send Message (Real-Time)
  socket.on("sendMessage", async ({ roomId, userId, content }) => {
    try {
      const room = await Room.findById(roomId);

      if (!room || room.status !== "active") return;

      const message = await Message.create({
        room: roomId,
        sender: userId,
        content,
        stage: room.currentStage,
      });

      const populatedMessage = await message.populate("sender", "name email");

      // Broadcast to room
      io.to(roomId).emit("newMessage", populatedMessage);

    } catch (error) {
      console.error("Socket message error:", error);
    }
  });

  // Stage Change Broadcast
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