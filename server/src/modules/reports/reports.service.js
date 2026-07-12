const repository = require('./reports.repository');

const getUtilization = async () => {
  return repository.getDepartmentUtilization();
};

const getMaintenance = async () => {
  return repository.getMaintenanceStats();
};

const getSummary = async () => {
  const kpis = await repository.getSummaryKPIs();
  const mostUsed = await repository.getMostUsedAssets();
  const idle = await repository.getIdleAssets();

  return {
    kpis,
    mostUsed,
    idle,
  };
};

module.exports = {
  getUtilization,
  getMaintenance,
  getSummary,
};
