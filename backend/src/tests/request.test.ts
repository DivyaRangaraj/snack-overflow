import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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
let member1Token: string;
let member2Token: string;
let adminId: string;
let member1Id: string;
let member2Id: string;

beforeAll(async () => {
  // Clean up test data
  await prisma.notification.deleteMany({});
  await prisma.snackRequest.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.vote.deleteMany({});
  await prisma.snack.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash passwords
  const adminPw = await bcrypt.hash('AdminTest123', 12);
  const memberPw = await bcrypt.hash('MemberTest123', 12);

  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin_req@test.local', password: adminPw, role: 'ADMIN' },
  });
  const member1 = await prisma.user.create({
    data: { name: 'Member One', email: 'member1_req@test.local', password: memberPw, role: 'MEMBER' },
  });
  const member2 = await prisma.user.create({
    data: { name: 'Member Two', email: 'member2_req@test.local', password: memberPw, role: 'MEMBER' },
  });

  adminId = admin.id;
  member1Id = member1.id;
  member2Id = member2.id;

  // Log in
  const resAdmin = await request(app)
    .post('/auth/login')
    .send({ email: 'admin_req@test.local', password: 'AdminTest123' });
  adminToken = resAdmin.body.token;

  const resMember1 = await request(app)
    .post('/auth/login')
    .send({ email: 'member1_req@test.local', password: 'MemberTest123' });
  member1Token = resMember1.body.token;

  const resMember2 = await request(app)
    .post('/auth/login')
    .send({ email: 'member2_req@test.local', password: 'MemberTest123' });
  member2Token = resMember2.body.token;
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

describe('Snack Request & Approval Workflow', () => {
  let createdRequestId: string;

  it('POST /snack-requests - member can submit a new snack request', async () => {
    const res = await request(app)
      .post('/snack-requests')
      .set('Authorization', `Bearer ${member1Token}`)
      .send({
        snackName: 'Pringles Sour Cream',
        category: 'SAVOURY',
        reason: 'Great for team afternoon brainstorms!',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.snackName).toBe('Pringles Sour Cream');
    expect(res.body.status).toBe('PENDING');
    createdRequestId = res.body.id;

    // Verify admin received notification
    const adminNotifs = await prisma.notification.findMany({
      where: { userId: adminId },
    });
    expect(adminNotifs.length).toBeGreaterThanOrEqual(1);
    expect(adminNotifs[0].message).toContain('Pringles Sour Cream');
  });

  it('POST /snack-requests - cannot submit duplicate pending request', async () => {
    const res = await request(app)
      .post('/snack-requests')
      .set('Authorization', `Bearer ${member1Token}`)
      .send({
        snackName: 'Pringles Sour Cream',
        category: 'SAVOURY',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_PENDING_REQUEST');
  });

  it('GET /snack-requests/my - member can view their own submitted requests', async () => {
    const res = await request(app)
      .get('/snack-requests/my')
      .set('Authorization', `Bearer ${member1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.requests).toBeInstanceOf(Array);
    expect(res.body.requests.length).toBe(1);
    expect(res.body.requests[0].snackName).toBe('Pringles Sour Cream');
    expect(res.body.pagination.total).toBe(1);
  });

  it('GET /snack-requests/:id - member cannot view another member’s request', async () => {
    const res = await request(app)
      .get(`/snack-requests/${createdRequestId}`)
      .set('Authorization', `Bearer ${member2Token}`);

    expect(res.status).toBe(403);
  });

  it('GET /snack-requests/:id - admin can view any request', async () => {
    const res = await request(app)
      .get(`/snack-requests/${createdRequestId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdRequestId);
  });

  it('GET /snack-requests - admin can view all requests with pagination and filters', async () => {
    const res = await request(app)
      .get('/snack-requests?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.requests.length).toBeGreaterThanOrEqual(1);
    expect(res.body.counts.pending).toBeGreaterThanOrEqual(1);
  });

  it('PATCH /snack-requests/:id/approve - member cannot approve request (403)', async () => {
    const res = await request(app)
      .patch(`/snack-requests/${createdRequestId}/approve`)
      .set('Authorization', `Bearer ${member1Token}`)
      .send({ quantity: 15, lowStockThreshold: 5 });

    expect(res.status).toBe(403);
  });

  it('PATCH /snack-requests/:id/decline - decline without a reason is rejected (400)', async () => {
    const res = await request(app)
      .patch(`/snack-requests/${createdRequestId}/decline`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: '' });

    expect(res.status).toBe(400);
  });

  it('PATCH /snack-requests/:id/decline - decline updates request and creates notification with exact reason', async () => {
    // Create a temporary request to decline
    const newReq = await request(app)
      .post('/snack-requests')
      .set('Authorization', `Bearer ${member2Token}`)
      .send({
        snackName: 'Energy Drink Sugar Free',
        category: 'DRINK',
        reason: 'Late night hackathons',
      });
    const declineId = newReq.body.id;

    const res = await request(app)
      .patch(`/snack-requests/${declineId}/decline`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Not included in the current pantry budget.' });

    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe('DECLINED');
    expect(res.body.request.adminResponse).toBe('Not included in the current pantry budget.');

    // Verify member notification
    const notifs = await prisma.notification.findMany({
      where: { userId: member2Id, requestId: declineId, type: 'REQUEST_DECLINED' },
    });
    expect(notifs.length).toBe(1);
    expect(notifs[0].message).toContain('Not included in the current pantry budget.');
  });

  it('PATCH /snack-requests/:id/approve - atomic approval creates snack, updates status and notifies member', async () => {
    const res = await request(app)
      .patch(`/snack-requests/${createdRequestId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 20, lowStockThreshold: 6 });

    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe('APPROVED');
    expect(res.body.snack).toBeTruthy();
    expect(res.body.snack.name).toBe('Pringles Sour Cream');
    expect(res.body.snack.quantity).toBe(20);

    // Verify snack is in PostgreSQL inventory
    const dbSnack = await prisma.snack.findUnique({
      where: { name: 'Pringles Sour Cream' },
    });
    expect(dbSnack).toBeTruthy();
    expect(dbSnack?.quantity).toBe(20);

    // Verify member notification
    const memberNotifs = await prisma.notification.findMany({
      where: { userId: member1Id, requestId: createdRequestId, type: 'REQUEST_APPROVED' },
    });
    expect(memberNotifs.length).toBe(1);
    expect(memberNotifs[0].type).toBe('REQUEST_APPROVED');
    expect(memberNotifs[0].message).toContain('Pringles Sour Cream has been approved');
  });

  it('Already reviewed request cannot be approved or declined again (409)', async () => {
    const res = await request(app)
      .patch(`/snack-requests/${createdRequestId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 10 });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('REQUEST_ALREADY_REVIEWED');
  });

  it('Two simultaneous approvals for the same request cannot create duplicate snacks', async () => {
    // Create a new pending request
    const newReq = await request(app)
      .post('/snack-requests')
      .set('Authorization', `Bearer ${member1Token}`)
      .send({
        snackName: 'Wasabi Peas Crunch',
        category: 'SAVOURY',
      });
    const reqId = newReq.body.id;

    // Fire 2 approvals concurrently
    const [res1, res2] = await Promise.all([
      request(app)
        .patch(`/snack-requests/${reqId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 12 }),
      request(app)
        .patch(`/snack-requests/${reqId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 12 }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);

    // Ensure exactly ONE snack exists in database
    const matchingSnacks = await prisma.snack.findMany({
      where: { name: 'Wasabi Peas Crunch' },
    });
    expect(matchingSnacks.length).toBe(1);
  });

  it('Approval cannot create duplicate snack if a snack with same name already exists (409)', async () => {
    // Manually create a pending request with the same name as an existing snack
    const conflictReq = await prisma.snackRequest.create({
      data: {
        userId: member1Id,
        snackName: 'Pringles Sour Cream', // already exists
        category: 'SAVOURY',
        status: 'PENDING',
      },
    });

    const res = await request(app)
      .patch(`/snack-requests/${conflictReq.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 10 });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_SNACK_NAME');
  });
});

describe('Notifications Management', () => {
  it('GET /notifications - user can view their notifications with unread count', async () => {
    const res = await request(app)
      .get('/notifications')
      .set('Authorization', `Bearer ${member1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toBeInstanceOf(Array);
    expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it('PATCH /notifications/:id/read - user cannot mark another user’s notification as read (403)', async () => {
    const adminNotif = await prisma.notification.findFirst({
      where: { userId: adminId },
    });

    if (adminNotif) {
      const res = await request(app)
        .patch(`/notifications/${adminNotif.id}/read`)
        .set('Authorization', `Bearer ${member1Token}`);

      expect(res.status).toBe(403);
    }
  });

  it('PATCH /notifications/:id/read - user can mark their own notification as read', async () => {
    const memberNotif = await prisma.notification.findFirst({
      where: { userId: member1Id, isRead: false },
    });

    expect(memberNotif).toBeTruthy();

    const res = await request(app)
      .patch(`/notifications/${memberNotif!.id}/read`)
      .set('Authorization', `Bearer ${member1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.notification.isRead).toBe(true);
  });

  it('PATCH /notifications/read-all - user can mark all notifications as read', async () => {
    const res = await request(app)
      .patch('/notifications/read-all')
      .set('Authorization', `Bearer ${member1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBe(0);

    const remainingUnread = await prisma.notification.count({
      where: { userId: member1Id, isRead: false },
    });
    expect(remainingUnread).toBe(0);
  });
});
