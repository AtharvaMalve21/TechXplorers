const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },

    stage: {
      type: String,
      enum: ["hypothesis", "discussion", "challenge", "consensus", "reflection"],
      required: true,
    },

    messageType: {
      type: String,
      enum: ["user", "ai"],
      default: "user",
    },

    reasoningScore: {
      type: Number,
      default: 0,
    },

    relevanceScore: {
      type: Number,
      default: 0,
    },

    constructivenessScore: {
      type: Number,
      default: 0,
    },
    
    logicalDepth: {
      type: Number,
      default: 0,
    },

    flaggedSpam: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);