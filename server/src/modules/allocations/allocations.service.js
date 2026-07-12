const repository = require('./allocations.repository');
const { prisma } = require('../../config/database');

const getAllAllocations = async (filters = {}) => {
  return repository.findAllocations(filters);
};

const getAllocationById = async (id) => {
  const allocation = await repository.findAllocationById(id);
  if (!allocation) {
    const error = new Error('Allocation not found.');
    error.statusCode = 404;
    throw error;
  }
  return allocation;
};

const allocateAsset = async (data, currentUser) => {
  const { assetId, employeeId, departmentId, expectedReturnDate } = data;

  // 1. Ensure exactly one allocation target is provided
  const hasEmployee = !!employeeId;
  const hasDepartment = !!departmentId;
  if ((hasEmployee && hasDepartment) || (!hasEmployee && !hasDepartment)) {
    const error = new Error('Invalid allocation target. Must provide either an employee or a department, but not both.');
    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    // 2. Verify the asset exists
    const asset = await repository.findAssetById(assetId, tx);
    if (!asset) {
      const error = new Error('Asset not found.');
      error.statusCode = 404;
      throw error;
    }

    // 3. Verify the asset status is AVAILABLE
    if (asset.status !== 'AVAILABLE') {
      const error = new Error('Asset is currently unavailable for allocation.');
      error.statusCode = 400;
      throw error;
    }

    // 4. Verify there is no ACTIVE allocation for the asset
    const activeAlloc = await repository.findActiveAllocationByAssetId(assetId, tx);
    if (activeAlloc) {
      let holder = 'another entity';
      if (activeAlloc.employee) {
        const deptName = activeAlloc.employee.department?.name;
        holder = activeAlloc.employee.name + (deptName ? ` (${deptName})` : '');
      } else if (activeAlloc.department) {
        holder = `${activeAlloc.department.name} Department`;
      }
      const error = new Error(`Already Allocated to ${holder}. Direct re-allocation is blocked.`);
      error.statusCode = 409;
      throw error;
    }

    // 5. Verify the target Employee or Department exists
    if (employeeId) {
      const employee = await repository.findEmployeeById(employeeId, tx);
      if (!employee) {
        const error = new Error('Employee not found.');
        error.statusCode = 404;
        throw error;
      }
    } else if (departmentId) {
      const department = await repository.findDepartmentById(departmentId, tx);
      if (!department) {
        const error = new Error('Department not found.');
        error.statusCode = 404;
        throw error;
      }
    }

    // 6. Create the allocation
    const allocation = await repository.createAllocation({
      assetId,
      employeeId,
      departmentId,
      allocatedById: currentUser.id,
      expectedReturnDate,
      status: 'ACTIVE',
    }, tx);

    // 7. Update Asset status to ALLOCATED
    await repository.updateAssetStatus(assetId, 'ALLOCATED', tx);

    return allocation;
  });
};

const returnAsset = async (id, data, _currentUser) => {
  const { checkInNotes } = data;

  return prisma.$transaction(async (tx) => {
    // 1. Find active allocation & verify allocation exists
    const allocation = await repository.findAllocationById(id, tx);
    if (!allocation) {
      const error = new Error('Allocation not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Verify allocation is ACTIVE (not already returned)
    if (allocation.status !== 'ACTIVE') {
      const error = new Error('Asset already returned.');
      error.statusCode = 400;
      throw error;
    }

    // 3. Update allocation details
    const updatedAllocation = await repository.updateAllocation(id, {
      actualReturnDate: new Date(),
      status: 'RETURNED',
      checkInNotes,
    }, tx);

    // 4. Update Asset status back to AVAILABLE
    await repository.updateAssetStatus(allocation.assetId, 'AVAILABLE', tx);

    return updatedAllocation;
  });
};

module.exports = {
  getAllAllocations,
  getAllocationById,
  allocateAsset,
  returnAsset,
};
