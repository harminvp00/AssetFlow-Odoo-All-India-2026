const repository = require('./audits.repository');
const { prisma } = require('../../config/database');

const getAuditCycles = async (filters = {}) => {
  return repository.findAuditCycles(filters);
};

const getAuditCycleById = async (id) => {
  const cycle = await repository.findAuditCycleById(id);
  if (!cycle) {
    const error = new Error('Audit cycle not found.');
    error.statusCode = 404;
    throw error;
  }
  return cycle;
};

const getAuditHistoryByAsset = async (assetId) => {
  return repository.findAuditHistoryByAssetId(assetId);
};

const getAuditDetails = async (id) => {
  return getAuditCycleById(id);
};

const getDiscrepancyReport = async (id) => {
  const cycle = await getAuditCycleById(id);
  return cycle.discrepancyReport;
};

const createAuditCycle = async (data, currentUser) => {
  const isAdmin = currentUser.role === 'ADMIN';
  if (!isAdmin) {
    const error = new Error('Unauthorized action.');
    error.statusCode = 403;
    throw error;
  }

  const { startDate, endDate } = data;
  const auditorsList = data.auditors || data.auditorIds;

  if (new Date(startDate) >= new Date(endDate)) {
    const error = new Error('Start date must be before end date.');
    error.statusCode = 400;
    throw error;
  }

  if (!auditorsList || auditorsList.length === 0) {
    const error = new Error('At least one auditor must be assigned to the cycle.');
    error.statusCode = 400;
    throw error;
  }

  // Verify all auditors exist
  for (const auditorId of auditorsList) {
    const user = await repository.findUserById(auditorId);
    if (!user) {
      const error = new Error('Auditor not found.');
      error.statusCode = 404;
      throw error;
    }
  }

  if (data.scopeDepartmentId) {
    const department = await repository.findDepartmentById(data.scopeDepartmentId);
    if (!department) {
      const error = new Error('Department not found.');
      error.statusCode = 404;
      throw error;
    }
  }

  if (data.scopeLocationId) {
    const location = await repository.findLocationById(data.scopeLocationId);
    if (!location) {
      const error = new Error('Location not found.');
      error.statusCode = 404;
      throw error;
    }
  }

  return prisma.$transaction(async (tx) => {
    const cycleData = { ...data };
    delete cycleData.auditors;
    delete cycleData.auditorIds;
    const cycle = await repository.createAuditCycle(cycleData, tx);
    await repository.assignAuditors(cycle.id, auditorsList, tx);
    return repository.findAuditCycleById(cycle.id, tx);
  });
};

const startAuditCycle = async (id, currentUser) => {
  const isAdmin = currentUser.role === 'ADMIN';
  if (!isAdmin) {
    const error = new Error('Unauthorized action.');
    error.statusCode = 403;
    throw error;
  }

  const cycle = await repository.findAuditCycleById(id);
  if (!cycle) {
    const error = new Error('Audit cycle not found.');
    error.statusCode = 404;
    throw error;
  }

  if (cycle.status !== 'DRAFT') {
    const error = new Error('Invalid state transition.');
    error.statusCode = 400;
    throw error;
  }

  if (!cycle.auditors || cycle.auditors.length === 0) {
    const error = new Error('At least one auditor must be assigned to the cycle.');
    error.statusCode = 400;
    throw error;
  }

  return repository.updateAuditCycle(id, { status: 'ACTIVE' });
};

const verifyAsset = async (id, data, currentUser) => {
  const { assetId, status, notes } = data;

  if (!['VERIFIED', 'MISSING', 'DAMAGED'].includes(status)) {
    const error = new Error('Invalid verification status.');
    error.statusCode = 400;
    throw error;
  }

  const cycle = await repository.findAuditCycleById(id);
  if (!cycle) {
    const error = new Error('Audit cycle not found.');
    error.statusCode = 404;
    throw error;
  }

  if (cycle.status === 'COMPLETED') {
    const error = new Error('Audit already completed.');
    error.statusCode = 400;
    throw error;
  }

  if (cycle.status !== 'ACTIVE') {
    const error = new Error('Invalid state transition.');
    error.statusCode = 400;
    throw error;
  }

  // Verify authorization: current user must be an assigned auditor or admin
  const isAssigned = cycle.auditors.some(auditor => auditor.id === currentUser.id);
  const isAdmin = currentUser.role === 'ADMIN';
  if (!isAssigned && !isAdmin) {
    const error = new Error('Auditor not assigned.');
    error.statusCode = 403;
    throw error;
  }

  // Verify asset exists
  const asset = await repository.findAssetById(assetId);
  if (!asset) {
    const error = new Error('Asset not found.');
    error.statusCode = 404;
    throw error;
  }

  // Verify asset has not been verified yet in this cycle
  const existingRecord = await repository.findRecordByAssetAndCycle(assetId, id);
  if (existingRecord) {
    const error = new Error('Asset already verified.');
    error.statusCode = 409;
    throw error;
  }

  // Scope constraints
  if (cycle.scopeDepartmentId && asset.departmentId !== cycle.scopeDepartmentId) {
    const error = new Error('Asset outside audit scope.');
    error.statusCode = 400;
    throw error;
  }
  if (cycle.scopeLocationId && asset.locationId !== cycle.scopeLocationId) {
    const error = new Error('Asset outside audit scope.');
    error.statusCode = 400;
    throw error;
  }

  return repository.createAuditRecord({
    auditCycleId: id,
    assetId,
    auditorId: currentUser.id,
    status,
    notes,
  });
};

const closeAuditCycle = async (id, currentUser) => {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch cycle
    const cycle = await repository.findAuditCycleById(id, tx);
    if (!cycle) {
      const error = new Error('Audit cycle not found.');
      error.statusCode = 404;
      throw error;
    }
    if (cycle.status !== 'ACTIVE') {
      const error = new Error('Invalid state transition.');
      error.statusCode = 400;
      throw error;
    }

    const isAdmin = currentUser.role === 'ADMIN';
    if (!isAdmin) {
      const error = new Error('Unauthorized action.');
      error.statusCode = 403;
      throw error;
    }

    // 2. Fetch scoped assets
    const scopedAssets = await repository.findAssetsByScope(cycle.scopeDepartmentId, cycle.scopeLocationId, tx);

    // 3. Match records
    const records = cycle.records || [];
    const recordMap = new Map(records.map(r => [r.assetId, r]));

    let verifiedCount = 0;
    let damagedCount = 0;
    let missingCount = 0;
    let unauditedCount = 0;
    const discrepancies = [];

    for (const asset of scopedAssets) {
      const record = recordMap.get(asset.id);
      if (record) {
        if (record.status === 'VERIFIED') {
          verifiedCount++;
        } else if (record.status === 'DAMAGED') {
          damagedCount++;
          discrepancies.push({
            assetId: asset.id,
            tag: asset.tag,
            name: asset.name,
            expectedStatus: asset.status,
            actualStatus: 'DAMAGED',
            notes: record.notes || '',
          });
        } else if (record.status === 'MISSING') {
          missingCount++;
          discrepancies.push({
            assetId: asset.id,
            tag: asset.tag,
            name: asset.name,
            expectedStatus: asset.status,
            actualStatus: 'MISSING',
            notes: record.notes || '',
          });
          // Update status to LOST
          await repository.updateAssetStatus(asset.id, 'LOST', tx);
        }
      } else {
        unauditedCount++;
        discrepancies.push({
          assetId: asset.id,
          tag: asset.tag,
          name: asset.name,
          expectedStatus: asset.status,
          actualStatus: 'UNAUDITED',
          notes: 'Asset was not verified during this cycle.',
        });
        // Update status to LOST
        await repository.updateAssetStatus(asset.id, 'LOST', tx);
      }
    }

    const report = {
      totalAssets: scopedAssets.length,
      verifiedCount,
      damagedCount,
      missingCount,
      unauditedCount,
      discrepancies,
    };

    // 4. Update status and report
    return repository.updateAuditCycle(id, {
      status: 'COMPLETED',
      discrepancyReport: report,
    }, tx);
  });
};

// Aliases for compatibility
const getAll = getAuditCycles;
const create = createAuditCycle;
const getAuditHistory = getAuditHistoryByAsset;

module.exports = {
  getAuditCycles,
  getAuditCycleById,
  getAuditHistoryByAsset,
  getAuditDetails,
  getDiscrepancyReport,
  createAuditCycle,
  startAuditCycle,
  verifyAsset,
  closeAuditCycle,
  // Aliases for compatibility
  getAll,
  create,
  getAuditHistory,
};
