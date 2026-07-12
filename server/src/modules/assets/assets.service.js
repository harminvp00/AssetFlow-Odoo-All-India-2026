const repository = require('./assets.repository');
const { prisma } = require('../../config/database');

const getAll = async (filters = {}) => {
  return repository.findAll(filters);
};

const getById = async (id) => {
  const asset = await repository.findById(id);
  if (!asset) {
    const error = new Error('Asset not found.');
    error.statusCode = 404;
    throw error;
  }
  return asset;
};

const validateDynamicFields = async (categoryId, dynamicFields) => {
  if (!dynamicFields) return;
  const category = await prisma.assetCategory.findUnique({
    where: { id: categoryId },
  });
  if (!category || !category.schemaConfig) return;

  const config = category.schemaConfig;
  for (const [fieldName, expectedType] of Object.entries(config)) {
    const value = dynamicFields[fieldName];
    if (value === undefined || value === null) continue;

    if (expectedType === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        const error = new Error(`Dynamic field "${fieldName}" must be a number.`);
        error.statusCode = 400;
        throw error;
      }
    } else if (expectedType === 'boolean') {
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        const error = new Error(`Dynamic field "${fieldName}" must be a boolean.`);
        error.statusCode = 400;
        throw error;
      }
    } else if (expectedType === 'date') {
      if (isNaN(Date.parse(value))) {
        const error = new Error(`Dynamic field "${fieldName}" must be a valid date.`);
        error.statusCode = 400;
        throw error;
      }
    }
  }
};

const create = async (data) => {
  const existingTag = await repository.findByTag(data.tag);
  if (existingTag) {
    const error = new Error('Asset tag is already registered.');
    error.statusCode = 409;
    throw error;
  }

  const existingSerial = await repository.findBySerialNumber(data.serialNumber);
  if (existingSerial) {
    const error = new Error('Serial number is already registered.');
    error.statusCode = 409;
    throw error;
  }

  const location = await prisma.location.findUnique({ where: { id: data.locationId } });
  if (!location) {
    const error = new Error('Location not found.');
    error.statusCode = 404;
    throw error;
  }

  const category = await prisma.assetCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  await validateDynamicFields(data.categoryId, data.dynamicFields);

  return repository.save(data);
};

const update = async (id, data) => {
  const asset = await repository.findById(id);
  if (!asset) {
    const error = new Error('Asset not found.');
    error.statusCode = 404;
    throw error;
  }

  if (data.tag && data.tag !== asset.tag) {
    const existingTag = await repository.findByTag(data.tag);
    if (existingTag) {
      const error = new Error('Asset tag is already registered.');
      error.statusCode = 409;
      throw error;
    }
  }

  if (data.serialNumber && data.serialNumber !== asset.serialNumber) {
    const existingSerial = await repository.findBySerialNumber(data.serialNumber);
    if (existingSerial) {
      const error = new Error('Serial number is already registered.');
      error.statusCode = 409;
      throw error;
    }
  }

  const catId = data.categoryId || asset.categoryId;
  const dynFields = data.dynamicFields || asset.dynamicFields;
  if (data.categoryId || data.dynamicFields) {
    await validateDynamicFields(catId, dynFields);
  }

  return repository.update(id, data);
};

const remove = async (id) => {
  const asset = await repository.findById(id);
  if (!asset) {
    const error = new Error('Asset not found.');
    error.statusCode = 404;
    throw error;
  }

  if (asset.status === 'ALLOCATED') {
    const error = new Error('Cannot delete asset because it is currently allocated.');
    error.statusCode = 400;
    throw error;
  }

  if (asset.status === 'UNDER_MAINTENANCE') {
    const error = new Error('Cannot delete asset because it is currently under maintenance.');
    error.statusCode = 400;
    throw error;
  }

  return repository.deleteById(id);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
