const express = require("express");
const router  = express.Router();
const { protectorMW, permitMW } = require("../controllers/authController");
const {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

router.use(protectorMW);

router.get("/",       getAllProjects);
router.get("/:id",    getProject);
router.post("/",      permitMW("company_admin", "manager"), createProject);
router.patch("/:id",  permitMW("company_admin", "manager"), updateProject);
router.delete("/:id", permitMW("company_admin"), deleteProject);

module.exports = router;