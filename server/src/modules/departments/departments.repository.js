const { prisma } = require('../../config/database');

const findAll = async () => {
  return prisma.department.findMany({
    include: {
      head: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { employees: true, assets: true } }
    },
    orderBy: {
      name: 'asc',
    },
  });
};

const save = async (data) => {
  return prisma.department.create({
    data: {
      name: data.name,
      status: data.status !== undefined ? data.status : true,
      parentDepartmentId: data.parentDepartmentId || null,
      headId: data.headId || null,
    },
    include: {
      head: { select: { id: true, firstName: true, lastName: true } }
    }
  });
};

module.exports = {
  findAll,
  save,
};
