const { z } = require('zod');

const create = z.object({
  body: z.object({
    name: z.string().min(1, 'Department name is required'),
    parentDepartmentId: z.string().uuid().nullable().optional(),
    headId: z.string().uuid().nullable().optional(),
  }),
});

const update = z.object({
  body: z.object({
    name: z.string().min(1, 'Department name must be at least 1 character').optional(),
    parentDepartmentId: z.string().uuid().nullable().optional(),
    headId: z.string().uuid().nullable().optional(),
    status: z.boolean().optional(),
  }),
});

module.exports = {
  create,
  update,
};
