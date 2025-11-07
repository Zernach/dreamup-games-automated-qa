import { z } from 'zod';

// Test creation validation
export const createTestSchema = z.object({
  gameUrl: z.string().url('Invalid URL').startsWith('http', 'URL must start with http:// or https://'),
  options: z.object({
    timeout: z.number().int().min(10000).max(300000).optional().default(180000),
    screenshotCount: z.number().int().min(1).max(50).optional().default(50),
  }).optional(),
});

export type CreateTestInput = z.infer<typeof createTestSchema>;

// List tests query validation
export const listTestsQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 20),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'partial']).optional(),
});

export type ListTestsQuery = z.infer<typeof listTestsQuerySchema>;
