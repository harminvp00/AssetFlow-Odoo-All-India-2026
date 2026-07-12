const { z } = require('zod');

const create = z.object({
  body: z.object({
    name: z.string().min(1, 'Location name is required'),
    description: z.string().optional().nullable(),
  }),
});

const update = z.object({
  body: z.object({
    name: z.string().min(1, 'Location name must be at least 1 character').optional(),
    description: z.string().optional().nullable(),
    status: z.boolean().optional(),
  }),
});

module.exports = {
  create,
  update,
};
