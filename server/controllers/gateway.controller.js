const Project = require("../models/Project");
const ApiEndpoint = require("../models/ApiEndpoint");

function matchPath(registered, incoming) {
  const pattern = registered.replace(/:[^/]+/g, "[^/]+").replace(/\//g, "\\/");
  return new RegExp(`^${pattern}$`).test(incoming);
}

exports.handleRequest = async (req, res, next) => {
  try {
    const { projectSlug } = req.params;
    const incomingPath = "/" + (req.params[0] || "");
    const method = req.method.toUpperCase();
    const project = await Project.findOne({
      slug: projectSlug,
      isActive: true,
    });
    if (!project)
      return res.status(404).json({
        success: false,
        message: `Project '${projectSlug}' not found or inactive.`,
      });

    if (String(req.apiKey.project) !== String(project._id))
      return res.status(403).json({
        success: false,
        message: "This API key is not authorized for the requested project.",
      });

    const endpoints = await ApiEndpoint.find({
      project: project._id,
      method,
      isActive: true,
    });
    const matched = endpoints.find((ep) => matchPath(ep.path, incomingPath));

    if (!matched)
      return res.status(404).json({
        success: false,
        message: `No endpoint registered for ${method} ${incomingPath}`,
        hint: "Check your API Builder to verify the endpoint exists and is active.",
      });

    return res.status(matched.mockStatusCode || 200).json(matched.mockResponse);
  } catch (err) {
    next(err);
  }
};