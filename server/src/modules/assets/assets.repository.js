const { prisma } = require('../../config/database');

const findAll = async (filters = {}) => {
  const where = {};

  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.status) where.status = filters.status;
  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.locationId) where.locationId = filters.locationId;

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { tag: { contains: filters.search, mode: 'insensitive' } },
      { serialNumber: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.asset.findMany({
    where,
    include: {
      location: true,
      category: true,
      department: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const findById = async (id) => {
  return prisma.asset.findUnique({
    where: { id },
    include: {
      location: true,
      category: true,
      department: true,
    },
  });
};

const findByTag = async (tag) => {
  return prisma.asset.findUnique({
    where: { tag },
    include: {
      location: true,
      category: true,
      department: true,
    },
  });
};

const findBySerialNumber = async (serialNumber) => {
  return prisma.asset.findUnique({
    where: { serialNumber },
    include: {
      location: true,
      category: true,
      department: true,
    },
  });
};

const save = async (data) => {
  return prisma.asset.create({
    data: {
      tag: data.tag,
      name: data.name,
      serialNumber: data.serialNumber,
      acquisitionDate: new Date(data.acquisitionDate),
      acquisitionCost: data.acquisitionCost,
      condition: data.condition,
      status: data.status,
      locationId: data.locationId,
      categoryId: data.categoryId,
      departmentId: data.departmentId || null,
      isSharedBookable: data.isSharedBookable || false,
      photoUrl: data.photoUrl || null,
      documentUrls: data.documentUrls || [],
      dynamicFields: data.dynamicFields || null,
    },
    include: {
      location: true,
      category: true,
      department: true,
    },
  });
};

const update = async (id, data) => {
  return prisma.asset.update({
    where: { id },
    data: {
      tag: data.tag,
      name: data.name,
      serialNumber: data.serialNumber,
      acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : undefined,
      acquisitionCost: data.acquisitionCost,
      condition: data.condition,
      status: data.status,
      locationId: data.locationId,
      categoryId: data.categoryId,
      departmentId: Object.prototype.hasOwnProperty.call(data, 'departmentId') ? data.departmentId : undefined,
      isSharedBookable: data.isSharedBookable,
      photoUrl: data.photoUrl,
      documentUrls: data.documentUrls,
      dynamicFields: data.dynamicFields,
    },
    include: {
      location: true,
      category: true,
      department: true,
    },
  });
};

const deleteById = async (id) => {
  return prisma.asset.delete({
    where: { id },
  });
};

module.exports = {
  findAll,
  findById,
  findByTag,
  findBySerialNumber,
  save,
  update,
  deleteById,
};
