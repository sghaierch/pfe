// tests/integration/plans.test.js
require('../setup');

const request  = require('supertest');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const { connectTestDB, clearTestDB, closeTestDB } = require('../helpers/db');
const app = require('../../appTest');

beforeAll(async () => { await connectTestDB(); });
afterEach(async () => { await clearTestDB(); });
afterAll(async () => { await closeTestDB(); });

const getSuperAdminToken = async () => {
  const User      = require('../../models/userModel');
  const hashedPwd = await bcrypt.hash('TestPassword123!', 10);
  const user      = await User.create({
    firstName: 'Super', lastName: 'Admin',
    email:     'superadmin@test.com',
    password:  hashedPwd,
    role:      'superadmin',
    isActive:  true,
  });
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
};

const createPlan = (token, data = {}) =>
  request(app)
    .post('/plans')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Plan Test', price: 99,
      billingCycle: 'monthly',
      maxUsers: 10, maxWorkflows: 20,
      durationMonths: 1,
      ...data,
    });

describe('GET /plans/public', () => {

  test('retourne les plans actifs sans authentification', async () => {
    const token = await getSuperAdminToken();
    await createPlan(token, { name: 'Plan Gratuit', price: 0 });
    const res = await request(app).get('/plans/public');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data.plans)).toBe(true);
  });
});

describe('POST /plans', () => {

  test('superadmin peut créer un plan', async () => {
    const token = await getSuperAdminToken();
    const res   = await createPlan(token, { name: 'Plan Starter', price: 49 });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.plan.name).toBe('Plan Starter');
    expect(res.body.data.plan._id).toBeDefined();
  });

  test('nom dupliqué → 400', async () => {
    const token = await getSuperAdminToken();
    await createPlan(token, { name: 'Plan Unique' });
    const res = await createPlan(token, { name: 'Plan Unique' });
    expect(res.status).toBe(400);
  });

  test('sans token → 401', async () => {
    const res = await request(app)
      .post('/plans')
      .send({ name: 'Plan Test', price: 99 });
    expect(res.status).toBe(401);
  });
});

describe('GET /plans (admin)', () => {

  test('superadmin voit tous les plans', async () => {
    const token = await getSuperAdminToken();
    await createPlan(token, { name: 'Plan A' });
    await createPlan(token, { name: 'Plan B' });
    const res = await request(app)
      .get('/plans')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.plans.length).toBe(2);
  });
});

describe('PATCH /plans/:id/toggle', () => {

  test('toggle active → inactive', async () => {
    const token   = await getSuperAdminToken();
    const created = await createPlan(token, { name: 'Plan Toggle' });
    const planId  = created.body.data.plan._id;
    const res     = await request(app)
      .patch(`/plans/${planId}/toggle`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.plan.isActive).toBe(false);
  });
});

describe('DELETE /plans/:id', () => {

  test('superadmin peut supprimer un plan', async () => {
    const token   = await getSuperAdminToken();
    const created = await createPlan(token, { name: 'Plan A Supprimer' });
    const planId  = created.body.data.plan._id;
    const res     = await request(app)
      .delete(`/plans/${planId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const check = await request(app)
      .get(`/plans/${planId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(check.status).toBe(404);
  });

  test('plan inexistant → 404', async () => {
    const token  = await getSuperAdminToken();
    const fakeId = '507f1f77bcf86cd799439011';
    const res    = await request(app)
      .delete(`/plans/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});