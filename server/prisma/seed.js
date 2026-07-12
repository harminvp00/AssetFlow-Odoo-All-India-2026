const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
  console.log('Seeding database with default values and test data...');

  const passwordHash = '$2a$10$pvgd9XdiD9SlMXVq4Wj10OgDMcKn6Tv/G8459KnZigXNe1YaeoMla'; // password: admin

  // Clean old records in topological order
  console.log('Cleaning old data...');
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.auditRecord.deleteMany();
  await prisma.auditCycle.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.resourceBooking.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetCategory.deleteMany();
  await prisma.department.updateMany({ data: { headId: null } });
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();
  await prisma.department.deleteMany();

  // 1. Create Departments
  console.log('Creating Departments...');
  const engDept = await prisma.department.create({
    data: { name: 'Engineering', status: true }
  });
  const mktDept = await prisma.department.create({
    data: { name: 'Marketing', status: true }
  });
  const prodDept = await prisma.department.create({
    data: { name: 'Product', status: true }
  });
  const salesDept = await prisma.department.create({
    data: { name: 'Sales', status: true }
  });

  // 2. Create Locations
  console.log('Creating Locations...');
  const bangaloreHQ = await prisma.location.create({
    data: { name: 'Bangalore R&D Center', description: 'Primary engineering office' }
  });
  const mumbaiHQ = await prisma.location.create({
    data: { name: 'Mumbai Head Office', description: 'Corporate headquarters' }
  });
  const chennaiLoc = await prisma.location.create({
    data: { name: 'Chennai Office', description: 'Operations branch' }
  });

  // 3. Create Users
  console.log('Creating Users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@assetflow.com',
      firstName: 'System',
      lastName: 'Admin',
      password: passwordHash,
      role: 'ADMIN',
      departments: { connect: { id: engDept.id } }
    }
  });

  const arjun = await prisma.user.create({
    data: {
      email: 'arjun@assetflow.com',
      firstName: 'Arjun',
      lastName: 'Nair',
      password: passwordHash,
      role: 'MANAGER',
      departments: { connect: { id: mktDept.id } }
    }
  });

  const rohan = await prisma.user.create({
    data: {
      email: 'rohan@assetflow.com',
      firstName: 'Rohan',
      lastName: 'Sharma',
      password: passwordHash,
      role: 'MANAGER',
      departments: { connect: { id: prodDept.id } }
    }
  });

  const priya = await prisma.user.create({
    data: {
      email: 'priya@assetflow.com',
      firstName: 'Priya',
      lastName: 'Shah',
      password: passwordHash,
      role: 'PROCUREMENT_OFFICER',
      departments: { connect: { id: engDept.id } }
    }
  });

  const aditi = await prisma.user.create({
    data: {
      email: 'aditi@assetflow.com',
      firstName: 'Aditi',
      lastName: 'Verma',
      password: passwordHash,
      role: 'PROCUREMENT_OFFICER',
      departments: { connect: { id: salesDept.id } }
    }
  });

  // Update Department Heads
  await prisma.department.update({
    where: { id: engDept.id },
    data: { headId: admin.id }
  });
  await prisma.department.update({
    where: { id: mktDept.id },
    data: { headId: arjun.id }
  });
  await prisma.department.update({
    where: { id: prodDept.id },
    data: { headId: rohan.id }
  });

  // 4. Create Asset Categories
  console.log('Creating Asset Categories...');
  const laptopsCat = await prisma.assetCategory.create({
    data: {
      name: 'Laptops',
      schemaConfig: { warrantyPeriod: 'number', macAddress: 'string' }
    }
  });
  const monitorsCat = await prisma.assetCategory.create({
    data: {
      name: 'Monitors',
      schemaConfig: { screenSize: 'number', resolution: 'string' }
    }
  });
  const mobilesCat = await prisma.assetCategory.create({
    data: {
      name: 'Mobile Devices',
      schemaConfig: { os: 'string', storage: 'number' }
    }
  });

  // 5. Create Assets
  console.log('Creating Assets...');
  const dellLaptop = await prisma.asset.create({
    data: {
      tag: 'AF-0001',
      name: 'Dell XPS 15 Laptop',
      serialNumber: 'SN-DELL-9988',
      acquisitionDate: new Date('2025-01-10'),
      acquisitionCost: 1450.00,
      condition: 'NEW',
      status: 'ALLOCATED',
      locationId: bangaloreHQ.id,
      categoryId: laptopsCat.id,
      departmentId: engDept.id,
      dynamicFields: { warrantyPeriod: 24, macAddress: '00:1A:2B:3C:4D:5E' }
    }
  });

  const thinkpadLaptop = await prisma.asset.create({
    data: {
      tag: 'AF-0002',
      name: 'Lenovo ThinkPad X1 Carbon',
      serialNumber: 'SN-THINK-1122',
      acquisitionDate: new Date('2025-03-15'),
      acquisitionCost: 1800.00,
      condition: 'GOOD',
      status: 'AVAILABLE',
      locationId: bangaloreHQ.id,
      categoryId: laptopsCat.id,
      dynamicFields: { warrantyPeriod: 36, macAddress: '00:1A:2B:3C:4D:6F' }
    }
  });

  const macbookLaptop = await prisma.asset.create({
    data: {
      tag: 'AF-0003',
      name: 'MacBook Pro M3 Max',
      serialNumber: 'SN-APPLE-8877',
      acquisitionDate: new Date('2025-05-20'),
      acquisitionCost: 3500.00,
      condition: 'NEW',
      status: 'UNDER_MAINTENANCE',
      locationId: mumbaiHQ.id,
      categoryId: laptopsCat.id,
      departmentId: engDept.id,
      dynamicFields: { warrantyPeriod: 12, macAddress: '00:1A:2B:3C:4D:7G' }
    }
  });

  const samsungMonitor = await prisma.asset.create({
    data: {
      tag: 'AF-0004',
      name: 'Samsung 32" Curved Monitor',
      serialNumber: 'SN-SAMS-7766',
      acquisitionDate: new Date('2025-02-15'),
      acquisitionCost: 350.00,
      condition: 'GOOD',
      status: 'ALLOCATED',
      locationId: mumbaiHQ.id,
      categoryId: monitorsCat.id,
      departmentId: mktDept.id,
      dynamicFields: { screenSize: 32, resolution: '3840x2160' }
    }
  });

  const ipadDevice = await prisma.asset.create({
    data: {
      tag: 'AF-0005',
      name: 'iPad Pro M4',
      serialNumber: 'SN-IPAD-5544',
      acquisitionDate: new Date('2025-06-01'),
      acquisitionCost: 1100.00,
      condition: 'GOOD',
      status: 'RESERVED',
      locationId: mumbaiHQ.id,
      categoryId: mobilesCat.id,
      departmentId: prodDept.id,
      isSharedBookable: true,
      dynamicFields: { os: 'iOS', storage: 256 }
    }
  });

  // 6. Create Allocations
  console.log('Creating Allocations...');
  await prisma.allocation.create({
    data: {
      assetId: dellLaptop.id,
      employeeId: priya.id,
      allocatedById: admin.id,
      status: 'ACTIVE',
      createdAt: new Date('2025-01-11')
    }
  });

  await prisma.allocation.create({
    data: {
      assetId: samsungMonitor.id,
      employeeId: arjun.id,
      allocatedById: admin.id,
      status: 'ACTIVE',
      createdAt: new Date('2025-02-16')
    }
  });

  await prisma.allocation.create({
    data: {
      assetId: thinkpadLaptop.id,
      employeeId: rohan.id,
      allocatedById: admin.id,
      status: 'RETURNED',
      actualReturnDate: new Date('2025-06-15'),
      checkInNotes: 'Returned in perfect condition',
      createdAt: new Date('2025-03-20')
    }
  });

  // 7. Create Transfer Requests
  console.log('Creating Transfer Requests...');
  await prisma.transferRequest.create({
    data: {
      assetId: dellLaptop.id,
      fromEmployeeId: priya.id,
      toEmployeeId: arjun.id,
      requestedById: priya.id,
      status: 'PENDING'
    }
  });

  await prisma.transferRequest.create({
    data: {
      assetId: samsungMonitor.id,
      fromEmployeeId: arjun.id,
      toEmployeeId: aditi.id,
      requestedById: arjun.id,
      status: 'APPROVED',
      approvedById: admin.id
    }
  });

  // 8. Create Resource Bookings
  console.log('Creating Resource Bookings...');
  await prisma.resourceBooking.create({
    data: {
      assetId: ipadDevice.id,
      userId: rohan.id,
      startTime: new Date(Date.now() + 3600000 * 24), // 24 hours from now
      endTime: new Date(Date.now() + 3600000 * 28),
      status: 'UPCOMING'
    }
  });

  await prisma.resourceBooking.create({
    data: {
      assetId: ipadDevice.id,
      userId: priya.id,
      startTime: new Date(Date.now() - 3600000 * 4),
      endTime: new Date(Date.now() - 3600000 * 1),
      status: 'COMPLETED'
    }
  });

  // 9. Create Maintenance Requests
  console.log('Creating Maintenance Requests...');
  await prisma.maintenanceRequest.create({
    data: {
      assetId: macbookLaptop.id,
      raisedById: priya.id,
      technicianId: arjun.id,
      issueDescription: 'Laptop screen flickering and artifacting.',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      createdAt: new Date(Date.now() - 3600000 * 24 * 3)
    }
  });

  await prisma.maintenanceRequest.create({
    data: {
      assetId: thinkpadLaptop.id,
      raisedById: rohan.id,
      issueDescription: 'Keyboard keys stick and sometimes double type.',
      priority: 'MEDIUM',
      status: 'PENDING'
    }
  });

  await prisma.maintenanceRequest.create({
    data: {
      assetId: samsungMonitor.id,
      raisedById: arjun.id,
      issueDescription: 'Monitor power adapter is dead.',
      priority: 'HIGH',
      status: 'RESOLVED',
      resolutionNotes: 'Power brick replaced, verified screen operation.',
      createdAt: new Date(Date.now() - 3600000 * 24 * 10)
    }
  });

  // 10. Create Audit Cycles & Records
  console.log('Creating Audit Cycles & Records...');
  // A Draft Cycle
  await prisma.auditCycle.create({
    data: {
      name: 'Q3 Asset Audit Checklist',
      scopeDepartmentId: engDept.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 3600000 * 24 * 15),
      status: 'DRAFT',
      auditors: { connect: [{ id: admin.id }] }
    }
  });

  // An Active Cycle
  const activeCycle = await prisma.auditCycle.create({
    data: {
      name: 'Bangalore Office Compliance Audit',
      scopeLocationId: bangaloreHQ.id,
      startDate: new Date(Date.now() - 3600000 * 24 * 5),
      endDate: new Date(Date.now() + 3600000 * 24 * 5),
      status: 'ACTIVE',
      auditors: { connect: [{ id: admin.id }, { id: arjun.id }] }
    }
  });

  // Audit records for the active cycle
  await prisma.auditRecord.create({
    data: {
      auditCycleId: activeCycle.id,
      assetId: dellLaptop.id,
      auditorId: admin.id,
      status: 'VERIFIED',
      notes: 'XPS Laptop verified physically in room 201.'
    }
  });

  await prisma.auditRecord.create({
    data: {
      auditCycleId: activeCycle.id,
      assetId: thinkpadLaptop.id,
      auditorId: arjun.id,
      status: 'DAMAGED',
      notes: 'Laptop case is cracked, but bootable.'
    }
  });

  // A Completed Cycle
  const completedCycle = await prisma.auditCycle.create({
    data: {
      name: 'Q2 General Assets Verification',
      startDate: new Date(Date.now() - 3600000 * 24 * 30),
      endDate: new Date(Date.now() - 3600000 * 24 * 25),
      status: 'COMPLETED',
      discrepancyReport: {
        totalVerified: 2,
        totalMissing: 1,
        totalDamaged: 0,
        missingTags: ['AF-0005']
      },
      auditors: { connect: [{ id: admin.id }] }
    }
  });

  // 11. Create Notifications
  console.log('Creating Notifications...');
  await prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      userId: admin.id,
      title: 'New Maintenance Request',
      message: 'Rohan Sharma has requested keyboard repairs for Lenovo ThinkPad.',
      type: 'WARNING'
    }
  });

  await prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      userId: arjun.id,
      title: 'Transfer Approved',
      message: 'Your transfer of Samsung 32 Monitor has been approved by admin.',
      type: 'INFO'
    }
  });

  // 12. Create Activity Logs
  console.log('Creating Activity Logs...');
  await prisma.activityLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: admin.id,
      assetId: dellLaptop.id,
      type: 'ALLOCATE',
      description: 'Dell XPS 15 allocated to Priya Shah',
      metadata: { notes: 'Dell XPS 15 allocated to Priya Shah' }
    }
  });

  await prisma.activityLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: arjun.id,
      assetId: samsungMonitor.id,
      type: 'MAINTENANCE_RESOLVED',
      description: 'Repaired power supply adapter unit',
      metadata: { notes: 'Repaired power supply adapter unit' }
    }
  });

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
