const { validationResult } = require("express-validator");
const Project = require("../models/Project");
const ApiEndpoint = require("../models/ApiEndpoint");
const ApiKey = require("../models/ApiKey");

const PLAN_LIMITS = { free: 2, pro: 10, enterprise: Infinity };

exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ owner: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    next(err);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const count = await Project.countDocuments({ owner: req.user._id });
    const limit = PLAN_LIMITS[req.user.subscription] || 2;
    if (count >= limit)
      return res.status(403).json({
        success: false,
        message: `Your ${req.user.subscription} plan allows up to ${limit} projects. Upgrade to create more.`,
      });

    const { name, description, baseUrl, databaseUri, tags } = req.body;
    const project = await Project.create({
      owner: req.user._id,
      name,
      description,
      baseUrl,
      databaseUri,
      tags,
    });
    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });

    const [endpointCount, keyCount] = await Promise.all([
      ApiEndpoint.countDocuments({ project: project._id }),
      ApiKey
        ? ApiKey.countDocuments({ project: project._id, isActive: true })
        : Promise.resolve(0),
    ]);

    res.json({ success: true, project, meta: { endpointCount, keyCount } });
  } catch (err) {
    next(err);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const {
      name,
      description,
      baseUrl,
      databaseUri,
      tags,
      rateLimitOverride,
      isActive,
    } =
      req.body;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      {
        name,
        description,
        baseUrl,
        databaseUri,
        tags,
        rateLimitOverride,
        isActive,
      },
      { new: true, runValidators: true },
    );
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });

    await Promise.all([
      ApiEndpoint.deleteMany({ project: project._id }),
      ApiKey ? ApiKey.deleteMany({ project: project._id }) : Promise.resolve(),
    ]);

    res.json({
      success: true,
      message: "Project and all associated data deleted.",
    });
  } catch (err) {
    next(err);
  }
};
