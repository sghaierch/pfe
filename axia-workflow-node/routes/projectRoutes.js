const express = require("express");
const router  = express.Router();
const { protectorMW, permitMW } = require("../controllers/authController");
const {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  archiveProject,
} = require("../controllers/projectController");

router.use(protectorMW);

router.get("/",       getAllProjects);
router.get("/:id",    getProject);
router.post("/",      permitMW("company_admin", "manager"), createProject);
router.patch("/:id",  permitMW("company_admin", "manager"), updateProject);
router.patch("/:id/archive", permitMW("company_admin"), archiveProject);

module.exports = router;