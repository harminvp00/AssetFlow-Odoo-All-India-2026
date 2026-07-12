const { prisma } = require('../../config/database');

const findByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

const findById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

const save = async (data) => {
  const parts = (data.name || '').trim().split(/\s+/);
  const firstName = parts[0] || 'Unknown';
  const lastName = parts.slice(1).join(' ') || 'User';

  return prisma.user.create({
    data: {
      email: data.email,
      password: data.password,
      firstName,
      lastName,
      name: data.name || `${firstName} ${lastName}`,
      role: 'PROCUREMENT_OFFICER',
    },
  });
};

module.exports = {
  findByEmail,
  findById,
  save,
};
