const crypto = require("crypto");
const { nanoid } = require("nanoid");
const ApiKey = require("../models/ApiKey");
const Project = require("../models/Project");

const KEY_PER_PLAN = { free: 3, pro: 20, enterprise: Infinity };

const ownsProject = (id, userId) => Project.findOne({ _id: id, owner: userId });

exports.getKeys = async (req, res, next) => {
  try {
    const project = await ownsProject(req.params.id, req.user._id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    const keys = await ApiKey.find({ project: project._id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, count: keys.length, keys });
  } catch (err) {
    next(err);
  }
};

exports.createKey = async (req, res, next) => {
  try {
    const project = await ownsProject(req.params.id, req.user._id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });

    const keyCount = await ApiKey.countDocuments({
      project: project._id,
      isActive: true,
    });
    const limit = KEY_PER_PLAN[req.user.subscription] ?? 3;
    if (limit !== Infinity && keyCount >= limit)
      return res.status(403).json({
        success: false,
        message: `Your ${req.user.subscription} plan allows up to ${limit} active keys per project.`,
      });

    const rawKey = `nxr_live_${nanoid(32)}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.substring(0, 16) + "...";

    const apiKey = await ApiKey.create({
      project: project._id,
      owner: req.user._id,
      name: req.body.name || "Default Key",
      tier: req.body.tier || req.user.subscription,
      expiresAt: req.body.expiresAt || null,
      keyHash,
      keyPrefix,
    });

    res.status(201).json({
      success: true,
      message: "Store this key securely, it will not be shown again.",
      rawKey,
      key: apiKey,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateKey = async (req, res, next) => {
  try {
    const { name, tier, expiresAt } = req.body;
    const key = await ApiKey.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      {
        ...(name !== undefined && { name }),
        ...(tier !== undefined && { tier }),
        ...(expiresAt !== undefined && { expiresAt }),
      },
      { new: true, runValidators: true },
    );
    if (!key)
      return res
        .status(404)
        .json({ success: false, message: "API key not found." });
    res.json({ success: true, key });
  } catch (err) {
    next(err);
  }
};

exports.revokeKey = async (req, res, next) => {
  try {
    const key = await ApiKey.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isActive: false },
      { new: true },
    );
    if (!key)
      return res
        .status(404)
        .json({ success: false, message: "API key not found." });
    res.json({ success: true, message: "API key revoked." });
  } catch (err) {
    next(err);
  }
};

exports.rotateKey = async (req, res, next) => {
  try {
    const key = await ApiKey.findOne({
      _id: req.params.id,
      owner: req.user._id,
    }).select("+keyHash");
    if (!key)
      return res
        .status(404)
        .json({ success: false, message: "API key not found." });

    const rawKey = `nxr_live_${nanoid(32)}`;
    key.keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    key.keyPrefix = rawKey.substring(0, 16) + "...";
    key.requestCount = 0;
    key.lastResetAt = new Date();
    await key.save();

    res.json({
      success: true,
      message: "Key rotated. Store the new key, it will not be shown again.",
      rawKey,
      key,
    });
  } catch (err) {
    next(err);
  }
};