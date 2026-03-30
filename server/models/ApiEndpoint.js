const mongoose = require("mongoose");

const apiEndpointSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      required: true,
    },
    path: {
      type: String,
      required: [true, "Endpoint path is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    mode: {
      type: String,
      enum: ["mock", "crud"],
      default: "mock",
    },
    resource: {
      collection: {
        type: String,
        default: null,
      },
      fields: {
        type: mongoose.Schema.Types.Mixed,
        default: [],
      },
    },
    mockResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: { message: "OK", data: null },
    },
    mockStatusCode: {
      type: Number,
      default: 200,
    },
    requestSchema: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

apiEndpointSchema.index({ project: 1, method: 1, path: 1 }, { unique: true });

module.exports = mongoose.model("ApiEndpoint", apiEndpointSchema);
