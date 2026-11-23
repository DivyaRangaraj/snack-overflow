import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import {
  createSnackRequestSchema,
  approveRequestSchema,
  declineRequestSchema,
} from '../validators/schemas';
import {
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from '../utils/errors';
import { getSnackSlug } from '../utils/slug';

export const createRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const body = createSnackRequestSchema.parse(req.body);

    // Check if a snack with this exact name already exists in inventory (case-insensitive)
    const existingSnack = await prisma.snack.findFirst({
      where: {
        name: { equals: body.snackName.trim(), mode: 'insensitive' },
      },
    });

    if (existingSnack) {
      throw new ConflictError(
        `'${body.snackName}' is already available in the pantry inventory!`,
        'SNACK_ALREADY_EXISTS'
      );
    }

    // Check if user already has an active PENDING request for this snack
    const existingPending = await prisma.snackRequest.findFirst({
      where: {
        userId,
        snackName: { equals: body.snackName.trim(), mode: 'insensitive' },
        status: 'PENDING',
      },
    });

    if (existingPending) {
      throw new ConflictError(
        `You already have a pending request for '${body.snackName}'.`,
        'DUPLICATE_PENDING_REQUEST'
      );
    }

    const newRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.snackRequest.create({
        data: {
          userId,
          snackName: body.snackName.trim(),
          category: body.category,
          reason: body.reason?.trim() || null,
          status: 'PENDING',
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // Notify all admins of the new snack request
      const admins = await tx.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            requestId: created.id,
            title: 'New Snack Request 📥',
            message: `${req.user!.name} requested a new snack: ${created.snackName}`,
            type: 'REQUEST_SUBMITTED',
          })),
        });
      }

      return created;
    });

    res.status(201).json(newRequest);
  } catch (err) {
    next(err);
  }
};

export const getMyRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { status, page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));

    const where: any = { userId };
    if (status && ['PENDING', 'APPROVED', 'DECLINED'].includes(status as string)) {
      where.status = status;
    }

    const [total, requests] = await Promise.all([
      prisma.snackRequest.count({ where }),
      prisma.snackRequest.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    res.json({
      requests,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAllRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, category, search, page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));

    const where: any = {};
    if (status && ['PENDING', 'APPROVED', 'DECLINED'].includes(status as string)) {
      where.status = status;
    }
    if (category && ['SWEET', 'SAVOURY', 'DRINK', 'HEALTHY_ISH'].includes(category as string)) {
      where.category = category;
    }
    if (search && typeof search === 'string' && search.trim()) {
      where.OR = [
        { snackName: { contains: search.trim(), mode: 'insensitive' } },
        { user: { name: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    const [total, requests, pendingCount] = await Promise.all([
      prisma.snackRequest.count({ where }),
      prisma.snackRequest.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          admin: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.snackRequest.count({ where: { status: 'PENDING' } }),
    ]);

    res.json({
      requests,
      counts: {
        pending: pendingCount,
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getRequestById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const request = await prisma.snackRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        admin: { select: { id: true, name: true, email: true } },
      },
    });

    if (!request) {
      throw new NotFoundError('Snack request');
    }

    // Admins can view any request; Members can only view their own
    if (req.user!.role !== 'ADMIN' && request.userId !== req.user!.id) {
      throw new AuthorizationError('You do not have permission to view this request');
    }

    res.json(request);
  } catch (err) {
    next(err);
  }
};

export const approveRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const adminId = req.user!.id;
    const body = approveRequestSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify that the request exists and is still PENDING
      const request = await tx.snackRequest.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!request) {
        throw new NotFoundError('Snack request');
      }

      if (request.status !== 'PENDING') {
        throw new ConflictError(
          `Request is already ${request.status.toLowerCase()} and cannot be approved again.`,
          'REQUEST_ALREADY_REVIEWED'
        );
      }

      // 2. Verify that the snack does not already exist
      const existingSnack = await tx.snack.findFirst({
        where: {
          name: { equals: request.snackName.trim(), mode: 'insensitive' },
        },
      });

      if (existingSnack) {
        throw new ConflictError(
          `A snack with the name '${request.snackName}' already exists in inventory. Cannot create duplicate snack.`,
          'DUPLICATE_SNACK_NAME'
        );
      }

      // 3. Create the snack in inventory
      const newSnack = await tx.snack.create({
        data: {
          name: request.snackName.trim(),
          category: request.category,
          quantity: body.quantity,
          lowStockThreshold: body.lowStockThreshold,
          imageUrl: `/snacks/${getSnackSlug(request.snackName)}.svg`,
        },
      });

      // Record activity if initial stock > 0
      if (body.quantity > 0) {
        await tx.activity.create({
          data: {
            userId: adminId,
            snackId: newSnack.id,
            action: 'RESTOCKED',
            amount: body.quantity,
          },
        });
      }

      // 4. Update request status to APPROVED
      const updatedRequest = await tx.snackRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          adminId,
          reviewedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          admin: { select: { id: true, name: true, email: true } },
        },
      });

      // 5. Create notification for the requesting member
      const notification = await tx.notification.create({
        data: {
          userId: request.userId,
          requestId: request.id,
          title: 'Snack Request Approved 🎉',
          message: `Your request for ${request.snackName} has been approved and added to the pantry.`,
          type: 'REQUEST_APPROVED',
        },
      });

      return { request: updatedRequest, snack: newSnack, notification };
    });

    res.json({
      message: `Request for '${result.request.snackName}' approved successfully.`,
      request: result.request,
      snack: result.snack,
    });
  } catch (err) {
    next(err);
  }
};

export const declineRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const adminId = req.user!.id;
    const { reason } = declineRequestSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify that the request exists and is still PENDING
      const request = await tx.snackRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new NotFoundError('Snack request');
      }

      if (request.status !== 'PENDING') {
        throw new ConflictError(
          `Request is already ${request.status.toLowerCase()} and cannot be declined.`,
          'REQUEST_ALREADY_REVIEWED'
        );
      }

      // 2. Update request status to DECLINED
      const updatedRequest = await tx.snackRequest.update({
        where: { id },
        data: {
          status: 'DECLINED',
          adminId,
          adminResponse: reason.trim(),
          reviewedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          admin: { select: { id: true, name: true, email: true } },
        },
      });

      // 3. Create notification for the requesting member
      const notification = await tx.notification.create({
        data: {
          userId: request.userId,
          requestId: request.id,
          title: 'Snack Request Declined',
          message: `Your request for ${request.snackName} was declined. Reason: ${reason.trim()}`,
          type: 'REQUEST_DECLINED',
        },
      });

      return { request: updatedRequest, notification };
    });

    res.json({
      message: `Request for '${result.request.snackName}' has been declined.`,
      request: result.request,
    });
  } catch (err) {
    next(err);
  }
};
