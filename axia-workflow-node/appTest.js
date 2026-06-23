// appTest.js — racine du projet axia-workflow-node/
// Version Express SANS connexion MongoDB automatique
// Utilisé uniquement par les tests d'intégration

const express          = require('express');
const cors             = require('cors');

const aiRoutes           = require('./routes/aiRoutes');
const authRoutes         = require('./routes/authRoutes');
const userRoutes         = require('./routes/userRoutes');
const planRoutes         = require('./routes/planRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const tenantRoutes       = require('./routes/tenantRoutes');
const projectRoutes      = require('./routes/projectRoutes');
const workflowRoutes     = require('./routes/workflowRoutes');
const tenantUserRoutes   = require('./routes/tenantUserRoutes');
const departmentRoutes   = require('./routes/departmentRoutes');
const templateRoutes     = require('./routes/templateRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const documentTypeRoutes = require('./routes/documentTypeRoutes');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/auth',               authRoutes);
app.use('/users',              userRoutes);
app.use('/plans',              planRoutes);
app.use('/subscriptions',      subscriptionRoutes);
app.use('/tenants',            tenantRoutes);
app.use('/projects',           projectRoutes);
app.use('/workflows',          workflowRoutes);
app.use('/tenant-users',       tenantUserRoutes);
app.use('/departments',        departmentRoutes);
app.use('/workflow-templates', templateRoutes);
app.use('/notifications',      notificationRoutes);
app.use('/ai',                 aiRoutes);
app.use('/document-types',     documentTypeRoutes);

module.exports = app;