const { prisma } = require('../../config/database');

const getClient = (tx) => tx || prisma;

const createMaintenanceRequest = async (data, tx) => {
  const client = getClient(tx);
  return client.maintenanceRequest.create({
    data: {
      assetId: data.assetId,
      raisedById: data.raisedById,
      issueDescription: data.issueDescription,
      priority: data.priority || 'MEDIUM',
      status: 'PENDING',
      photoUrl: data.photoUrl || null,
    },
  });
};

const findMaintenanceRequestById = async (id, tx) => {
  const client = getClient(tx);
  return client.maintenanceRequest.findUnique({
    where: { id },
    include: {
      asset: true,
      raisedBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      approvedBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
};

const findMaintenanceRequests = async (filters = {}, tx) => {
  const client = getClient(tx);
  const where = {};
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.priority) {
    where.priority = filters.priority;
  }
  if (filters.assetId) {
    where.assetId = filters.assetId;
  }
  if (filters.raisedById) {
    where.raisedById = filters.raisedById;
  }
  if (filters.technicianId) {
    where.technicianId = filters.technicianId;
  }

  return client.maintenanceRequest.findMany({
    where,
    include: {
      asset: true,
      raisedBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      approvedBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const findPendingRequests = async (tx) => {
  const client = getClient(tx);
  return client.maintenanceRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      asset: true,
      raisedBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const findActiveMaintenanceByAssetId = async (assetId, tx) => {
  const client = getClient(tx);
  return client.maintenanceRequest.findFirst({
    where: {
      assetId,
      status: {
        in: ['PENDING', 'APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS'],
      },
    },
  });
};

const findMaintenanceHistoryByAssetId = async (assetId, tx) => {
  const client = getClient(tx);
  return client.maintenanceRequest.findMany({
    where: { assetId },
    include: {
      asset: true,
      raisedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
      approvedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const updateMaintenanceRequest = async (id, data, tx) => {
  const client = getClient(tx);
  return client.maintenanceRequest.update({
    where: { id },
    data,
    include: { asset: true },
  });
};

const updateMaintenanceStatus = async (id, status, approvedById = null, tx) => {
  const client = getClient(tx);
  const data = { status };
  if (approvedById) {
    data.approvedById = approvedById;
  }
  return client.maintenanceRequest.update({
    where: { id },
    data,
    include: { asset: true },
  });
};

const assignTechnician = async (id, technicianId, tx) => {
  const client = getClient(tx);
  return client.maintenanceRequest.update({
    where: { id },
    data: {
      technicianId,
      status: 'TECHNICIAN_ASSIGNED',
    },
    include: { asset: true },
  });
};

const findAssetById = async (assetId, tx) => {
  const client = getClient(tx);
  return client.asset.findUnique({
    where: { id: assetId },
  });
};

const findUserById = async (userId, tx) => {
  const client = getClient(tx);
  return client.user.findUnique({
    where: { id: userId },
  });
};

// Aliases for compatibility
const createRequest = createMaintenanceRequest;
const findRequestById = findMaintenanceRequestById;
const findRequests = findMaintenanceRequests;
const findActiveRequestByAssetId = findActiveMaintenanceByAssetId;
const updateRequestStatus = updateMaintenanceStatus;
const resolveRequest = async (id, resolutionNotes, tx) => {
  const client = getClient(tx);
  return client.maintenanceRequest.update({
    where: { id },
    data: {
      resolutionNotes,
      status: 'RESOLVED',
    },
    include: { asset: true },
  });
};
const updateAssetStatus = async (assetId, status, tx) => {
  const client = getClient(tx);
  return client.asset.update({
    where: { id: assetId },
    data: { status },
  });
};

module.exports = {
  createMaintenanceRequest,
  findMaintenanceRequestById,
  findMaintenanceRequests,
  findPendingRequests,
  findActiveMaintenanceByAssetId,
  findMaintenanceHistoryByAssetId,
  updateMaintenanceRequest,
  updateMaintenanceStatus,
  assignTechnician,
  findAssetById,
  findUserById,
  // Aliases for compatibility
  createRequest,
  findRequestById,
  findRequests,
  findActiveRequestByAssetId,
  updateRequestStatus,
  resolveRequest,
  updateAssetStatus,
};
