const Room = require("../models/room.model");
const { generateReflectionSummary } = require("../services/reflectionService");

exports.createRoom = async (req, res) => {
    try {
        const { name, problemStatement, maxParticipants } = req.body;

        if (!name || !problemStatement) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const room = await Room.create({
            name,
            problemStatement,
            createdBy: req.user._id,
            participants: [req.user._id],
            maxParticipants: maxParticipants || 5,
            stageHistory: [
                {
                    stage: "hypothesis",
                    startedAt: new Date(),
                },
            ],
        });

        res.status(201).json(room);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.joinRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (room.status !== "active") {
            return res.status(400).json({ message: "Room is not active" });
        }

        if (room.participants.length >= room.maxParticipants) {
            return res.status(400).json({ message: "Room is full" });
        }

        const alreadyJoined = room.participants.some(
            (id) => id.toString() === req.user._id.toString()
        );

        if (!alreadyJoined) {
            room.participants.push(req.user._id);
            await room.save();
        }

        res.json(room);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findById(roomId).populate(
            "participants",
            "name email"
        );

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        const isParticipant = room.participants.some(
            (user) => user._id.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json(room);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.listRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ status: "active" })
            .select("name currentStage status participants")
            .sort({ createdAt: -1 });

        res.json(rooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.changeStage = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { nextStage } = req.body;

        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (room.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only creator can change stage" });
        }

        const validStages = [
            "hypothesis",
            "discussion",
            "challenge",
            "consensus",
            "reflection",
        ];

        if (!validStages.includes(nextStage)) {
            return res.status(400).json({ message: "Invalid stage" });
        }

        const lastStage = room.stageHistory[room.stageHistory.length - 1];
        if (lastStage && !lastStage.endedAt) {
            lastStage.endedAt = new Date();
        }

        room.currentStage = nextStage;
        room.stageStartedAt = new Date();
        room.stageHistory.push({
            stage: nextStage,
            startedAt: new Date(),
        });

        await room.save();

        if (nextStage === "reflection") {
            generateReflectionSummary(room._id, req.io);
        }

        req.io.to(roomId).emit("stageUpdated", nextStage);

        res.json(room);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { status } = req.body;

        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        if (room.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only creator can update status" });
        }

        room.status = status;
        await room.save();

        res.json(room);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};