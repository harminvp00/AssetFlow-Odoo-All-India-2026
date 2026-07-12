const { z } = require('zod');

const create = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
    schemaConfig: z.record(z.enum(['string', 'number', 'boolean', 'date'])).nullable().optional(),
  }),
});

const update = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name must be at least 1 character').optional(),
    schemaConfig: z.record(z.enum(['string', 'number', 'boolean', 'date'])).nullable().optional(),
  }),
});

module.exports = {
  create,
  update,
};
