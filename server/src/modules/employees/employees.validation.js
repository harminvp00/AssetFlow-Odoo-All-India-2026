const { z } = require('zod');

const promote = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'], {
      required_error: 'Role is required',
    }),
    departmentId: z.string().uuid().nullable().optional(),
    status: z.boolean().optional(),
  }),
});

module.exports = {
  promote,
};
