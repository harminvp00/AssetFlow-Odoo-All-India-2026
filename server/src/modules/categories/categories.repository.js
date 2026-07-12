const { prisma } = require('../../config/database');

const findAll = async () => {
  return prisma.assetCategory.findMany({
    orderBy: {
      name: 'asc',
    },
  });
};

const findById = async (id) => {
  return prisma.assetCategory.findUnique({
    where: { id },
  });
};

const findByName = async (name) => {
  return prisma.assetCategory.findUnique({
    where: { name },
  });
};

const save = async (data) => {
  return prisma.assetCategory.create({
    data: {
      name: data.name,
      schemaConfig: data.schemaConfig || null,
    },
  });
};

const update = async (id, data) => {
  return prisma.assetCategory.update({
    where: { id },
    data: {
      name: data.name,
      schemaConfig: data.schemaConfig,
    },
  });
};

const deleteById = async (id) => {
  return prisma.assetCategory.delete({
    where: { id },
  });
};

module.exports = {
  findAll,
  findById,
  findByName,
  save,
  update,
  deleteById,
};
