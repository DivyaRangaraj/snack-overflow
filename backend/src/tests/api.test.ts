import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createApp } from '../app';

const app = createApp();

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL },
  },
});

let adminToken: string;
let memberToken: string;
let adminId: string;
let memberId: string;

beforeAll(async () => {
  // Clean up test data
  await prisma.notification.deleteMany({});
  await prisma.snackRequest.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.vote.deleteMany({});
  await prisma.snack.deleteMany({});
  await prisma.user.deleteMany({});

  // Create test users
  const adminPw = await bcrypt.hash('AdminTest123', 12);
  const memberPw = await bcrypt.hash('MemberTest123', 12);

  const admin = await prisma.user.create({
    data: { name: 'Test Admin', email: 'testadmin@test.local', password: adminPw, role: 'ADMIN' },
  });
  const member = await prisma.user.create({
    data: { name: 'Test Member', email: 'testmember@test.local', password: memberPw, role: 'MEMBER' },
  });

  adminId = admin.id;
  memberId = member.id;

  // Login to get tokens
  const adminLogin = await request(app)
    .post('/auth/login')
    .send({ email: 'testadmin@test.local', password: 'AdminTest123' });
  adminToken = adminLogin.body.token;

  const memberLogin = await request(app)
    .post('/auth/login')
    .send({ email: 'testmember@test.local', password: 'MemberTest123' });
  memberToken = memberLogin.body.token;
});

afterAll(async () => {
  await prisma.notification.deleteMany({});
  await prisma.snackRequest.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.vote.deleteMany({});
  await prisma.snack.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

// ==================== AUTH TESTS ====================
describe('Authentication', () => {
  it('POST /auth/login - valid credentials return token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'testadmin@test.local', password: 'AdminTest123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('testadmin@test.local');
    expect(res.body.user.role).toBe('ADMIN');
    expect(res.body.user.password).toBeUndefined();
  });

  it('POST /auth/login - invalid password returns 401', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'testadmin@test.local', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('POST /auth/login - missing credentials returns 400', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'testadmin@test.local' });

    expect(res.status).toBe(400);
  });

  it('GET /snacks - no token returns 401', async () => {
    const res = await request(app).get('/snacks');
    expect(res.status).toBe(401);
  });

  it('GET /auth/me - returns current user', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('testadmin@test.local');
  });
});

// ==================== SNACK CRUD TESTS ====================
describe('Snack CRUD', () => {
  let snackId: string;

  it('POST /snacks - admin can create snack', async () => {
    const res = await request(app)
      .post('/snacks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Oreos', category: 'SWEET', quantity: 20, lowStockThreshold: 5 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Oreos');
    expect(res.body.stockStatus).toBe('STOCKED');
    snackId = res.body.id;
  });

  it('POST /snacks - member cannot create snack (403)', async () => {
    const res = await request(app)
      .post('/snacks')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Member Snack', category: 'DRINK', quantity: 5, lowStockThreshold: 2 });

    expect(res.status).toBe(403);
  });

  it('GET /snacks - returns snack list', async () => {
    const res = await request(app)
      .get('/snacks')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.snacks)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('GET /snacks/:id - returns snack details', async () => {
    const res = await request(app)
      .get(`/snacks/${snackId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(snackId);
    expect(res.body.stockStatus).toBeDefined();
  });

  it('PATCH /snacks/:id - admin can update snack', async () => {
    const res = await request(app)
      .patch(`/snacks/${snackId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lowStockThreshold: 8 });

    expect(res.status).toBe(200);
    expect(res.body.lowStockThreshold).toBe(8);
  });

  it('DELETE /snacks/:id - member cannot delete snack (403)', async () => {
    const res = await request(app)
      .delete(`/snacks/${snackId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });

  it('DELETE /snacks/:id - admin can delete snack', async () => {
    const res = await request(app)
      .delete(`/snacks/${snackId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });
});

// ==================== CONSUMPTION TESTS ====================
describe('Snack Consumption', () => {
  let snackId: string;

  beforeEach(async () => {
    const snack = await prisma.snack.create({
      data: { name: `Consume Test ${Date.now()}`, category: 'DRINK', quantity: 10, lowStockThreshold: 3 },
    });
    snackId = snack.id;
  });

  afterEach(async () => {
    await prisma.activity.deleteMany({ where: { snackId } });
    await prisma.snack.deleteMany({ where: { id: snackId } });
  });

  it('POST /snacks/:id/consume - successful consumption', async () => {
    const res = await request(app)
      .post(`/snacks/${snackId}/consume`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ amount: 2 });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(8);
  });

  it('POST /snacks/:id/consume - invalid amount (zero) returns 400', async () => {
    const res = await request(app)
      .post(`/snacks/${snackId}/consume`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ amount: 0 });

    expect(res.status).toBe(400);
  });

  it('POST /snacks/:id/consume - insufficient stock returns 409', async () => {
    const res = await request(app)
      .post(`/snacks/${snackId}/consume`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ amount: 999 });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });

  it('Quantity never goes negative after consume', async () => {
    const res = await request(app)
      .post(`/snacks/${snackId}/consume`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ amount: 999 });

    const snack = await prisma.snack.findUnique({ where: { id: snackId } });
    expect(snack!.quantity).toBeGreaterThanOrEqual(0);
    expect(res.status).toBe(409);
  });
});

// ==================== RESTOCK TESTS ====================
describe('Restock', () => {
  let snackId: string;

  beforeAll(async () => {
    const snack = await prisma.snack.create({
      data: { name: `Restock Test ${Date.now()}`, category: 'SAVOURY', quantity: 5, lowStockThreshold: 3 },
    });
    snackId = snack.id;
  });

  afterAll(async () => {
    await prisma.activity.deleteMany({ where: { snackId } });
    await prisma.snack.deleteMany({ where: { id: snackId } });
  });

  it('POST /snacks/:id/restock - admin can restock', async () => {
    const res = await request(app)
      .post(`/snacks/${snackId}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 10 });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(15);
  });

  it('POST /snacks/:id/restock - member cannot restock (403)', async () => {
    const res = await request(app)
      .post(`/snacks/${snackId}/restock`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ amount: 10 });

    expect(res.status).toBe(403);
  });
});

// ==================== VOTING TESTS ====================
describe('Voting', () => {
  let snackId: string;

  beforeAll(async () => {
    const snack = await prisma.snack.create({
      data: { name: `Vote Test ${Date.now()}`, category: 'HEALTHY_ISH', quantity: 10, lowStockThreshold: 3 },
    });
    snackId = snack.id;
  });

  afterAll(async () => {
    await prisma.vote.deleteMany({ where: { snackId } });
    await prisma.snack.deleteMany({ where: { id: snackId } });
  });

  it('POST /snacks/:id/vote - member can vote', async () => {
    const res = await request(app)
      .post(`/snacks/${snackId}/vote`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(201);
    expect(res.body.userVoted).toBe(true);
  });

  it('POST /snacks/:id/vote - duplicate vote returns 409', async () => {
    const res = await request(app)
      .post(`/snacks/${snackId}/vote`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_VOTE');
  });

  it('Database unique constraint prevents duplicate votes', async () => {
    // Attempt to directly insert duplicate vote in DB — should fail
    const vote = await prisma.vote.findUnique({
      where: { userId_snackId: { userId: memberId, snackId } },
    });
    expect(vote).toBeTruthy(); // existing vote

    await expect(
      prisma.vote.create({ data: { userId: memberId, snackId } })
    ).rejects.toThrow();
  });

  it('DELETE /snacks/:id/vote - member can unvote', async () => {
    const res = await request(app)
      .delete(`/snacks/${snackId}/vote`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.userVoted).toBe(false);
  });

  it('Admin can also vote', async () => {
    const res = await request(app)
      .post(`/snacks/${snackId}/vote`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(201);
    expect(res.body.userVoted).toBe(true);

    // Clean up
    await request(app)
      .delete(`/snacks/${snackId}/vote`)
      .set('Authorization', `Bearer ${adminToken}`);
  });
});

// ==================== CONCURRENCY TEST ====================
describe('Concurrency Control', () => {
  it('10 simultaneous consume requests on stock=3 → exactly 3 succeed, 7 fail, final qty=0', async () => {
    // Create a fresh snack with exactly 3 units
    const snack = await prisma.snack.create({
      data: { name: `Concurrency Test ${Date.now()}`, category: 'SWEET', quantity: 3, lowStockThreshold: 2 },
    });
    const snackId = snack.id;

    // Fire 10 simultaneous requests
    const requests = Array.from({ length: 10 }, () =>
      request(app)
        .post(`/snacks/${snackId}/consume`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ amount: 1 })
    );

    const responses = await Promise.all(requests);

    const successes = responses.filter((r) => r.status === 200);
    const conflicts = responses.filter((r) => r.status === 409);

    console.log(`\n  Concurrency results: ${successes.length} succeeded, ${conflicts.length} failed`);

    // Exactly 3 must succeed
    expect(successes.length).toBe(3);
    // Exactly 7 must fail with 409
    expect(conflicts.length).toBe(7);

    // Final quantity must be exactly 0
    const finalSnack = await prisma.snack.findUnique({ where: { id: snackId } });
    expect(finalSnack!.quantity).toBe(0);

    // Exactly 3 activity records must exist
    const activities = await prisma.activity.count({
      where: { snackId, action: 'CONSUMED' },
    });
    expect(activities).toBe(3);

    // Clean up
    await prisma.activity.deleteMany({ where: { snackId } });
    await prisma.snack.delete({ where: { id: snackId } });
  }, 30000);
});

// ==================== DASHBOARD ====================
describe('Dashboard Summary', () => {
  it('GET /snacks/summary - returns summary statistics', async () => {
    const res = await request(app)
      .get('/snacks/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalTypes).toBeDefined();
    expect(res.body.stocked).toBeDefined();
    expect(res.body.runningLow).toBeDefined();
    expect(res.body.gone).toBeDefined();
    expect(res.body.totalUnits).toBeDefined();
  });
});
