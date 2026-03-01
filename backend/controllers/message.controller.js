const Message = require("../models/message.model");
const Room = require("../models/room.model");
const { scoreMessage } = require("../services/reasoningScoringService");
const { updateRoomAnalytics } = require("../services/analyticsService");
const { runAIModeration } = require("../services/aiModerationService");

exports.sendMessage = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: "Message content required" });
        }

        const room = await Room.findById(roomId);
        console.log(room);

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (room.status !== "active") {
            return res.status(400).json({ message: "Room is not active" });
        }

        const isParticipant = room.participants.some(
            (id) => id.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "Not a participant" });
        }

        if (content.length < 2) {
            return res.status(400).json({ message: "Message too short" });
        }

        const message = await Message.create({
            room: roomId,
            sender: req.user._id,
            content,
            stage: room.currentStage,
        });

        
        scoreMessage(message._id, req.io);
        updateRoomAnalytics(roomId);

        
        const populatedMessage = await message.populate("sender", "name email");
        req.io.to(roomId).emit("newMessage", populatedMessage);

        const messageCount = await Message.countDocuments({
            room: roomId,
            messageType: "user",
        });

        if (messageCount % 3 === 0) {
            runAIModeration(roomId, req.io);
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getRoomMessages = async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        const isParticipant = room.participants.some(
            (id) => id.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "Access denied" });
        }

        const messages = await Message.find({ room: roomId })
            .populate("sender", "name email")
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};