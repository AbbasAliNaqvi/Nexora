const ApiEndpoint = require("../models/ApiEndpoint");
const Project = require("../models/Project");

const ownsProject = async (projectId, userId) =>
  Project.findOne({ _id: projectId, owner: userId });

exports.getEndpoints = async (req, res, next) => {
  try {
    const project = await ownsProject(req.params.id, req.user._id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });

    const endpoints = await ApiEndpoint.find({ project: project._id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, count: endpoints.length, endpoints });
  } catch (err) {
    next(err);
  }
};

exports.createEndpoint = async (req, res, next) => {
  try {
    const project = await ownsProject(req.params.id, req.user._id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });

    const {
      method,
      path,
      description,
      mockResponse,
      mockStatusCode,
      requestSchema,
      tags,
    } = req.body;
    const endpoint = await ApiEndpoint.create({
      project: project._id,
      method,
      path,
      description,
      mockResponse,
      mockStatusCode,
      requestSchema,
      tags,
    });
    res.status(201).json({ success: true, endpoint });
  } catch (err) {
    next(err);
  }
};

exports.updateEndpoint = async (req, res, next) => {
  try {
    const endpoint = await ApiEndpoint.findById(req.params.id).populate(
      "project",
    );
    if (!endpoint)
      return res
        .status(404)
        .json({ success: false, message: "Endpoint not found." });
    if (String(endpoint.project.owner) !== String(req.user._id))
      return res
        .status(403)
        .json({ success: false, message: "Not authorized." });

    const fields = [
      "method",
      "path",
      "description",
      "mockResponse",
      "mockStatusCode",
      "requestSchema",
      "tags",
      "isActive",
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) endpoint[f] = req.body[f];
    });
    await endpoint.save();

    res.json({ success: true, endpoint });
  } catch (err) {
    next(err);
  }
};

exports.deleteEndpoint = async (req, res, next) => {
  try {
    const endpoint = await ApiEndpoint.findById(req.params.id).populate(
      "project",
    );
    if (!endpoint)
      return res
        .status(404)
        .json({ success: false, message: "Endpoint not found." });
    if (String(endpoint.project.owner) !== String(req.user._id))
      return res
        .status(403)
        .json({ success: false, message: "Not authorized." });

    await endpoint.deleteOne();
    res.json({ success: true, message: "Endpoint deleted." });
  } catch (err) {
    next(err);
  }
};