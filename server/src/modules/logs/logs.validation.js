const { z } = require('zod');

const getAll = z.object({
  query: z.object({
    page: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    limit: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    module: z.string().optional(),
    action: z.string().optional(),
    userId: z.string().uuid('User ID must be a valid UUID.').optional(),
    assetId: z.string().uuid('Asset ID must be a valid UUID.').optional(),
    startDate: z.string().datetime('Start date must be a valid ISO datetime.').optional(),
    endDate: z.string().datetime('End date must be a valid ISO datetime.').optional(),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }).optional(),
});

const getAssetHistory = z.object({
  params: z.object({
    assetId: z.string().uuid('Asset ID must be a valid UUID.'),
  }),
});

const getUserActivity = z.object({
  params: z.object({
    userId: z.string().uuid('User ID must be a valid UUID.'),
  }),
});

module.exports = {
  getAll,
  getAssetHistory,
  getUserActivity,
};
