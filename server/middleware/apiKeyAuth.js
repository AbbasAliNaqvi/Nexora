const crypto   = require('crypto');
const ApiKey   = require('../models/ApiKey');
const UsageLog = require('../models/UsageLog');

const apiKeyAuth = async (req, res, next) => {
  const rawKey = req.headers['x-api-key'] || req.query.api_key;

  if (!rawKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required. Pass via X-Api-Key header or ?api_key= query parameter.',
    });
  }

  try {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const apiKey  = await ApiKey.findOne({ keyHash, isActive: true }).select('+keyHash');

    if (!apiKey)
      return res.status(401).json({ success: false, message: 'Invalid or revoked API key.' });

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt)
      return res.status(401).json({ success: false, message: 'API key has expired.' });

    await apiKey.resetIfNewDay();

    const limit = apiKey.dailyLimit;
    if (limit !== Infinity && apiKey.requestCount >= limit) {
      return res.status(429).json({
        success:  false,
        message:  'Daily rate limit exceeded.',
        limit,
        used:     apiKey.requestCount,
        resetAt:  'midnight UTC',
      });
    }

    // Increment usage
    apiKey.requestCount += 1;
    apiKey.lastUsedAt    = new Date();
    await apiKey.save();

    req.apiKey    = apiKey;
    req.startTime = Date.now();

    // Log after response is sent
    res.on('finish', async () => {
      try {
        await UsageLog.create({
          apiKey:     apiKey._id,
          project:    apiKey.project,
          endpoint:   req.path,
          method:     req.method,
          statusCode: res.statusCode,
          latencyMs:  Date.now() - req.startTime,
          ipAddress:  req.ip,
          userAgent:  req.get('user-agent'),
        });
      } catch (e) {
        console.error('Usage log error:', e.message);
      }
    });

    next();
  } catch (err) { next(err); }
};

module.exports = apiKeyAuth;