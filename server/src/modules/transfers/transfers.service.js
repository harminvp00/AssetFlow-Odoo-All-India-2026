const repository = require('./transfers.repository');
const { prisma } = require('../../config/database');

const getTransfers = async (filters = {}) => {
  return repository.findTransfers(filters);
};

const getTransferById = async (id) => {
  const request = await repository.findTransferById(id);
  if (!request) {
    const error = new Error('Transfer request not found.');
    error.statusCode = 404;
    throw error;
  }
  return request;
};

const getPendingTransfers = async () => {
  return repository.findTransfers({ status: 'PENDING' });
};

const createTransferRequest = async (data, currentUser) => {
  const { assetId, toEmployeeId, toDepartmentId } = data;

  // 1. Target exclusivity validation
  const hasEmployee = !!toEmployeeId;
  const hasDepartment = !!toDepartmentId;
  if ((hasEmployee && hasDepartment) || (!hasEmployee && !hasDepartment)) {
    const error = new Error('Invalid transfer target. Must provide either a target employee or a department, but not both.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Verify target asset exists
  const asset = await repository.findAssetById(assetId);
  if (!asset) {
    const error = new Error('Asset not found.');
    error.statusCode = 404;
    throw error;
  }

  // 3. Verify there is an active allocation for the asset
  const activeAlloc = await repository.findActiveAllocationByAssetId(assetId);
  if (!activeAlloc) {
    const error = new Error('Asset must currently be allocated to request a transfer.');
    error.statusCode = 400;
    throw error;
  }

  // 4. Verify requester is authorized to request transfer
  const isManager = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
  const isOwner = activeAlloc.employeeId === currentUser.id;
  if (!isManager && !isOwner) {
    const error = new Error('Unauthorized to request transfer for this asset.');
    error.statusCode = 403;
    throw error;
  }

  // 5. Verify no pending transfer requests exist for the asset
  const pendingRequest = await repository.findPendingTransferByAssetId(assetId);
  if (pendingRequest) {
    const error = new Error('Asset already has a pending transfer request.');
    error.statusCode = 409;
    throw error;
  }

  // 6. Verify destination employee/department exists
  if (toEmployeeId) {
    const employee = await repository.findEmployeeById(toEmployeeId);
    if (!employee) {
      const error = new Error('Destination employee not found.');
      error.statusCode = 404;
      throw error;
    }
    // Ensure destination is different from current owner
    if (activeAlloc.employeeId === toEmployeeId) {
      const error = new Error('Invalid destination. Target employee is already the current owner.');
      error.statusCode = 400;
      throw error;
    }
  } else if (toDepartmentId) {
    const department = await repository.findDepartmentById(toDepartmentId);
    if (!department) {
      const error = new Error('Destination department not found.');
      error.statusCode = 404;
      throw error;
    }
    // Ensure destination is different from current owner
    if (activeAlloc.departmentId === toDepartmentId) {
      const error = new Error('Invalid destination. Target department is already the current owner.');
      error.statusCode = 400;
      throw error;
    }
  }

  // 7. Create the transfer request populating the source from current allocation
  return repository.createTransferRequest({
    assetId,
    fromEmployeeId: activeAlloc.employeeId || null,
    fromDepartmentId: activeAlloc.departmentId || null,
    toEmployeeId: toEmployeeId || null,
    toDepartmentId: toDepartmentId || null,
    requestedById: currentUser.id,
  });
};

const approveTransfer = async (id, currentUser) => {
  return prisma.$transaction(async (tx) => {
    // 1. Find request
    const request = await repository.findTransferById(id, tx);
    if (!request) {
      const error = new Error('Transfer request not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Check if status is PENDING
    if (request.status !== 'PENDING') {
      const error = new Error('Only pending transfer requests can be approved.');
      error.statusCode = 400;
      throw error;
    }

    // 3. Verify approver has required permissions
    const isApproverAuthorized = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
    if (!isApproverAuthorized) {
      const error = new Error('Unauthorized approval. Only administrators or managers can approve transfer requests.');
      error.statusCode = 403;
      throw error;
    }

    // 4. Find active allocation of the asset
    const activeAlloc = await repository.findActiveAllocationByAssetId(request.assetId, tx);
    if (!activeAlloc) {
      const error = new Error('No active allocation found for the target asset.');
      error.statusCode = 400;
      throw error;
    }

    // 5. Close current active allocation
    await repository.closeAllocation(activeAlloc.id, {
      actualReturnDate: new Date(),
      status: 'RETURNED',
      checkInNotes: `Transferred to ${
        request.toEmployeeId ? `Employee ${request.toEmployeeId}` : `Department ${request.toDepartmentId}`
      } via request ${request.id}`,
    }, tx);

    // 6. Create new active allocation
    await repository.createNewAllocation({
      assetId: request.assetId,
      employeeId: request.toEmployeeId,
      departmentId: request.toDepartmentId,
      allocatedById: currentUser.id,
      status: 'ACTIVE',
    }, tx);

    // 7. Update transfer request to APPROVED
    return repository.updateTransferStatus(id, 'APPROVED', currentUser.id, tx);
  });
};

const rejectTransfer = async (id, currentUser) => {
  return prisma.$transaction(async (tx) => {
    // 1. Find request
    const request = await repository.findTransferById(id, tx);
    if (!request) {
      const error = new Error('Transfer request not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Check status
    if (request.status !== 'PENDING') {
      const error = new Error('Only pending transfer requests can be rejected.');
      error.statusCode = 400;
      throw error;
    }

    // 3. Verify approver permissions
    const isApproverAuthorized = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
    if (!isApproverAuthorized) {
      const error = new Error('Unauthorized approval. Only administrators or managers can reject transfer requests.');
      error.statusCode = 403;
      throw error;
    }

    // 4. Update transfer request to REJECTED
    return repository.updateTransferStatus(id, 'REJECTED', currentUser.id, tx);
  });
};

module.exports = {
  getTransfers,
  getTransferById,
  getPendingTransfers,
  createTransferRequest,
  approveTransfer,
  rejectTransfer,
};
