const { z } = require('zod');

const create = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required.'),
    startDate: z.string().datetime('Start date must be a valid ISO datetime.'),
    endDate: z.string().datetime('End date must be a valid ISO datetime.'),
    scopeDepartmentId: z.string().uuid('Scope department ID must be a valid UUID.').optional().nullable(),
    scopeLocationId: z.string().uuid('Scope location ID must be a valid UUID.').optional().nullable(),
    auditors: z.array(z.string().uuid('Auditor ID must be a valid UUID.')).optional(),
    auditorIds: z.array(z.string().uuid('Auditor ID must be a valid UUID.')).optional(),
  })
  .refine(
    (data) => {
      const hasDept = !!data.scopeDepartmentId;
      const hasLoc = !!data.scopeLocationId;
      return (hasDept && !hasLoc) || (!hasDept && hasLoc);
    },
    {
      message: 'Exactly one scope (Department or Location) must be provided.',
      path: ['scopeDepartmentId'],
    }
  )
  .refine(
    (data) => new Date(data.startDate) < new Date(data.endDate),
    {
      message: 'Start date must be before end date.',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      const list = data.auditors || data.auditorIds;
      return list && list.length > 0;
    },
    {
      message: 'At least one auditor is required.',
      path: ['auditors'],
    }
  ),
});

const start = z.object({
  params: z.object({
    id: z.string().uuid('Audit cycle ID must be a valid UUID.'),
  }),
});

const verify = z.object({
  params: z.object({
    id: z.string().uuid('Audit cycle ID must be a valid UUID.'),
  }),
  body: z.object({
    assetId: z.string().uuid('Asset ID must be a valid UUID.'),
    status: z.enum(['VERIFIED', 'MISSING', 'DAMAGED'], {
      errorMap: () => ({ message: 'Status must be either VERIFIED, MISSING, or DAMAGED.' }),
    }),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters.').optional().nullable(),
  }),
});

const close = z.object({
  params: z.object({
    id: z.string().uuid('Audit cycle ID must be a valid UUID.'),
  }),
});

const getById = z.object({
  params: z.object({
    id: z.string().uuid('Audit cycle ID must be a valid UUID.'),
  }),
});

const getHistory = z.object({
  params: z.object({
    id: z.string().uuid('Asset ID must be a valid UUID.'),
  }),
});

const getAll = z.object({
  query: z.object({
    status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED']).optional(),
    departmentId: z.string().uuid('Department ID must be a valid UUID.').optional(),
    locationId: z.string().uuid('Location ID must be a valid UUID.').optional(),
    auditorId: z.string().uuid('Auditor ID must be a valid UUID.').optional(),
    page: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    limit: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }).optional(),
});

module.exports = {
  create,
  start,
  verify,
  close,
  getById,
  getHistory,
  getAll,
};
