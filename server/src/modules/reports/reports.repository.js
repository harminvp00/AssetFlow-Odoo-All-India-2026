const { prisma } = require('../../config/database');

const getDepartmentUtilization = async () => {
  const departments = await prisma.department.findMany({
    include: {
      assets: {
        select: {
          id: true,
          status: true,
        }
      }
    }
  });

  return departments.map(d => {
    const total = d.assets.length;
    const allocated = d.assets.filter(a => a.status === 'ALLOCATED').length;
    const rate = total > 0 ? Math.round((allocated / total) * 100) : 0;
    return {
      id: d.id,
      department: d.name,
      utilizationRate: rate,
      totalAssets: total,
      allocatedAssets: allocated,
    };
  });
};

const getMaintenanceStats = async () => {
  const requests = await prisma.maintenanceRequest.findMany({
    select: {
      createdAt: true,
      status: true,
      priority: true,
    }
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyCounts = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = months[d.getMonth()];
    monthlyCounts[monthName] = 0;
  }

  requests.forEach(r => {
    const date = new Date(r.createdAt);
    const monthName = months[date.getMonth()];
    if (monthlyCounts[monthName] !== undefined) {
      monthlyCounts[monthName]++;
    }
  });

  return Object.entries(monthlyCounts).map(([month, count]) => ({
    month,
    count,
  }));
};

const getSummaryKPIs = async () => {
  const totalAssets = await prisma.asset.count();
  const allocatedAssets = await prisma.asset.count({ where: { status: 'ALLOCATED' } });
  const availableAssets = await prisma.asset.count({ where: { status: 'AVAILABLE' } });
  const maintenanceAssets = await prisma.asset.count({ where: { status: 'UNDER_MAINTENANCE' } });
  
  const activeBookings = await prisma.resourceBooking.count({
    where: {
      endTime: { gte: new Date() }
    }
  });

  const totalDiscrepancies = await prisma.auditRecord.count({
    where: {
      status: { in: ['MISSING', 'DAMAGED'] }
    }
  });

  const utilizationRate = totalAssets > 0 ? Math.round((allocatedAssets / totalAssets) * 100) : 0;

  return {
    totalAssets,
    allocatedAssets,
    availableAssets,
    maintenanceAssets,
    activeBookings,
    totalDiscrepancies,
    utilizationRate,
  };
};

const getMostUsedAssets = async () => {
  const items = await prisma.asset.findMany({
    take: 5,
    include: {
      category: true,
      _count: {
        select: { allocations: true }
      }
    },
    orderBy: {
      allocations: {
        _count: 'desc'
      }
    }
  });

  return items.map(item => ({
    id: item.id,
    tag: item.tag,
    name: item.name,
    category: item.category.name,
    allocationCount: item._count.allocations,
  }));
};

const getIdleAssets = async () => {
  const items = await prisma.asset.findMany({
    where: {
      status: 'AVAILABLE',
      createdAt: {
        lt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      }
    },
    take: 5,
    include: {
      category: true,
    }
  });

  return items.map(item => ({
    id: item.id,
    tag: item.tag,
    name: item.name,
    category: item.category.name,
    acquisitionDate: item.acquisitionDate,
  }));
};

module.exports = {
  getDepartmentUtilization,
  getMainMaintenanceStats: getMaintenanceStats, // export with custom name or alias
  getMaintenanceStats,
  getSummaryKPIs,
  getMostUsedAssets,
  getIdleAssets,
};
