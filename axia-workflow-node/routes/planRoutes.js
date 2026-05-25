const express = require("express");
const router  = express.Router();
const {
  getAllPlans, getAllPlansAdmin, getPlanById,
  createPlan, updatePlan, togglePlanStatus, deletePlan
} = require("../controllers/planController");
const { protectorMW, permitMW } = require("../controllers/authController");

// ✅ Routes PUBLIQUES (Home page)
router.get("/public", getAllPlans);

// ✅ Routes PROTÉGÉES superadmin
router.use(protectorMW);
router.use(permitMW("superadmin"));

router.route("/").get(getAllPlansAdmin).post(createPlan);
router.patch("/:id/toggle", togglePlanStatus);
router.route("/:id").get(getPlanById).patch(updatePlan).delete(deletePlan);

module.exports = router;