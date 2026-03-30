const Project = require("../models/Project");
const ApiEndpoint = require("../models/ApiEndpoint");
const {
  getProjectConnection,
  runCrudOperation,
} = require("../services/projectDatabaseService");

function matchPath(registered, incoming) {
  const keys = [];
  const pattern = registered.replace(/:([^/]+)/g, (_, key) => {
    keys.push(key);
    return "([^/]+)";
  });
  const regex = new RegExp(`^${pattern.replace(/\//g, "\\/")}$`);
  const match = incoming.match(regex);
  if (!match) return null;
  const params = {};
  keys.forEach((key, index) => {
    params[key] = match[index + 1];
  });
  return params;
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
    let matched = null;
    let pathParams = {};
    for (const endpoint of endpoints) {
      const params = matchPath(endpoint.path, incomingPath);
      if (params) {
        matched = endpoint;
        pathParams = params;
        break;
      }
    }

    if (!matched)
      return res.status(404).json({
        success: false,
        message: `No endpoint registered for ${method} ${incomingPath}`,
        hint: "Check your API Builder to verify the endpoint exists and is active.",
      });

    if (matched.mode === "crud") {
      if (!project.databaseUri) {
        return res.status(400).json({
          success: false,
          message: "Project database URI is missing. Add it in project settings.",
        });
      }

      const connection = await getProjectConnection(project.databaseUri);
      const documentId =
        pathParams.id ||
        pathParams.userId ||
        pathParams.itemId ||
        Object.values(pathParams)[0] ||
        null;
      const response = await runCrudOperation({
        connection,
        collectionName: matched.resource?.collection,
        method,
        id: documentId,
        body: req.body || {},
      });
      return res.status(matched.mockStatusCode || 200).json(response);
    }

    return res.status(matched.mockStatusCode || 200).json(matched.mockResponse);
  } catch (err) {
    next(err);
  }
};
