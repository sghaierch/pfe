const mongoose = require("mongoose");
const projectSchemaDefinition  = require("../models/projectModel");
const workflowSchemaDefinition = require("../models/workflowModel").schema;

// ── Helper connexion tenant ───────────────────────────────────────────────────
const getTenantModels = (req) => {
  const conn = req.tenantConnection;
  if (!conn) throw new Error("Connexion tenant manquante");

  const Project  = safeModel(conn, "Project",  projectSchemaDefinition);
  const Workflow = safeModel(conn, "Workflow",  workflowSchemaDefinition);
  return { Project, Workflow };
};

const safeModel = (conn, name, schema) => {
  try { return conn.model(name); }
  catch { return conn.model(name, schema); }
};

// ── GET tous les projets ──────────────────────────────────────────────────────
exports.getAllProjects = async (req, res) => {
  try {
    const { Project } = getTenantModels(req);
    const projects = await Project.find({ status: { $ne: "archived" } })
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({ status: "success", results: projects.length, data: { projects } });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// ── GET un projet ─────────────────────────────────────────────────────────────
exports.getProject = async (req, res) => {
  try {
    const { Project, Workflow } = getTenantModels(req);
    const project = await Project.findById(req.params.id)
      .populate("createdBy", "firstName lastName email");

    if (!project) {
      return res.status(404).json({ status: "fail", message: "Projet non trouvé" });
    }

    // Récupérer les templates (workflows créés par l'admin)
  const templates = await Workflow.find({ project: req.params.id, isTemplate: true })
  .select("name status currentStep steps createdAt dueDate isTemplate templateRef allowedPosts allowedRoles visibility")
  .sort({ createdAt: -1 });
    // Récupérer les instances (demandes soumises par les employés)
  const instances = await Workflow.find({ project: req.params.id, isTemplate: { $ne: true } })
  .select("name status currentStep steps createdAt dueDate isTemplate templateRef allowedPosts allowedRoles visibility")
  .sort({ createdAt: -1 });
    res.status(200).json({
      status: "success",
      data: {
        project,
        workflows:  templates,   // rétrocompatibilité — contient les templates
        templates,
        instances,
        workflowCount: templates.length,
        instanceCount: instances.length,
      }
    });
  } catch (err) {
  console.error('GET /projects/:id ERROR:', err.message); // ← ajoute cette ligne
  res.status(500).json({ status: "fail", message: err.message });
}
};

// ── CREATE projet ─────────────────────────────────────────────────────────────
exports.createProject = async (req, res) => {
  try {
    const { Project } = getTenantModels(req);
    const { name, description, color } = req.body;

    const project = await Project.create({
      name,
      description,
      color: color || "#4f46e5",
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: "owner" }]
    });

    res.status(201).json({ status: "success", data: { project } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// ── UPDATE projet ─────────────────────────────────────────────────────────────
exports.updateProject = async (req, res) => {
  try {
    const { Project } = getTenantModels(req);
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });

    if (!project) {
      return res.status(404).json({ status: "fail", message: "Projet non trouvé" });
    }

    res.status(200).json({ status: "success", data: { project } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// ── DELETE (archiver) projet ──────────────────────────────────────────────────
exports.deleteProject = async (req, res) => {
  try {
    const { Project } = getTenantModels(req);
    await Project.findByIdAndUpdate(req.params.id, { status: "archived" });
    res.status(200).json({ status: "success", message: "Projet archivé" });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};