const { prisma } = require('../../config/database');

const findAll = async () => {
  return prisma.location.findMany({
    include: {
      _count: { select: { assets: true } }
    },
    orderBy: {
      name: 'asc',
    },
  });
};

const save = async (data) => {
  return prisma.location.create({
    data: {
      name: data.name,
      description: data.description || null,
      status: data.status !== undefined ? data.status : true,
    },
  });
};

module.exports = {
  findAll,
  save,
};
