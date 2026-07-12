const { z } = require('zod');

const create = z.object({
  body: z.object({
    // Basic validation schema
    name: z.string().min(1, 'Name is required'),
  }),
});

module.exports = {
  create,
};
