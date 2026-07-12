const { z } = require('zod');

const create = z.object({
  body: z.object({
    assetId: z.string().uuid('Asset ID must be a valid UUID.'),
    startTime: z.string().datetime('Invalid datetime format.'),
    endTime: z.string().datetime('Invalid datetime format.'),
  }).refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return end > start;
    },
    {
      message: 'Booking end time must be after the start time.',
      path: ['endTime'],
    }
  ),
});

const cancel = z.object({
  params: z.object({
    id: z.string().uuid('Booking ID must be a valid UUID.'),
  }),
});

const getById = z.object({
  params: z.object({
    id: z.string().uuid('Booking ID must be a valid UUID.'),
  }),
});

const getByUser = z.object({
  params: z.object({
    userId: z.string().uuid('User ID must be a valid UUID.'),
  }),
});

const getByAsset = z.object({
  params: z.object({
    assetId: z.string().uuid('Asset ID must be a valid UUID.'),
  }),
});

const getAll = z.object({
  query: z.object({
    status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
    assetId: z.string().uuid('Asset ID must be a valid UUID.').optional().nullable(),
    userId: z.string().uuid('User ID must be a valid UUID.').optional().nullable(),
    page: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    limit: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    startDate: z.string().datetime('Invalid datetime format.').optional(),
    endDate: z.string().datetime('Invalid datetime format.').optional(),
  }),
});

const getCalendar = z.object({
  query: z.object({
    startRange: z.string().datetime('Invalid datetime format.').optional(),
    endRange: z.string().datetime('Invalid datetime format.').optional(),
    assetId: z.string().uuid('Asset ID must be a valid UUID.').optional(),
  }).optional(),
});

const getUpcoming = z.object({
  query: z.object({
    page: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    limit: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
  }).optional(),
});

module.exports = {
  create,
  cancel,
  getById,
  getByUser,
  getByAsset,
  getAll,
  getCalendar,
  getUpcoming,
};
