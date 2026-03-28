const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/usage.controller");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/overview", ctrl.getOverview);
router.get("/project/:id", ctrl.getProjectUsage);
router.get("/logs", ctrl.getLogs);

module.exports = router;