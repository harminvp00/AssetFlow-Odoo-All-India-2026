const repository = require('./maintenance.repository');
const { prisma } = require('../../config/database');

const getMaintenanceRequests = async (filters = {}) => {
  return repository.findMaintenanceRequests(filters);
};

const getMaintenanceRequestById = async (id) => {
  const request = await repository.findMaintenanceRequestById(id);
  if (!request) {
    const error = new Error('Maintenance request not found.');
    error.statusCode = 404;
    throw error;
  }
  return request;
};

const getPendingRequests = async () => {
  return repository.findPendingRequests();
};

const getMaintenanceHistoryByAsset = async (assetId) => {
  return repository.findMaintenanceHistoryByAssetId(assetId);
};

const raiseMaintenanceRequest = async (data, currentUser) => {
  const { assetId, issueDescription, priority } = data;

  // 1. Verify target asset exists
  const asset = await repository.findAssetById(assetId);
  if (!asset) {
    const error = new Error('Asset not found.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Verify target user exists
  const user = await repository.findUserById(currentUser.id);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  // 3. Reject duplicate active maintenance requests
  const activeRequest = await repository.findActiveMaintenanceByAssetId(assetId);
  if (activeRequest) {
    const error = new Error('Asset already has an active maintenance request.');
    error.statusCode = 409;
    throw error;
  }

  // 4. Create request
  return repository.createMaintenanceRequest({
    assetId,
    raisedById: currentUser.id,
    issueDescription,
    priority,
    photoUrl: data.photoUrl || null,
  });
};

const approveMaintenanceRequest = async (id, currentUser) => {
  return prisma.$transaction(async (tx) => {
    // 1. Find request
    const request = await repository.findMaintenanceRequestById(id, tx);
    if (!request) {
      const error = new Error('Maintenance request not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. State transition check
    if (request.status !== 'PENDING') {
      const error = new Error('Only pending requests can be approved.');
      error.statusCode = 400;
      throw error;
    }

    // 3. Authorization check
    const isManager = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
    if (!isManager) {
      const error = new Error('Unauthorized to approve maintenance requests.');
      error.statusCode = 403;
      throw error;
    }

    // 4. Update asset status to UNDER_MAINTENANCE
    await repository.updateAssetStatus(request.assetId, 'UNDER_MAINTENANCE', tx);

    // 5. Update request status to APPROVED
    return repository.updateMaintenanceStatus(id, 'APPROVED', currentUser.id, tx);
  });
};

const rejectMaintenanceRequest = async (id, currentUser) => {
  return prisma.$transaction(async (tx) => {
    // 1. Find request
    const request = await repository.findMaintenanceRequestById(id, tx);
    if (!request) {
      const error = new Error('Maintenance request not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. State transition check
    if (request.status !== 'PENDING') {
      const error = new Error('Only pending requests can be rejected.');
      error.statusCode = 400;
      throw error;
    }

    // 3. Authorization check
    const isManager = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
    if (!isManager) {
      const error = new Error('Unauthorized to reject maintenance requests.');
      error.statusCode = 403;
      throw error;
    }

    // 5. Update request status to REJECTED
    return repository.updateMaintenanceStatus(id, 'REJECTED', currentUser.id, tx);
  });
};

const assignTechnician = async (id, technicianId, currentUser) => {
  // 1. Find request
  const request = await repository.findMaintenanceRequestById(id);
  if (!request) {
    const error = new Error('Maintenance request not found.');
    error.statusCode = 404;
    throw error;
  }

  // 2. State transition check
  if (request.status !== 'APPROVED') {
    const error = new Error('Only approved requests can have technicians assigned.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Authorization check
  const isManager = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
  if (!isManager) {
    const error = new Error('Unauthorized to assign technicians.');
    error.statusCode = 403;
    throw error;
  }

  // 4. Verify technician exists
  const technician = await repository.findUserById(technicianId);
  if (!technician) {
    const error = new Error('Technician not found.');
    error.statusCode = 404;
    throw error;
  }

  // 5. Assign technician and transition status
  return repository.assignTechnician(id, technicianId);
};

const startMaintenance = async (id, currentUser) => {
  // 1. Find request
  const request = await repository.findMaintenanceRequestById(id);
  if (!request) {
    const error = new Error('Maintenance request not found.');
    error.statusCode = 404;
    throw error;
  }

  // 2. State transition check
  if (request.status !== 'TECHNICIAN_ASSIGNED') {
    const error = new Error('Repairs can only start once a technician is assigned.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Verify current user is the assigned technician
  const isAssigned = request.technicianId === currentUser.id;
  const isAdmin = currentUser.role === 'ADMIN';
  if (!isAssigned && !isAdmin) {
    const error = new Error('Only the assigned technician can start the repair process.');
    error.statusCode = 403;
    throw error;
  }

  // 4. Transition to IN_PROGRESS
  return repository.updateMaintenanceStatus(id, 'IN_PROGRESS');
};

const resolveMaintenance = async (id, resolutionNotes, currentUser) => {
  return prisma.$transaction(async (tx) => {
    // 1. Find request
    const request = await repository.findMaintenanceRequestById(id, tx);
    if (!request) {
      const error = new Error('Maintenance request not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. State transition check
    if (request.status !== 'IN_PROGRESS') {
      const error = new Error('Only repairs in progress can be resolved.');
      error.statusCode = 400;
      throw error;
    }

    // 3. Verify current user is the assigned technician
    const isAssigned = request.technicianId === currentUser.id;
    const isAdmin = currentUser.role === 'ADMIN';
    if (!isAssigned && !isAdmin) {
      const error = new Error('Only the assigned technician can resolve the request.');
      error.statusCode = 403;
      throw error;
    }

    // 4. Update asset status back to AVAILABLE
    await repository.updateAssetStatus(request.assetId, 'AVAILABLE', tx);

    // 5. Update request status to RESOLVED
    return repository.updateMaintenanceRequest(id, { status: 'RESOLVED', resolutionNotes }, tx);
  });
};

// Compatibility aliases
const getRequests = getMaintenanceRequests;
const getRequestById = getMaintenanceRequestById;
const createRequest = raiseMaintenanceRequest;
const approveRequest = approveMaintenanceRequest;
const rejectRequest = rejectMaintenanceRequest;
const startRepair = startMaintenance;
const resolveRequest = resolveMaintenance;

module.exports = {
  getMaintenanceRequests,
  getMaintenanceRequestById,
  getPendingRequests,
  getMaintenanceHistoryByAsset,
  raiseMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  assignTechnician,
  startMaintenance,
  resolveMaintenance,
  // Compatibility aliases
  getRequests,
  getRequestById,
  createRequest,
  approveRequest,
  rejectRequest,
  startRepair,
  resolveRequest,
};
