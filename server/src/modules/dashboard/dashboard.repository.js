const { prisma } = require('../../config/database');

const findAll = async () => {
  const [totalAssets, activeAllocations, pendingMaintenance, activeAudits] = await Promise.all([
    prisma.asset.count(),
    prisma.allocation.count({ where: { status: 'ACTIVE' } }),
    prisma.maintenanceRequest.count({ where: { status: 'PENDING' } }),
    prisma.auditCycle.count({ where: { status: 'IN_PROGRESS' } }),
  ]);

  return [
    { key: 'totalAssets', value: totalAssets },
    { key: 'activeAllocations', value: activeAllocations },
    { key: 'pendingMaintenance', value: pendingMaintenance },
    { key: 'activeAudits', value: activeAudits },
  ];
};

const save = async (data) => {
  return data;
};

module.exports = {
  findAll,
  save,
};
