const { prisma } = require('../../config/database');

const getClient = (tx) => tx || prisma;

const createTransferRequest = async (data, tx) => {
  const client = getClient(tx);
  return client.transferRequest.create({
    data: {
      assetId: data.assetId,
      fromEmployeeId: data.fromEmployeeId || null,
      toEmployeeId: data.toEmployeeId || null,
      fromDepartmentId: data.fromDepartmentId || null,
      toDepartmentId: data.toDepartmentId || null,
      requestedById: data.requestedById,
      status: 'PENDING',
    },
  });
};

const findTransferById = async (id, tx) => {
  const client = getClient(tx);
  return client.transferRequest.findUnique({
    where: { id },
    include: {
      asset: true,
      fromEmployee: { select: { id: true, name: true, email: true } },
      toEmployee: { select: { id: true, name: true, email: true } },
      fromDepartment: true,
      toDepartment: true,
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });
};

const findPendingTransferByAssetId = async (assetId, tx) => {
  const client = getClient(tx);
  return client.transferRequest.findFirst({
    where: {
      assetId,
      status: 'PENDING',
    },
  });
};

const findTransfers = async (filters = {}, tx) => {
  const client = getClient(tx);
  const where = {};
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.requestedById) {
    where.requestedById = filters.requestedById;
  }
  if (filters.assetId) {
    where.assetId = filters.assetId;
  }

  return client.transferRequest.findMany({
    where,
    include: {
      asset: true,
      fromEmployee: { select: { id: true, name: true } },
      toEmployee: { select: { id: true, name: true } },
      fromDepartment: true,
      toDepartment: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const updateTransferStatus = async (id, status, approvedById, tx) => {
  const client = getClient(tx);
  return client.transferRequest.update({
    where: { id },
    data: {
      status,
      approvedById: approvedById || null,
    },
    include: {
      asset: true,
      fromEmployee: true,
      toEmployee: true,
      fromDepartment: true,
      toDepartment: true,
    },
  });
};

const findActiveAllocationByAssetId = async (assetId, tx) => {
  const client = getClient(tx);
  return client.allocation.findFirst({
    where: {
      assetId,
      status: 'ACTIVE',
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      department: true,
    },
  });
};

const closeAllocation = async (allocationId, data, tx) => {
  const client = getClient(tx);
  return client.allocation.update({
    where: { id: allocationId },
    data: {
      actualReturnDate: data.actualReturnDate ? new Date(data.actualReturnDate) : new Date(),
      status: 'RETURNED',
      checkInNotes: data.checkInNotes,
    },
  });
};

const createNewAllocation = async (data, tx) => {
  const client = getClient(tx);
  return client.allocation.create({
    data: {
      assetId: data.assetId,
      employeeId: data.employeeId || null,
      departmentId: data.departmentId || null,
      allocatedById: data.allocatedById,
      status: 'ACTIVE',
    },
  });
};

const findAssetById = async (assetId, tx) => {
  const client = getClient(tx);
  return client.asset.findUnique({
    where: { id: assetId },
  });
};

const findEmployeeById = async (employeeId, tx) => {
  const client = getClient(tx);
  return client.user.findUnique({
    where: { id: employeeId },
  });
};

const findDepartmentById = async (departmentId, tx) => {
  const client = getClient(tx);
  return client.department.findUnique({
    where: { id: departmentId },
  });
};

module.exports = {
  createTransferRequest,
  findTransferById,
  findPendingTransferByAssetId,
  findTransfers,
  updateTransferStatus,
  findActiveAllocationByAssetId,
  closeAllocation,
  createNewAllocation,
  findAssetById,
  findEmployeeById,
  findDepartmentById,
};
