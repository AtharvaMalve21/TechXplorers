const Message = require("../models/message.model");
const Room = require("../models/room.model");
const { scoreMessage } = require("../services/reasoningScoringService");
const { updateRoomAnalytics } = require("../services/analyticsService");
const { runAIModeration } = require("../services/aiModerationService");
const { getIO } = require("../socket");

exports.sendMessage = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { content } = req.body;

        const message = await Message.create({
            room: roomId,
            sender: req.user._id,
            content,
            stage: req.body.stage || "discussion",
            messageType: "user",
        });

        const io = getIO();

        // 🔥 Run same intelligent logic as socket
        scoreMessage(message._id, io);
        updateRoomAnalytics(roomId);

        const messageCount = await Message.countDocuments({
            room: roomId,
            messageType: "user",
        });

        if (messageCount % 3 === 0) {
            await runAIModeration(roomId, io);
        }

        res.status(201).json(message);

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