const mongoose = require("mongoose");

const TIER_LIMITS = { free: 100, pro: 10000, enterprise: Infinity };

const apiKeySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: "Default Key",
    },
    keyHash: {
      type: String,
      required: true,
      select: false,
    },
    keyPrefix: {
      type: String,
      required: true,
    },
    tier: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    requestCount: { type: Number, default: 0 },
    lastResetAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

apiKeySchema.virtual("dailyLimit").get(function () {
  return TIER_LIMITS[this.tier] ?? 100;
});

apiKeySchema.methods.resetIfNewDay = async function () {
  const now = new Date();
  const reset = new Date(this.lastResetAt);

  const sameDay =
    now.getUTCFullYear() === reset.getUTCFullYear() &&
    now.getUTCMonth() === reset.getUTCMonth() &&
    now.getUTCDate() === reset.getUTCDate();

  if (!sameDay) {
    this.requestCount = 0;
    this.lastResetAt = now;
    await this.save();
  }
};

module.exports = mongoose.model("ApiKey", apiKeySchema);
module.exports.TIER_LIMITS = TIER_LIMITS;