const mongoose = require("mongoose");

const usageLogSchema = new mongoose.Schema(
  {
    apiKey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiKey",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    endpoint: { type: String, required: true },
    method: { type: String, required: true, uppercase: true },
    statusCode: { type: Number, required: true },
    latencyMs: { type: Number, default: 0 },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

usageLogSchema.index({ project: 1, timestamp: -1 });
usageLogSchema.index({ apiKey: 1, timestamp: -1 });

usageLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);

module.exports = mongoose.model("UsageLog", usageLogSchema);