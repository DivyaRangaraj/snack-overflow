import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import {
  createSnackSchema,
  updateSnackSchema,
  consumeSchema,
  restockSchema,
} from '../validators/schemas';
import {
  NotFoundError,
  ConflictError,
  InsufficientStockError,
  ValidationError,
} from '../utils/errors';
import { getStockStatus, parsePaginationParams, isValidCategory, isValidStockStatus } from '../utils/helpers';
import { Prisma, Category } from '@prisma/client';

// GET /snacks/summary - must be BEFORE the /:id route
export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const snacks = await prisma.snack.findMany({
      select: { quantity: true, lowStockThreshold: true },
    });

    let stocked = 0;
    let runningLow = 0;
    let gone = 0;
    let totalUnits = 0;

    for (const snack of snacks) {
      totalUnits += snack.quantity;
      const status = getStockStatus(snack.quantity, snack.lowStockThreshold);
      if (status === 'STOCKED') stocked++;
      else if (status === 'RUNNING_LOW') runningLow++;
      else gone++;
    }

    // Snack of the Week: highest votes in the last 7 days
    // Tie-breaking: oldest snack (createdAt ASC) wins deterministically
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const voteGroups = await prisma.vote.groupBy({
      by: ['snackId'],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { snackId: true },
      orderBy: [{ _count: { snackId: 'desc' } }],
    });

    let snackOfTheWeek = null;
    if (voteGroups.length > 0) {
      // Handle ties: get the top vote count
      const topVoteCount = voteGroups[0]._count.snackId;
      const topSnackIds = voteGroups
        .filter((g) => g._count.snackId === topVoteCount)
        .map((g) => g.snackId);

      // Among tied snacks, pick the one created earliest
      const winner = await prisma.snack.findFirst({
        where: { id: { in: topSnackIds } },
        orderBy: { createdAt: 'asc' },
        include: {
          _count: { select: { votes: true } },
        },
      });

      if (winner) {
        snackOfTheWeek = {
          ...winner,
          stockStatus: getStockStatus(winner.quantity, winner.lowStockThreshold),
          weeklyVotes: topVoteCount,
          totalVotes: winner._count.votes,
        };
      }
    }

    // If no votes in last 7 days, fall back to all-time most voted
    if (!snackOfTheWeek) {
      const allTimeTop = await prisma.snack.findFirst({
        orderBy: { votes: { _count: 'desc' } },
        include: { _count: { select: { votes: true } } },
      });
      if (allTimeTop) {
        snackOfTheWeek = {
          ...allTimeTop,
          stockStatus: getStockStatus(allTimeTop.quantity, allTimeTop.lowStockThreshold),
          weeklyVotes: 0,
          totalVotes: allTimeTop._count.votes,
        };
      }
    }

    res.json({
      totalTypes: snacks.length,
      stocked,
      runningLow,
      gone,
      totalUnits,
      snackOfTheWeek,
    });
  } catch (err) {
    next(err);
  }
}

// GET /snacks
export async function getSnacks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, status, search, page, limit, sort } = req.query;
    const { page: parsedPage, limit: parsedLimit, skip } = parsePaginationParams(page, limit);

    // Build where clause
    const where: Prisma.SnackWhereInput = {};

    if (category && typeof category === 'string' && isValidCategory(category)) {
      where.category = category as Category;
    }

    if (search && typeof search === 'string' && search.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    // Status filter
    if (status && typeof status === 'string' && isValidStockStatus(status)) {
      if (status === 'GONE') {
        where.quantity = 0;
      } else if (status === 'STOCKED' || status === 'RUNNING_LOW') {
        where.quantity = { gt: 0 };
      }
    }

    // Build orderBy
    let orderBy: Prisma.SnackOrderByWithRelationInput | Prisma.SnackOrderByWithRelationInput[] = { createdAt: 'desc' };
    if (sort === 'name') orderBy = { name: 'asc' };
    else if (sort === 'quantity_asc') orderBy = { quantity: 'asc' };
    else if (sort === 'quantity_desc') orderBy = { quantity: 'desc' };
    else if (sort === 'votes') orderBy = { votes: { _count: 'desc' } };

    const userId = req.user?.id || '';
    const overallTotal = await prisma.snack.count();

    // If filtering by derived status (STOCKED or RUNNING_LOW), threshold varies per snack
    if (status === 'RUNNING_LOW' || status === 'STOCKED') {
      const allSnacks = await prisma.snack.findMany({
        where: { ...where, quantity: { gt: 0 } },
        include: {
          _count: { select: { votes: true } },
          votes: { where: { userId }, select: { id: true } },
        },
        orderBy,
      });

      const filtered = status === 'RUNNING_LOW'
        ? allSnacks.filter((s) => s.quantity > 0 && s.quantity <= s.lowStockThreshold)
        : allSnacks.filter((s) => s.quantity > s.lowStockThreshold);

      const total = filtered.length;
      const paginated = filtered.slice(skip, skip + parsedLimit);

      res.json({
        snacks: paginated.map((s) => ({
          ...s,
          stockStatus: getStockStatus(s.quantity, s.lowStockThreshold),
          voteCount: s._count.votes,
          userVoted: s.votes.length > 0,
          votes: undefined,
          _count: undefined,
        })),
        pagination: {
          total,
          overallTotal,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
        },
      });
      return;
    }

    const [snacks, total] = await prisma.$transaction([
      prisma.snack.findMany({
        where,
        skip,
        take: parsedLimit,
        include: {
          _count: { select: { votes: true } },
          votes: { where: { userId }, select: { id: true } },
        },
        orderBy,
      }),
      prisma.snack.count({ where }),
    ]);

    res.json({
      snacks: snacks.map((s) => ({
        ...s,
        stockStatus: getStockStatus(s.quantity, s.lowStockThreshold),
        voteCount: s._count.votes,
        userVoted: s.votes.length > 0,
        votes: undefined,
        _count: undefined,
      })),
      pagination: {
        total,
        overallTotal,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /snacks/:id
export async function getSnack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id || '';

    const snack = await prisma.snack.findUnique({
      where: { id },
      include: {
        _count: { select: { votes: true } },
        votes: { where: { userId }, select: { id: true } },
      },
    });

    if (!snack) throw new NotFoundError('Snack');

    res.json({
      ...snack,
      stockStatus: getStockStatus(snack.quantity, snack.lowStockThreshold),
      voteCount: snack._count.votes,
      userVoted: snack.votes.length > 0,
      votes: undefined,
      _count: undefined,
    });
  } catch (err) {
    next(err);
  }
}

// POST /snacks
export async function createSnack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createSnackSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }

    const { name, category, quantity, lowStockThreshold, imageUrl } = parsed.data;

    // Check unique name
    const existing = await prisma.snack.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictError(`A snack named "${name}" already exists.`);
    }

    const snack = await prisma.snack.create({
      data: {
        name,
        category,
        quantity,
        lowStockThreshold,
        imageUrl: imageUrl || null,
      },
    });

    res.status(201).json({
      ...snack,
      stockStatus: getStockStatus(snack.quantity, snack.lowStockThreshold),
      voteCount: 0,
      userVoted: false,
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /snacks/:id
export async function updateSnack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const parsed = updateSnackSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }

    const existing = await prisma.snack.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Snack');

    if (parsed.data.name && parsed.data.name !== existing.name) {
      const nameConflict = await prisma.snack.findUnique({ where: { name: parsed.data.name } });
      if (nameConflict) throw new ConflictError(`A snack named "${parsed.data.name}" already exists.`);
    }

    const { imageUrl, ...rest } = parsed.data;
    const updateData: Prisma.SnackUpdateInput = { ...rest };
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl === '' ? null : imageUrl;
    }

    const [snack, voteCount] = await Promise.all([
      prisma.snack.update({
        where: { id },
        data: updateData,
      }),
      prisma.vote.count({ where: { snackId: id } }),
    ]);

    res.json({
      ...snack,
      stockStatus: getStockStatus(snack.quantity, snack.lowStockThreshold),
      voteCount,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /snacks/:id
export async function deleteSnack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const existing = await prisma.snack.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Snack');

    // Cascade delete activities and votes first to preserve relational integrity
    await prisma.activity.deleteMany({ where: { snackId: id } });
    await prisma.vote.deleteMany({ where: { snackId: id } });
    await prisma.snack.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// POST /snacks/:id/consume
export async function consumeSnack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const parsed = consumeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }

    const { amount } = parsed.data;

    // Check snack exists first
    const snack = await prisma.snack.findUnique({ where: { id } });
    if (!snack) throw new NotFoundError('Snack');

    // ATOMIC STOCK DECREMENT using conditional raw SQL inside interactive transaction
    // UPDATE "Snack" SET quantity = quantity - amount WHERE id = id AND quantity >= amount
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.$executeRaw`
        UPDATE "Snack"
        SET quantity = quantity - ${amount},
            "updatedAt" = NOW()
        WHERE id = ${id}
        AND quantity >= ${amount}
      `;

      if (updated === 0) {
        throw new InsufficientStockError();
      }

      // Record activity in the exact same transaction
      const activity = await tx.activity.create({
        data: { userId, snackId: id, action: 'CONSUMED', amount },
      });

      const updatedSnack = await tx.snack.findUnique({
        where: { id },
      });

      return { snack: updatedSnack, activity };
    });

    if (!result.snack) throw new NotFoundError('Snack');

    const [voteCount, userVote] = await Promise.all([
      prisma.vote.count({ where: { snackId: id } }),
      prisma.vote.findUnique({
        where: { userId_snackId: { userId, snackId: id } },
      }),
    ]);

    res.json({
      ...result.snack,
      stockStatus: getStockStatus(result.snack.quantity, result.snack.lowStockThreshold),
      voteCount,
      userVoted: !!userVote,
    });
  } catch (err) {
    next(err);
  }
}

// POST /snacks/:id/restock
export async function restockSnack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const parsed = restockSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }

    const { amount } = parsed.data;

    const snack = await prisma.snack.findUnique({ where: { id } });
    if (!snack) throw new NotFoundError('Snack');

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.snack.update({
        where: { id },
        data: { quantity: { increment: amount } },
      });

      await tx.activity.create({
        data: { userId, snackId: id, action: 'RESTOCKED', amount },
      });

      return updated;
    });

    const voteCount = await prisma.vote.count({ where: { snackId: id } });

    res.json({
      ...result,
      stockStatus: getStockStatus(result.quantity, result.lowStockThreshold),
      voteCount,
    });
  } catch (err) {
    next(err);
  }
}

// POST /snacks/:id/vote
export async function voteSnack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const snack = await prisma.snack.findUnique({ where: { id } });
    if (!snack) throw new NotFoundError('Snack');

    try {
      await prisma.vote.create({ data: { userId, snackId: id } });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError('You have already voted for this snack.', 'DUPLICATE_VOTE');
      }
      throw err;
    }

    const voteCount = await prisma.vote.count({ where: { snackId: id } });

    res.status(201).json({
      message: 'Vote recorded successfully.',
      voteCount,
      userVoted: true,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /snacks/:id/vote
export async function unvoteSnack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const snack = await prisma.snack.findUnique({ where: { id } });
    if (!snack) throw new NotFoundError('Snack');

    const vote = await prisma.vote.findUnique({
      where: { userId_snackId: { userId, snackId: id } },
    });

    if (!vote) throw new NotFoundError('Vote');

    await prisma.vote.delete({
      where: { userId_snackId: { userId, snackId: id } },
    });

    const voteCount = await prisma.vote.count({ where: { snackId: id } });

    res.json({
      message: 'Vote removed successfully.',
      voteCount,
      userVoted: false,
    });
  } catch (err) {
    next(err);
  }
}

// GET /snacks/activity - admin activity feed
export async function getActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, action, snackId, userId: filterUserId } = req.query;
    const { page: parsedPage, limit: parsedLimit, skip } = parsePaginationParams(page, limit);

    const where: Prisma.ActivityWhereInput = {};
    if (action === 'CONSUMED' || action === 'RESTOCKED') where.action = action;
    if (snackId && typeof snackId === 'string') where.snackId = snackId;
    if (filterUserId && typeof filterUserId === 'string') where.userId = filterUserId;

    const [activities, total] = await prisma.$transaction([
      prisma.activity.findMany({
        where,
        skip,
        take: parsedLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          snack: { select: { id: true, name: true, category: true, imageUrl: true } },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    res.json({
      activities,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /snacks/popular
export async function getPopularSnacks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id || '';
    const snacks = await prisma.snack.findMany({
      take: 5,
      orderBy: { votes: { _count: 'desc' } },
      include: {
        _count: { select: { votes: true } },
        votes: { where: { userId }, select: { id: true } },
      },
    });

    res.json({
      snacks: snacks.map((s) => ({
        ...s,
        stockStatus: getStockStatus(s.quantity, s.lowStockThreshold),
        voteCount: s._count.votes,
        userVoted: s.votes.length > 0,
        votes: undefined,
        _count: undefined,
      })),
    });
  } catch (err) {
    next(err);
  }
}
