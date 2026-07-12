const { prisma } = require('../../config/database');

const findAll = async () => {
  return prisma.department.findMany({
    include: {
      parentDepartment: true,
      head: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
};

const findById = async (id) => {
  return prisma.department.findUnique({
    where: { id },
    include: {
      parentDepartment: true,
      head: true,
    },
  });
};

const findByName = async (name) => {
  return prisma.department.findUnique({
    where: { name },
    include: {
      parentDepartment: true,
      head: true,
    },
  });
};

const save = async (data) => {
  return prisma.department.create({
    data: {
      name: data.name,
      parentDepartmentId: data.parentDepartmentId || null,
      headId: data.headId || null,
      status: true,
    },
    include: {
      parentDepartment: true,
      head: true,
    },
  });
};

const update = async (id, data) => {
  return prisma.department.update({
    where: { id },
    data: {
      name: data.name,
      parentDepartmentId: Object.prototype.hasOwnProperty.call(data, 'parentDepartmentId') ? data.parentDepartmentId : undefined,
      headId: Object.prototype.hasOwnProperty.call(data, 'headId') ? data.headId : undefined,
      status: data.status,
    },
    include: {
      parentDepartment: true,
      head: true,
    },
  });
};

const deleteById = async (id) => {
  return prisma.department.update({
    where: { id },
    data: { status: false },
    include: {
      parentDepartment: true,
      head: true,
    },
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
