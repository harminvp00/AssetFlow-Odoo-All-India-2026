const { z } = require('zod');

const create = z.object({
  body: z.object({
    tag: z.string().min(1, 'Asset tag is required'),
    name: z.string().min(1, 'Asset name is required'),
    serialNumber: z.string().min(1, 'Serial number is required'),
    acquisitionDate: z.string().datetime('Acquisition date must be a valid ISO timestamp'),
    acquisitionCost: z.coerce.number().min(0, 'Acquisition cost must be positive'),
    condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR']).default('NEW'),
    status: z.enum(['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED']).default('AVAILABLE'),
    locationId: z.string().uuid('Invalid location UUID'),
    categoryId: z.string().uuid('Invalid category UUID'),
    departmentId: z.string().uuid('Invalid department UUID').nullable().optional(),
    isSharedBookable: z.boolean().default(false),
    photoUrl: z.string().url('Invalid photo URL').nullable().optional(),
    documentUrls: z.array(z.string().url('Invalid document URL')).optional(),
    dynamicFields: z.record(z.any()).optional(),
  }),
});

const update = z.object({
  body: z.object({
    tag: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    serialNumber: z.string().min(1).optional(),
    acquisitionDate: z.string().datetime().optional(),
    acquisitionCost: z.coerce.number().min(0).optional(),
    condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR']).optional(),
    status: z.enum(['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED']).optional(),
    locationId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    departmentId: z.string().uuid().nullable().optional(),
    isSharedBookable: z.boolean().optional(),
    photoUrl: z.string().url().nullable().optional(),
    documentUrls: z.array(z.string().url()).optional(),
    dynamicFields: z.record(z.any()).optional(),
  }),
});

module.exports = {
  create,
  update,
};
