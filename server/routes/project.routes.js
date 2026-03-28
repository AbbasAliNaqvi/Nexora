const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const pCtrl = require("../controllers/project.controller");
const eCtrl = require("../controllers/endpoint.controller");
const { protect } = require("../middleware/auth");

router.use(protect);


router.get("/", pCtrl.getProjects);
router.post(
  "/",
  [body("name").trim().notEmpty().withMessage("Project name is required")],
  pCtrl.createProject,
);
router.get("/:id", pCtrl.getProject);
router.put("/:id", pCtrl.updateProject);
router.delete("/:id", pCtrl.deleteProject);

router.get("/:id/endpoints", eCtrl.getEndpoints);
router.post(
  "/:id/endpoints",
  [
    body("method")
      .isIn(["GET", "POST", "PUT", "PATCH", "DELETE"])
      .withMessage("Valid HTTP method required"),
    body("path").trim().notEmpty().withMessage("Endpoint path is required"),
  ],
  eCtrl.createEndpoint,
);

module.exports = router;