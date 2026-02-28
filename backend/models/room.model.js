const mongoose = require("mongoose");

const stageHistorySchema = new mongoose.Schema({
  stage: {
    type: String,
    enum: ["hypothesis", "discussion", "challenge", "consensus", "reflection"],
  },
  startedAt: Date,
  endedAt: Date,
});

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    problemStatement: {
      type: String,
      required: true,
      minlength: 10,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    currentStage: {
      type: String,
      enum: ["hypothesis", "discussion", "challenge", "consensus", "reflection"],
      default: "hypothesis",
    },

    stageStartedAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },

    finalConsensus: {
      type: String,
    },

    maxParticipants: {
      type: Number,
      default: 5,
    },

    aiEnabled: {
      type: Boolean,
      default: true,
    },

    stageHistory: [stageHistorySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);