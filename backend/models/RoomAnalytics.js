const mongoose = require("mongoose");

const roomAnalyticsSchema = new mongoose.Schema(
    {
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
            unique: true,
        },

        participationBalanceIndex: {
            type: Number,
            default: 0,
        },

        collaborationHealthScore: {
            type: Number,
            default: 0,
        },

        averageReasoningScore: {
            type: Number,
            default: 0,
        },

        totalMessages: {
            type: Number,
            default: 0,
        },

        stageEngagement: {
            hypothesis: { type: Number, default: 0 },
            discussion: { type: Number, default: 0 },
            challenge: { type: Number, default: 0 },
            consensus: { type: Number, default: 0 },
            reflection: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("RoomAnalytics", roomAnalyticsSchema);