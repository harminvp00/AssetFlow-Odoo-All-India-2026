const { z } = require('zod');

const create = z.object({
  body: z.object({
    assetId: z.string().uuid('Asset ID must be a valid UUID.'),
    employeeId: z.string().uuid('Employee ID must be a valid UUID.').optional().nullable(),
    departmentId: z.string().uuid('Department ID must be a valid UUID.').optional().nullable(),
    expectedReturnDate: z.string()
      .refine((val) => !isNaN(Date.parse(val)), { message: 'Expected return date must be a valid date.' })
      .refine((val) => new Date(val) > new Date(), { message: 'Expected return date must be in the future.' })
      .optional()
      .nullable(),
  }).refine(
    (data) => {
      const hasEmployee = !!data.employeeId;
      const hasDepartment = !!data.departmentId;
      return (hasEmployee || hasDepartment) && !(hasEmployee && hasDepartment);
    },
    {
      message: 'Must allocate to either an employee or a department, but not both.',
      path: ['employeeId'],
    }
  ),
});

const returnAsset = z.object({
  params: z.object({
    id: z.string().uuid('Allocation ID must be a valid UUID.'),
  }),
  body: z.object({
    checkInNotes: z.string().optional().nullable(),
    condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR']).optional(),
  }),
});

const getById = z.object({
  params: z.object({
    id: z.string().uuid('Allocation ID must be a valid UUID.'),
  }),
});

const getAll = z.object({
  query: z.object({
    status: z.enum(['ACTIVE', 'RETURNED']).optional(),
    employeeId: z.string().uuid('Employee ID must be a valid UUID.').optional().nullable(),
    departmentId: z.string().uuid('Department ID must be a valid UUID.').optional().nullable(),
    assetId: z.string().uuid('Asset ID must be a valid UUID.').optional().nullable(),
    page: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    limit: z.preprocess((val) => (val ? parseInt(val, 10) : undefined), z.number().int().positive().optional()),
    search: z.string().optional(),
  }),
});

module.exports = {
  create,
  returnAsset,
  getById,
  getAll,
};
