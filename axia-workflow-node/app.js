const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const express          = require("express");
const mongoose         = require("mongoose");
const cors             = require("cors");
const fs               = require('fs');
const path             = require('path');

const aiRoutes           = require('./routes/aiRoutes');
const authRoutes         = require('./routes/authRoutes');
const userRoutes         = require("./routes/userRoutes");
const planRoutes         = require("./routes/planRoutes");
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const tenantRoutes       = require("./routes/tenantRoutes");
const projectRoutes      = require('./routes/projectRoutes');
const workflowRoutes     = require('./routes/workflowRoutes');
const tenantUserRoutes   = require('./routes/tenantUserRoutes');
const departmentRoutes   = require('./routes/departmentRoutes');
const templateRoutes     = require('./routes/templateRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const documentTypeRoutes = require('./routes/documentTypeRoutes');

require('./models/tenantModel');

const app = express();

// ── Dossier uploads ───────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('[INFO] Dossier uploads/ cree');
}

// ── CORS dynamique ────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`[CORS] Origine bloquee : ${origin}`));
  },
  credentials: true,
}));

// ── Webhook Stripe AVANT express.json() ──────────────────────────────────────
app.use("/api/subscriptions/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth',               authRoutes);
app.use("/users",              userRoutes);
app.use("/plans",              planRoutes);
app.use('/subscriptions',      subscriptionRoutes);
app.use("/tenants",            tenantRoutes);
app.use('/projects',           projectRoutes);
app.use('/workflows',          workflowRoutes);
app.use('/tenant-users',       tenantUserRoutes);
app.use('/departments',        departmentRoutes);
app.use('/workflow-templates', templateRoutes);
app.use('/notifications',      notificationRoutes);
app.use('/ai',                 aiRoutes);
app.use('/document-types',     documentTypeRoutes);

// ── Cron jobs ─────────────────────────────────────────────────────────────────
const cron   = require('node-cron');
const { sendReminders } = require('./services/notificationService');
const { checkExpiry }   = require('./controllers/subscriptionController');
const Tenant            = require('./models/tenantModel');

const cronConnections = {};

const getCronConnection = async (dbName) => {
  const existing = cronConnections[dbName];
  if (existing && existing.readyState === 1) return existing;

  const rawUri      = process.env.DATABASE_URL.replace('<db_password>', process.env.DATABASE_PASSWORD);
  const tenantDbUrl = rawUri.replace(/(\w+\.mongodb\.net\/)([^?]*)/, '$1' + dbName);

  const conn = await mongoose.createConnection(tenantDbUrl, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 2,
  });

  conn.on('disconnected', () => { delete cronConnections[dbName]; });
  conn.on('error',        () => { delete cronConnections[dbName]; });

  cronConnections[dbName] = conn;
  return conn;
};

// Rappels workflow — tous les jours a 8h
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Demarrage des rappels automatiques...');
  try {
    const tenants = await Tenant.find({ status: 'active', isActive: true });
    for (const tenant of tenants) {
      try {
        const conn = await getCronConnection(tenant.dbName);
        await sendReminders(conn);
        console.log(`[CRON] Rappels envoyes pour : ${tenant.dbName}`);
      } catch (err) {
        console.error(`[CRON] Erreur tenant ${tenant.dbName} : ${err.message}`);
      }
    }
    console.log('[CRON] Rappels termines');
  } catch (err) {
    console.error(`[CRON] Erreur generale rappels : ${err.message}`);
  }
});

// Verification expirations abonnements — toutes les heures
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Verification expirations abonnements...');
  try {
    await checkExpiry();
    console.log('[CRON] Verification terminee');
  } catch (err) {
    console.error(`[CRON] Erreur verification : ${err.message}`);
  }
});

// ── Connexion DB principale ───────────────────────────────────────────────────
const DB = process.env.DATABASE_URL.replace("<db_password>", process.env.DATABASE_PASSWORD);

mongoose
  .connect(DB)
  .then(() => console.log("[DB] Connexion etablie avec succes"))
  .catch((err) => console.error("[DB] Erreur de connexion :", err.message));

// ── Demarrage du serveur ──────────────────────────────────────────────────────
const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log('--------------------------------------------------');
  console.log(`[SERVER] Axia Workflow API demarre`);
  console.log(`[SERVER] Port     : ${port}`);
  console.log(`[SERVER] Env      : ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SERVER] CORS     : ${allowedOrigins.join(', ')}`);
  console.log('--------------------------------------------------');
});