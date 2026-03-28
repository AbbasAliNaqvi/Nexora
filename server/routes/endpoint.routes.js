const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/endpoint.controller");
const { protect } = require("../middleware/auth");

router.use(protect);
router.put("/:id", ctrl.updateEndpoint);
router.delete("/:id", ctrl.deleteEndpoint);

module.exports = router;