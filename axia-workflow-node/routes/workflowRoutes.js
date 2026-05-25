const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const { protectorMW, permitMW } = require("../controllers/authController");
const {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  startWorkflow,
  startInstance,
  completeStep,
  rejectStep,
  uploadDocument,
  getDocuments,
  getGlobalWorkflows,
  getAuditLog,
  archiveWorkflow,
  updateWorkflowVisibility,
  getDocumentChain,
  getMyRequests,
  getTenantUsers,
  getMyTasks,
  getWorkflowStats,
  deactivateWorkflow,
  deleteWorkflow,
  getActiveTemplates,
} = require("../controllers/workflowController");

// ── Dossier uploads ───────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ── Multer config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "video/mp4", "video/avi", "video/quicktime",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Type de fichier non autorisé"), false);
  },
});

const uploadMiddleware = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError)
      return res.status(400).json({ status: "fail", message: "Erreur multer : " + err.message });
    if (err)
      return res.status(400).json({ status: "fail", message: err.message });
    next();
  });
};

// ── Auth sur toutes les routes ────────────────────────────────────────────────
router.use(protectorMW);

// ── ⚠️ ROUTES STATIQUES EN PREMIER (avant /:id) ──────────────────────────────
// Documents
router.post("/documents/upload",              uploadMiddleware, uploadDocument);
router.get("/documents/workflow/:workflowId", getDocuments);
router.get("/documents/project/:projectId",   getDocuments);

// Routes nommées statiques — DOIVENT être avant /:id
router.get("/",permitMW("company_admin"), getWorkflows);
router.get("/project/:projectId",             getWorkflows);
router.get("/my-tasks",                       getMyTasks);           // ✅ CORRIGÉ : avant /:id
router.get("/my-requests",                    getMyRequests);        // ✅ CORRIGÉ : avant /:id
router.get("/stats/overview",                 getWorkflowStats);     // ✅ CORRIGÉ : avant /:id
router.get("/templates/active",               getActiveTemplates);   // ✅ workflows actifs pour employés
router.get("/global/visible",                 getGlobalWorkflows);   // ✅ CORRIGÉ : avant /:id
router.get("/audit-log",                      permitMW("company_admin", "manager"), getAuditLog); // ✅
router.get("/users/list",                     getTenantUsers);       // ✅ CORRIGÉ : avant /:id

// ── Routes dynamiques /:id (APRÈS les statiques) ─────────────────────────────
router.get("/:id/document-chain",             getDocumentChain);
router.get("/:id",                            getWorkflow);
router.post("/",                              permitMW("company_admin", "manager", "employee"), createWorkflow);
router.patch("/:id",                          permitMW("company_admin"), updateWorkflow);
router.patch("/:id/start",                    startWorkflow);
router.patch("/:id/start-instance",           startInstance);      // ✅ NOUVEAU — pour les employés
router.patch("/:id/complete-step",            completeStep);
router.patch("/:id/reject-step",              rejectStep);
router.patch("/:id/archive",                  permitMW("company_admin"), archiveWorkflow);
router.patch("/:id/deactivate", permitMW("company_admin"), deactivateWorkflow);
router.patch("/:id/visibility",               permitMW("company_admin"), updateWorkflowVisibility);
router.delete("/:id",permitMW("company_admin"), deleteWorkflow); // ✅ AJOUTER
module.exports = router;