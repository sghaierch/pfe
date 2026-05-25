const express = require("express");
const router = express.Router();

const {
  getAllTenants,
  getTenantById,
  approveTenant,
  rejectTenant,
  suspendTenant,
  reactivateTenant,
  deleteTenant
} = require("../controllers/tenantController");

const { protectorMW, permitMW } = require("../controllers/authController");

// Toutes les routes sont protégées superadmin
router.use(protectorMW);
router.use(permitMW("superadmin"));

router.get("/", getAllTenants);
router.get("/:id", getTenantById);
router.patch("/:id/approve", approveTenant);
router.patch("/:id/reject", rejectTenant);
router.patch("/:id/suspend", suspendTenant);
router.patch("/:id/reactivate", reactivateTenant);
router.delete("/:id", deleteTenant);

module.exports = router;