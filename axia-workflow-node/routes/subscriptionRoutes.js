const express = require("express");
const router  = express.Router();

const {
  requestSubscription,
  getAllSubscriptions,
  updateSubscriptionStatus,
  approveSubscription,
  rejectSubscription,
  getPlans,
  deleteSubscription,
  checkExpiry,
  createPaymentIntent, 
  stripeWebhook
} = require("../controllers/subscriptionController");

const { protectorMW, permitMW } = require("../controllers/authController");

// ── Routes publiques ─────────────────────────────────────────────────────────
router.post("/request", requestSubscription);
router.get("/plans",    getPlans);
router.post("/create-payment-intent", createPaymentIntent);
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);
// ── Routes protégées superadmin ───────────────────────────────────────────────
router.use(protectorMW);
router.use(permitMW("superadmin"));

router.get("/",                   getAllSubscriptions);
router.patch("/:id/approve",      approveSubscription);
router.patch("/:id/reject",       rejectSubscription);
router.patch("/:id/status",       updateSubscriptionStatus);
router.delete("/:id",             deleteSubscription);

module.exports = router;