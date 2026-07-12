const { prisma } = require('../../config/database');

const getClient = (tx) => tx || prisma;

const createAuditCycle = async (data, tx) => {
  const client = getClient(tx);
  const { name, startDate, endDate, auditors } = data;
  
  const auditorConnections = auditors && auditors.length > 0 
    ? { connect: auditors.map(id => ({ id })) }
    : undefined;

  return client.auditCycle.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      scopeDepartmentId: data.scopeDepartmentId || null,
      scopeLocationId: data.scopeLocationId || null,
      auditors: auditorConnections,
      status: 'DRAFT',
    },
    include: {
      auditors: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

const findAuditCycleById = async (id, tx) => {
  const client = getClient(tx);
  return client.auditCycle.findUnique({
    where: { id },
    include: {
      auditors: {
        select: { id: true, name: true, email: true },
      },
      scopeDepartment: true,
      scopeLocation: true,
      records: {
        include: {
          asset: true,
          auditor: { select: { id: true, name: true } },
        },
      },
    },
  });
};

const findAuditCycles = async (filters = {}, tx) => {
  const client = getClient(tx);
  const where = {};
  if (filters.status) {
    where.status = filters.status;
  }
  return client.auditCycle.findMany({
    where,
    include: {
      auditors: {
        select: { id: true, name: true },
      },
      scopeDepartment: true,
      scopeLocation: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const updateAuditCycle = async (id, data, tx) => {
  const client = getClient(tx);
  const updateData = { ...data };

  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  if (data.auditors) {
    updateData.auditors = {
      set: data.auditors.map(auditorId => ({ id: auditorId })),
    };
  }

  return client.auditCycle.update({
    where: { id },
    data: updateData,
    include: {
      auditors: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

const assignAuditors = async (id, auditorIds, tx) => {
  const client = getClient(tx);
  return client.auditCycle.update({
    where: { id },
    data: {
      auditors: {
        set: auditorIds.map(auditorId => ({ id: auditorId })),
      },
    },
    include: {
      auditors: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

const createAuditRecord = async (data, tx) => {
  const client = getClient(tx);
  return client.auditRecord.create({
    data: {
      auditCycleId: data.auditCycleId,
      assetId: data.assetId,
      auditorId: data.auditorId,
      status: data.status,
      notes: data.notes || null,
    },
    include: {
      asset: true,
      auditor: {
        select: { id: true, name: true },
      },
    },
  });
};

const findAuditRecordById = async (id, tx) => {
  const client = getClient(tx);
  return client.auditRecord.findUnique({
    where: { id },
    include: {
      asset: true,
      auditor: {
        select: { id: true, name: true },
      },
    },
  });
};

const updateAuditRecord = async (id, data, tx) => {
  const client = getClient(tx);
  return client.auditRecord.update({
    where: { id },
    data,
    include: {
      asset: true,
      auditor: {
        select: { id: true, name: true },
      },
    },
  });
};

const findAuditRecords = async (filters = {}, tx) => {
  const client = getClient(tx);
  const where = {};
  if (filters.auditCycleId) {
    where.auditCycleId = filters.auditCycleId;
  }
  if (filters.assetId) {
    where.assetId = filters.assetId;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  return client.auditRecord.findMany({
    where,
    include: {
      asset: true,
      auditor: {
        select: { id: true, name: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const findRecordByAssetAndCycle = async (assetId, auditCycleId, tx) => {
  const client = getClient(tx);
  return client.auditRecord.findFirst({
    where: {
      assetId,
      auditCycleId,
    },
  });
};

const findAuditorById = async (userId, tx) => {
  const client = getClient(tx);
  return client.user.findUnique({
    where: { id: userId },
  });
};

const findAssetById = async (assetId, tx) => {
  const client = getClient(tx);
  return client.asset.findUnique({
    where: { id: assetId },
  });
};

const findAssetsByScope = async (departmentId, locationId, tx) => {
  const client = getClient(tx);
  const where = {};
  if (departmentId) {
    where.departmentId = departmentId;
  }
  if (locationId) {
    where.locationId = locationId;
  }
  return client.asset.findMany({
    where,
  });
};

const updateAssetStatus = async (assetId, status, tx) => {
  const client = getClient(tx);
  return client.asset.update({
    where: { id: assetId },
    data: { status },
  });
};

const findAuditHistoryByAssetId = async (assetId, tx) => {
  const client = getClient(tx);
  return client.auditRecord.findMany({
    where: { assetId },
    include: {
      auditCycle: true,
      auditor: {
        select: { id: true, name: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const findDepartmentById = async (departmentId, tx) => {
  const client = getClient(tx);
  return client.department.findUnique({
    where: { id: departmentId },
  });
};

const findLocationById = async (locationId, tx) => {
  const client = getClient(tx);
  return client.location.findUnique({
    where: { id: locationId },
  });
};

// Aliases for compatibility
const findUserById = findAuditorById;
const findAuditRecordByAsset = findRecordByAssetAndCycle;
const findAuditHistory = findAuditHistoryByAssetId;

module.exports = {
  createAuditCycle,
  findAuditCycleById,
  findAuditCycles,
  updateAuditCycle,
  assignAuditors,
  createAuditRecord,
  findAuditRecordById,
  updateAuditRecord,
  findAuditRecords,
  findRecordByAssetAndCycle,
  findAuditorById,
  findAssetById,
  findAssetsByScope,
  updateAssetStatus,
  findAuditHistoryByAssetId,
  findDepartmentById,
  findLocationById,
  // Aliases for compatibility
  findUserById,
  findAuditRecordByAsset,
  findAuditHistory,
};
