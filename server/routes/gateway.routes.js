const express = require("express");
const router = express.Router();
const apiKeyAuth = require("../middleware/apiKeyAuth");
const ctrl = require("../controllers/gateway.controller");

router.all("/:projectSlug/*", apiKeyAuth, ctrl.handleRequest);
router.all("/:projectSlug", apiKeyAuth, ctrl.handleRequest);

module.exports = router;