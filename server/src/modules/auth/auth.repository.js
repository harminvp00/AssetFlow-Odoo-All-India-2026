const { prisma } = require('../../config/database');

const findByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
    include: {
      department: true,
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

const save = async (data) => {
  return prisma.user.create({
    data: {
      email: data.email,
      password: data.password,
      name: data.name,
      role: 'EMPLOYEE',
      status: true,
    },
  });
};

module.exports = {
  findByEmail,
  findById,
  save,
};
