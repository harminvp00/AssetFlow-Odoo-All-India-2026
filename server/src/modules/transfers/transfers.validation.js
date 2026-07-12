const { z } = require('zod');

const create = z.object({
  body: z.object({
    assetId: z.string().uuid('Asset ID must be a valid UUID.'),
    toEmployeeId: z.string().uuid('Employee ID must be a valid UUID.').optional().nullable(),
    toDepartmentId: z.string().uuid('Department ID must be a valid UUID.').optional().nullable(),
    reason: z.string().min(3, 'Reason is required and must be at least 3 characters long.'),
  }).refine(
    (data) => {
      const hasEmployee = !!data.toEmployeeId;
      const hasDepartment = !!data.toDepartmentId;
      return (hasEmployee || hasDepartment) && !(hasEmployee && hasDepartment);
    },
    {
      message: 'Must transfer to either an employee or a department, but not both.',
      path: ['toEmployeeId'],
    }
  ),
});

const approve = z.object({
  params: z.object({
    id: z.string().uuid('Transfer Request ID must be a valid UUID.'),
  }),
});

const reject = z.object({
  params: z.object({
    id: z.string().uuid('Transfer Request ID must be a valid UUID.'),
  }),
  body: z.object({
    rejectionReason: z.string().optional(),
  }),
});

const getById = z.object({
  params: z.object({
    id: z.string().uuid('Transfer Request ID must be a valid UUID.'),
  }),
});

const getAll = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    assetId: z.string().uuid('Asset ID must be a valid UUID.').optional().nullable(),
    requesterId: z.string().uuid('Requester ID must be a valid UUID.').optional().nullable(),
    approverId: z.string().uuid('Approver ID must be a valid UUID.').optional().nullable(),
    page: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    limit: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    search: z.string().optional(),
  }),
});

const getPending = z.object({
  query: z.object({
    page: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    limit: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
  }).optional(),
});

module.exports = {
  create,
  approve,
  reject,
  getById,
  getAll,
  getPending,
};
