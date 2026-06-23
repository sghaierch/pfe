// tests/integration/auth.test.js
require('../setup');

const request  = require('supertest');
const { connectTestDB, clearTestDB, closeTestDB } = require('../helpers/db');
const app = require('../../appTest');

beforeAll(async () => { await connectTestDB(); });
afterEach(async () => { await clearTestDB(); });
afterAll(async () => { await closeTestDB(); });

// ✅ FIX : mot de passe en clair — userModel.pre('save') le hashera lui-même
// Ne pas utiliser bcrypt.hash() ici sinon le mot de passe est hashé deux fois
const createSuperAdmin = async () => {
  const User = require('../../models/userModel');
  return await User.create({
    firstName: 'Super',
    lastName:  'Admin',
    email:     'superadmin@test.com',
    password:  'TestPassword123!',   // ← en clair, mongoose hashe automatiquement
    role:      'superadmin',
    isActive:  true,
  });
};

describe('POST /auth/signin', () => {

  test('connexion superadmin réussie → retourne token + user', async () => {
    await createSuperAdmin();
    const res = await request(app)
      .post('/auth/signin')
      .send({ email: 'superadmin@test.com', password: 'TestPassword123!' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.token).toBeDefined();
    expect(res.body.data.user.email).toBe('superadmin@test.com');
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('mauvais mot de passe → 401', async () => {
    await createSuperAdmin();
    const res = await request(app)
      .post('/auth/signin')
      .send({ email: 'superadmin@test.com', password: 'MauvaisMotDePasse' });
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test('email inexistant → 401', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .send({ email: 'inconnu@test.com', password: 'TestPassword123!' });
    expect(res.status).toBe(401);
  });

  test('email manquant → 400', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .send({ password: 'TestPassword123!' });
    expect(res.status).toBe(400);
  });

  test('mot de passe manquant → 400', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .send({ email: 'superadmin@test.com' });
    expect(res.status).toBe(400);
  });
});

describe('GET /auth/roles/public', () => {

  test('retourne la liste des rôles publics sans auth', async () => {
    const res = await request(app).get('/auth/roles/public');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data.roles)).toBe(true);
    expect(res.body.data.roles.length).toBeGreaterThan(0);
  });

  test('chaque rôle a un _id et un name', async () => {
    const res   = await request(app).get('/auth/roles/public');
    const roles = res.body.data.roles;
    roles.forEach(role => {
      expect(role).toHaveProperty('_id');
      expect(role).toHaveProperty('name');
    });
  });
});

describe('POST /auth/logout', () => {

  test('logout retourne success', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });
});

describe('Protection des routes', () => {

  test('accès /plans sans token → 401', async () => {
    const res = await request(app).get('/plans');
    expect(res.status).toBe(401);
  });

  test('accès /tenants sans token → 401', async () => {
    const res = await request(app).get('/tenants');
    expect(res.status).toBe(401);
  });

  test('accès /workflows sans token → 401', async () => {
    const res = await request(app).get('/workflows');
    expect(res.status).toBe(401);
  });

  test('token invalide → 401', async () => {
    const res = await request(app)
      .get('/plans')
      .set('Authorization', 'Bearer token_invalide_bidon');
    expect(res.status).toBe(401);
  });
});