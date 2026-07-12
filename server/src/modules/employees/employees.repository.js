const { prisma } = require('../../config/database');

const findAll = async () => {
  return prisma.user.findMany({
    include: {
      department: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
};

const findById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      department: true,
    },
  });
};

const update = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data: {
      role: data.role,
      departmentId: data.departmentId,
      status: data.status,
    },
    include: {
      department: true,
    },
  });
};

module.exports = {
  findAll,
  findById,
  update,
};
