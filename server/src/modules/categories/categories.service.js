const repository = require('./categories.repository');
const { prisma } = require('../../config/database');

const getAll = async () => {
  return repository.findAll();
};

const create = async (data) => {
  const existing = await repository.findByName(data.name);
  if (existing) {
    const error = new Error('Category name already exists.');
    error.statusCode = 409;
    throw error;
  }

  return repository.save(data);
};

const update = async (id, data) => {
  const category = await repository.findById(id);
  if (!category) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  if (data.name && data.name !== category.name) {
    const existing = await repository.findByName(data.name);
    if (existing) {
      const error = new Error('Category name already exists.');
      error.statusCode = 409;
      throw error;
    }
  }

  return repository.update(id, data);
};

const remove = async (id) => {
  const category = await repository.findById(id);
  if (!category) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  // Check if any assets belong to this category
  const assetCount = await prisma.asset.count({
    where: {
      categoryId: id,
    },
  });

  if (assetCount > 0) {
    const error = new Error('Cannot delete category because assets are currently mapped to it.');
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
