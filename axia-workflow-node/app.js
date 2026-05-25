const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const aiRoutes = require('./routes/aiRoutes');
const express          = require("express");
const mongoose         = require("mongoose");
const cors             = require("cors");
const authRoutes       = require('./routes/authRoutes');
const userRoutes       = require("./routes/userRoutes");
const roleRoutes       = require('./routes/roleRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const planRoutes       = require("./routes/planRoutes");
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const tenantRoutes     = require("./routes/tenantRoutes");
const projectRoutes    = require('./routes/projectRoutes');
const workflowRoutes   = require('./routes/workflowRoutes');
const tenantUserRoutes = require('./routes/tenantUserRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const templateRoutes   = require('./routes/templateRoutes');
const notificationRoutes = require('./routes/notificationRoutes');




const app = express();
const fs   = require('fs');
const path = require('path');
require('./models/tenantModel');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Dossier uploads/ créé');
}

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/auth',               authRoutes);
app.use("/users",              userRoutes);
app.use('/roles',              roleRoutes);
app.use('/permissions',        permissionRoutes);
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

const cron = require('node-cron');
const { sendReminders } = require('./services/notificationService');
const { checkExpiry }   = require('./controllers/subscriptionController'); // ✅ NOUVEAU
const Tenant = require('./models/tenantModel');

// ── Rappels workflow toutes les 24h ───────────────────────────────────────────
cron.schedule('0 8 * * *', async () => {
  console.log('⏰ Lancement des rappels automatiques...');
  try {
    const tenants = await Tenant.find({ status: 'active', isActive: true });
    for (const tenant of tenants) {
      const rawUri = process.env.DATABASE_URL.replace('<db_password>', process.env.DATABASE_PASSWORD);
      const tenantDbUrl = rawUri.replace(/(\w+\.mongodb\.net\/)([^?]*)/, '$1' + tenant.dbName);
      const conn = await mongoose.createConnection(tenantDbUrl, { serverSelectionTimeoutMS: 5000 });
      await sendReminders(conn);
      await conn.close();
    }
  } catch (err) {
    console.error('❌ Erreur cron rappels:', err.message);
  }
});

// ✅ Vérifier les expirations d'abonnements toutes les heures
cron.schedule('0 * * * *', async () => {
  console.log('🔍 Vérification expirations abonnements...');
  await checkExpiry();
});

const DB = process.env.DATABASE_URL.replace("<db_password>", process.env.DATABASE_PASSWORD);
mongoose
  .connect(DB)
  .then(() => console.log("✅ DB Connection secured!!!"))
  .catch((err) => console.log("❌ Erreur connexion DB:", err));

const port = process.env.PORT || 3002;
app.listen(port, () => console.log(`🚀 Server running on port: ${port}`));