const Project = require("../models/Project");
const ApiEndpoint = require("../models/ApiEndpoint");
const UsageLog = require("../models/UsageLog");
const groqService = require("../services/groqService");

exports.generateDocs = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      owner: req.user._id,
    });
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });

    const endpoints = await ApiEndpoint.find({
      project: project._id,
      isActive: true,
    });
    if (endpoints.length === 0)
      return res
        .status(400)
        .json({
          success: false,
          message:
            "No active endpoints found. Add endpoints in the API Builder first.",
        });

    const markdown = await groqService.generateDocs(endpoints, project.name);
    res.json({ success: true, markdown });
  } catch (err) {
    next(err);
  }
};

exports.analyzeHealth = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      owner: req.user._id,
    });
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [dailyStats, endpointBreakdown, statusBreakdown] = await Promise.all([
      UsageLog.aggregate([
        { $match: { project: project._id, timestamp: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            requests: { $sum: 1 },
            errors: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
            avgLatency: { $avg: "$latencyMs" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      UsageLog.aggregate([
        { $match: { project: project._id, timestamp: { $gte: since } } },
        {
          $group: {
            _id: { endpoint: "$endpoint", method: "$method" },
            count: { $sum: 1 },
            errors: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      UsageLog.aggregate([
        { $match: { project: project._id, timestamp: { $gte: since } } },
        { $group: { _id: "$statusCode", count: { $sum: 1 } } },
      ]),
    ]);

    const report = await groqService.analyzeHealth(
      { dailyStats, endpointBreakdown, statusBreakdown },
      project.name,
    );
    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

exports.chat = async (req, res, next) => {
  try {
    const { messages, projectId } = req.body;

    if (!Array.isArray(messages) || messages.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "messages array is required." });

    let projectContext = null;
    if (projectId) {
      const project = await Project.findOne({
        _id: projectId,
        owner: req.user._id,
      });
      if (project) {
        const endpoints = await ApiEndpoint.find({
          project: project._id,
          isActive: true,
        })
          .select("method path description")
          .limit(20);
        projectContext = { name: project.name, slug: project.slug, endpoints };
      }
    }

    const reply = await groqService.chatAssistant(messages, projectContext);
    res.json({ success: true, reply });
  } catch (err) {
    next(err);
  }
};