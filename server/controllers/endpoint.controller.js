const ApiEndpoint = require("../models/ApiEndpoint");
const Project = require("../models/Project");

const ownsProject = async (projectId, userId) =>
  Project.findOne({ _id: projectId, owner: userId });

const FIELD_TYPES = new Set(["text", "email", "password", "number", "boolean"]);

const normalizeResourceName = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "");

const normalizeFieldKey = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeFields = (fields = []) =>
  Array.isArray(fields)
    ? fields
        .map((field) => ({
          key: normalizeFieldKey(field?.key || field?.name || ""),
          type: FIELD_TYPES.has(field?.type) ? field.type : "text",
          required: Boolean(field?.required),
        }))
        .filter((field) => field.key)
    : [];

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
      mode,
      resource,
      mockResponse,
      mockStatusCode,
      requestSchema,
      tags,
    } = req.body;

    const endpointData = {
      project: project._id,
      method,
      path,
      description,
      mode,
      resource,
      mockResponse,
      mockStatusCode,
      requestSchema,
      tags,
    };

    if (mode === "crud") {
      const collection = normalizeResourceName(resource?.collection || path?.split("/")[1]);
      const fields = normalizeFields(resource?.fields);

      if (!collection) {
        return res.status(400).json({
          success: false,
          message: "CRUD endpoints require a valid resource collection.",
        });
      }

      endpointData.resource = { collection, fields };
      endpointData.requestSchema = {
        ...(requestSchema || {}),
        fields,
      };
    }

    const endpoint = await ApiEndpoint.create({
      ...endpointData,
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
      "mode",
      "resource",
      "mockResponse",
      "mockStatusCode",
      "requestSchema",
      "tags",
      "isActive",
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) endpoint[f] = req.body[f];
    });

    if (endpoint.mode === "crud") {
      endpoint.resource = {
        collection: normalizeResourceName(
          endpoint.resource?.collection || endpoint.path?.split("/")[1],
        ),
        fields: normalizeFields(endpoint.resource?.fields),
      };
      endpoint.requestSchema = {
        ...(endpoint.requestSchema || {}),
        fields: endpoint.resource.fields,
      };
    }

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
