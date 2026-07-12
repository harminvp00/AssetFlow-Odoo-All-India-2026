const { z } = require('zod');

const getAll = z.object({
  query: z.object({
    status: z.enum(['read', 'unread']).optional(),
    page: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    limit: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
  }).optional(),
});

const getById = z.object({
  params: z.object({
    id: z.string().uuid('Notification ID must be a valid UUID.'),
  }),
});

module.exports = {
  getAll,
  getById,
};
