const { prisma } = require('../../config/database');

const findAll = async () => {
  return prisma.assetCategory.findMany({
    include: {
      _count: { select: { assets: true } }
    },
    orderBy: {
      name: 'asc',
    },
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

module.exports = {
  findAll,
  save,
};
