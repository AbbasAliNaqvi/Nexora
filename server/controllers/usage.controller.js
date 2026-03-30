const UsageLog = require("../models/UsageLog");
const Project = require("../models/Project");

const getUserProjectIds = async (userId) => {
  const projects = await Project.find({ owner: userId }).select("_id");
  return projects.map((p) => p._id);
};

const startOfUtcDay = (date = new Date()) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

const formatUtcDate = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

exports.getOverview = async (req, res, next) => {
  try {
    const projectIds = await getUserProjectIds(req.user._id);
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    const [totalToday, totalWeek, errorCount, latencyAgg, topEndpoints] =
      await Promise.all([
        UsageLog.countDocuments({
          project: { $in: projectIds },
          timestamp: { $gte: todayStart },
        }),
        UsageLog.countDocuments({
          project: { $in: projectIds },
          timestamp: { $gte: weekStart },
        }),
        UsageLog.countDocuments({
          project: { $in: projectIds },
          timestamp: { $gte: weekStart },
          statusCode: { $gte: 400 },
        }),
        UsageLog.aggregate([
          {
            $match: {
              project: { $in: projectIds },
              timestamp: { $gte: weekStart },
            },
          },
          { $group: { _id: null, avg: { $avg: "$latencyMs" } } },
        ]),
        UsageLog.aggregate([
          {
            $match: {
              project: { $in: projectIds },
              timestamp: { $gte: weekStart },
            },
          },
          { $group: { _id: "$endpoint", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
      ]);

    res.json({
      success: true,
      overview: {
        totalToday,
        totalWeek,
        errorCount,
        errorRate:
          totalWeek > 0 ? ((errorCount / totalWeek) * 100).toFixed(1) : "0.0",
        avgLatencyMs: latencyAgg[0]?.avg ? Math.round(latencyAgg[0].avg) : 0,
        topEndpoints,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getProjectUsage = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });

    const days = Math.min(parseInt(req.query.days, 10) || 7, 30);
    const since = startOfUtcDay();
    since.setUTCDate(since.getUTCDate() - (days - 1));

    const [dailyStats, endpointBreakdown, statusBreakdown] = await Promise.all([
      UsageLog.aggregate([
        { $match: { project: project._id, timestamp: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$timestamp",
                timezone: "UTC",
              },
            },
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
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      UsageLog.aggregate([
        { $match: { project: project._id, timestamp: { $gte: since } } },
        { $group: { _id: "$statusCode", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const filledDays = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setUTCDate(d.getUTCDate() + i);
      const label = formatUtcDate(d);
      const found = dailyStats.find((s) => s._id === label);
      filledDays.push({
        date: label,
        requests: found?.requests || 0,
        errors: found?.errors || 0,
        avgLatency: found ? Math.round(found.avgLatency) : 0,
      });
    }

    res.json({
      success: true,
      projectId: project._id,
      dailyStats: filledDays,
      endpointBreakdown,
      statusBreakdown,
    });
  } catch (err) {
    next(err);
  }
};

exports.getLogs = async (req, res, next) => {
  try {
    const { projectId, limit = 50, skip = 0 } = req.query;
    let filter = {};

    if (projectId) {
      const project = await Project.findOne({
        _id: projectId,
        owner: req.user._id,
      });
      if (!project)
        return res
          .status(404)
          .json({ success: false, message: "Project not found." });
      filter.project = project._id;
    } else {
      const ids = await getUserProjectIds(req.user._id);
      filter.project = { $in: ids };
    }

    const [logs, total] = await Promise.all([
      UsageLog.find(filter)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .populate("project", "name slug"),
      UsageLog.countDocuments(filter),
    ]);

    res.json({ success: true, total, logs });
  } catch (err) {
    next(err);
  }
};
