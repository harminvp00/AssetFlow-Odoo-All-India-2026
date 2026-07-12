const { z } = require('zod');

const create = z.object({
  body: z.object({
    assetId: z.string().uuid('Asset ID must be a valid UUID.'),
    issueDescription: z.string().min(1, 'Issue description is required.').max(500, 'Issue description cannot exceed 500 characters.'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
      required_error: 'Priority is required.',
      invalid_type_error: 'Invalid priority level.',
    }),
    photoUrl: z.string().url('Photo URL must be a valid URL.').optional().nullable().or(z.string().length(0)),
  }),
});

const approve = z.object({
  params: z.object({
    id: z.string().uuid('Maintenance Request ID must be a valid UUID.'),
  }),
});

const reject = z.object({
  params: z.object({
    id: z.string().uuid('Maintenance Request ID must be a valid UUID.'),
  }),
  body: z.object({
    rejectionReason: z.string().optional(),
  }).optional(),
});

const assign = z.object({
  params: z.object({
    id: z.string().uuid('Maintenance Request ID must be a valid UUID.'),
  }),
  body: z.object({
    technicianId: z.string().uuid('Technician ID must be a valid UUID.'),
  }),
});

const start = z.object({
  params: z.object({
    id: z.string().uuid('Maintenance Request ID must be a valid UUID.'),
  }),
});

const resolve = z.object({
  params: z.object({
    id: z.string().uuid('Maintenance Request ID must be a valid UUID.'),
  }),
  body: z.object({
    resolutionNotes: z.string().min(1, 'Resolution notes are required.').max(1000, 'Resolution notes cannot exceed 1000 characters.'),
  }),
});

const getById = z.object({
  params: z.object({
    id: z.string().uuid('Maintenance Request ID must be a valid UUID.'),
  }),
});

const getAll = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS', 'RESOLVED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    assetId: z.string().uuid('Asset ID must be a valid UUID.').optional(),
    raisedBy: z.string().uuid('User ID must be a valid UUID.').optional(),
    technicianId: z.string().uuid('Technician ID must be a valid UUID.').optional(),
    page: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    limit: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

const getPending = z.object({
  query: z.object({}).optional(),
});

const getHistory = z.object({
  params: z.object({
    assetId: z.string().uuid('Asset ID must be a valid UUID.'),
  }),
});

module.exports = {
  create,
  approve,
  reject,
  assign,
  start,
  resolve,
  getById,
  getAll,
  getPending,
  getHistory,
};
