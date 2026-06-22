const express = require("express");
const router = express.Router();

const {
  getAllTenants,
  getTenantById,
  approveTenant,
  rejectTenant,
  suspendTenant,
  reactivateTenant,
  deleteTenant,
  changeTenantPlan,
  updateTenantLimits,
  resendCredentials,    // ✅ nouveau
  renewSubscription,    // ✅ nouveau
} = require("../controllers/tenantController");

const { protectorMW, permitMW } = require("../controllers/authController");

// Toutes les routes sont protégées superadmin
router.use(protectorMW);
router.use(permitMW("superadmin"));

router.get("/",                   getAllTenants);
router.get("/:id",                getTenantById);
router.patch("/:id/approve",      approveTenant);
router.patch("/:id/reject",       rejectTenant);
router.patch("/:id/suspend",      suspendTenant);
router.patch("/:id/reactivate",   reactivateTenant);
router.patch("/:id/plan",         changeTenantPlan);
router.patch("/:id/limits",       updateTenantLimits);
router.post("/:id/resend-credentials", resendCredentials); // ✅ nouveau
router.patch("/:id/renew",        renewSubscription);      // ✅ nouveau
router.delete("/:id",             deleteTenant);

module.exports = router;