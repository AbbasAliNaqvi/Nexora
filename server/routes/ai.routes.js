const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/ai.controller");
const { protect } = require("../middleware/auth");

router.use(protect);
router.post("/generate-docs/:projectId", ctrl.generateDocs);
router.post("/analyze-health/:projectId", ctrl.analyzeHealth);
router.post("/chat", ctrl.chat);

module.exports = router;