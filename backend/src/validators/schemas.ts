import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createSnackSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  category: z.enum(['SWEET', 'SAVOURY', 'DRINK', 'HEALTHY_ISH'], {
    errorMap: () => ({ message: 'Category must be SWEET, SAVOURY, DRINK, or HEALTHY_ISH' }),
  }),
  quantity: z.number().int('Quantity must be an integer').min(0, 'Quantity cannot be negative'),
  lowStockThreshold: z.number().int('Threshold must be an integer').min(1, 'Threshold must be at least 1').default(5),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

export const updateSnackSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  category: z.enum(['SWEET', 'SAVOURY', 'DRINK', 'HEALTHY_ISH']).optional(),
  quantity: z.number().int('Quantity must be an integer').min(0, 'Quantity cannot be negative').optional(),
  lowStockThreshold: z.number().int('Threshold must be an integer').min(1, 'Threshold must be at least 1').optional(),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')).nullable(),
});

export const consumeSchema = z.object({
  amount: z.number().int('Amount must be an integer').min(1, 'Amount must be at least 1'),
});

export const restockSchema = z.object({
  amount: z.number().int('Amount must be an integer').min(1, 'Amount must be at least 1'),
});

// Snack Request schemas
export const createSnackRequestSchema = z.object({
  snackName: z.string().trim().min(2, 'Snack name must be at least 2 characters').max(100, 'Snack name too long'),
  category: z.enum(['SWEET', 'SAVOURY', 'DRINK', 'HEALTHY_ISH'], {
    errorMap: () => ({ message: 'Category must be SWEET, SAVOURY, DRINK, or HEALTHY_ISH' }),
  }),
  reason: z.string().trim().max(500, 'Reason too long').optional().or(z.literal('')),
});

export const approveRequestSchema = z.object({
  quantity: z.number().int('Quantity must be an integer').min(0, 'Quantity cannot be negative').default(10),
  lowStockThreshold: z.number().int('Threshold must be an integer').min(1, 'Threshold must be at least 1').default(5),
});

export const declineRequestSchema = z.object({
  reason: z.string({ required_error: 'Decline reason is required' }).trim().min(1, 'Decline reason cannot be empty').max(500, 'Reason too long'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSnackInput = z.infer<typeof createSnackSchema>;
export type UpdateSnackInput = z.infer<typeof updateSnackSchema>;
export type ConsumeInput = z.infer<typeof consumeSchema>;
export type RestockInput = z.infer<typeof restockSchema>;
export type CreateSnackRequestInput = z.infer<typeof createSnackRequestSchema>;
export type ApproveRequestInput = z.infer<typeof approveRequestSchema>;
export type DeclineRequestInput = z.infer<typeof declineRequestSchema>;
