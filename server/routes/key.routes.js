const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/key.controller");
const { protect } = require("../middleware/auth");

router.use(protect);
router.put("/:id", ctrl.updateKey);
router.delete("/:id", ctrl.revokeKey);
router.post("/:id/rotate", ctrl.rotateKey);

module.exports = router;