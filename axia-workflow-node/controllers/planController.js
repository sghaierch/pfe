const Plan = require("../models/planModel");

// GET tous les plans (public)
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ order: 1, price: 1 });
    res.status(200).json({ status: "success", results: plans.length, data: { plans } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// GET tous les plans (admin — y compris inactifs)
exports.getAllPlansAdmin = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ order: 1, price: 1 });
    res.status(200).json({ status: "success", results: plans.length, data: { plans } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// GET un plan par ID
exports.getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ status: "fail", message: "Plan non trouvé" });
    res.status(200).json({ status: "success", data: { plan } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.createPlan = async (req, res) => {
  try {
    if (req.body.isPopular) {
      await Plan.updateMany({}, { isPopular: false });
    }
    const plan = await Plan.create(req.body);
    res.status(201).json({ status: "success", data: { plan } });
  } catch (err) {
    // ✅ Erreur nom dupliqué
    if (err.code === 11000) {
      return res.status(400).json({
        status: "fail",
        message: `Un plan avec le nom "${req.body.name}" existe déjà.`
      });
    }
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    if (req.body.isPopular) {
      await Plan.updateMany({ _id: { $ne: req.params.id } }, { isPopular: false });
    }
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!plan) return res.status(404).json({ status: "fail", message: "Plan non trouvé" });
    res.status(200).json({ status: "success", data: { plan } });
  } catch (err) {
    // ✅ Erreur nom dupliqué
    if (err.code === 11000) {
      return res.status(400).json({
        status: "fail",
        message: `Un plan avec le nom "${req.body.name}" existe déjà.`
      });
    }
    res.status(400).json({ status: "fail", message: err.message });
  }
};
// PATCH toggle actif/inactif
exports.togglePlanStatus = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ status: "fail", message: "Plan non trouvé" });

    plan.isActive = !plan.isActive;
    await plan.save();

    res.status(200).json({ status: "success", data: { plan } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// ARCHIVE plan
exports.archivePlan = async (req, res) => {
  try {
    const Subscription = require('../models/subscriptionModel');
    const active = await Subscription.findOne({ plan: req.params.id, status: 'active' });
    if (active) {
      return res.status(400).json({
        status: 'fail',
        message: "Impossible d'archiver — des entreprises utilisent ce plan activement"
      });
    }
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { isActive: false, archivedAt: new Date() },
      { new: true }
    );
    if (!plan) return res.status(404).json({ status: "fail", message: "Plan non trouvé" });
    res.status(200).json({ status: "success", message: "Plan archivé" });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};