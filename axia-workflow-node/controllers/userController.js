// ✅ role est maintenant un String — plus de populate('role')
const APIFeatures = require("../utils/APIFeatures");
const nodemailer  = require("nodemailer");
const bcrypt      = require("bcrypt");
const crypto      = require("crypto");
const dotenv      = require("dotenv");

dotenv.config({ path: "./.env" });

exports.createUser = async (req, res) => {
  try {
    const User = require("../models/userModel");
    const newUser = await User.create(req.body);
    res.status(201).json({ status: "success", data: { newUser } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const User = require("../models/userModel");
    // ✅ Plus de .populate("role") — role est un String direct
    const API_Features = new APIFeatures(User.find(), req.query)
      .sort()
      .pagination()
      .filter();
    const users = await API_Features.query;
    res.status(200).json({ status: "success", results: users.length, data: { users } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const User = require("../models/userModel");
    // ✅ Plus de .populate("role")
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.status(200).json({ status: "success", data: { user } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const User = require("../models/userModel");
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    res.status(200).json({ status: "success", message: "Utilisateur mis à jour !", data: { updatedUser } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.archiveUser = async (req, res) => {
  try {
    const User = require('../models/userModel');
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: 'fail', message: 'Utilisateur non trouvé' });

    // Vérifier tâches en cours via tenantConnection si disponible
    if (req.tenantConnection) {
      const workflowSchema = require('../models/workflowModel').schema;
      const Workflow = req.tenantConnection.models['Workflow'] || 
                       req.tenantConnection.model('Workflow', workflowSchema);
      const activeTasks = await Workflow.countDocuments({
        'steps': { 
          $elemMatch: { 
            assignedTo: req.params.id, 
            status: 'in_progress' 
          } 
        }
      });
      if (activeTasks > 0) {
        return res.status(400).json({ 
          status: 'fail', 
          message: `Impossible d'archiver — l'utilisateur a ${activeTasks} tâche(s) en cours` 
        });
      }
    }

    await User.findByIdAndUpdate(req.params.id, { 
      isActive: false, 
      archivedAt: new Date() 
    });

    res.status(200).json({ status: 'success', message: 'Utilisateur archivé' });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: "fail", message: "Adresse email requise" });

    const User = require("../models/userModel");
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ status: "success", message: "Si cet email existe, vous recevrez un mot de passe temporaire." });
    }

    const tempPassword   = crypto.randomBytes(4).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await User.findByIdAndUpdate(user._id, { password: hashedPassword, pass_update_date: Date.now() }, { runValidators: false });

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      secure: true,
      auth: { user: process.env.EMAIL, pass: process.env.PASSWORD_APPLICATION },
    });

    await transporter.sendMail({
      from:    `"Axia Workflow" <${process.env.EMAIL}>`,
      to:      email,
      subject: "Réinitialisation mot de passe — Axia Workflow",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border-radius:8px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e293b;">Réinitialisation du mot de passe</h2>
          <p>Bonjour <strong>${user.firstName} ${user.lastName}</strong>,</p>
          <p>Votre mot de passe temporaire :</p>
          <div style="background:#f1f5f9;padding:16px;text-align:center;border-radius:6px;margin:16px 0;">
            <span style="font-size:22px;font-weight:bold;color:#dc2626;letter-spacing:4px;">${tempPassword}</span>
          </div>
          <p>Modifiez-le dès votre prochaine connexion.</p>
          <hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0;">
          <p style="font-size:12px;color:#64748b;text-align:center;">© ${new Date().getFullYear()} Axia Workflow</p>
        </div>
      `,
    });

    res.status(200).json({ status: "success", message: "Email de récupération envoyé !" });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Erreur serveur", error: error.message });
  }
};