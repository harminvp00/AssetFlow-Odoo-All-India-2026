const repository = require('./locations.repository');
const { prisma } = require('../../config/database');

const getAll = async () => {
  return repository.findAll();
};

const create = async (data) => {
  const existing = await repository.findByName(data.name);
  if (existing) {
    const error = new Error('Location name already exists.');
    error.statusCode = 409;
    throw error;
  }

  return repository.save(data);
};

const update = async (id, data) => {
  const location = await repository.findById(id);
  if (!location) {
    const error = new Error('Location not found.');
    error.statusCode = 404;
    throw error;
  }

  if (data.name && data.name !== location.name) {
    const existing = await repository.findByName(data.name);
    if (existing) {
      const error = new Error('Location name already exists.');
      error.statusCode = 409;
      throw error;
    }
  }

  return repository.update(id, data);
};

const remove = async (id) => {
  const location = await repository.findById(id);
  if (!location) {
    const error = new Error('Location not found.');
    error.statusCode = 404;
    throw error;
  }

  // Check if any assets are mapped to this location
  const assetCount = await prisma.asset.count({
    where: {
      locationId: id,
    },
  });

  if (assetCount > 0) {
    const error = new Error('Cannot delete location because assets are currently mapped to it.');
    error.statusCode = 400;
    throw error;
  }

  return repository.deleteById(id);
};

module.exports = {
  getAll,
  create,
  update,
  remove,
};
