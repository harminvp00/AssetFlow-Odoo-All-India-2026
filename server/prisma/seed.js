const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with default values and test data...');

  const passwordHash = '$2a$10$pvgd9XdiD9SlMXVq4Wj10OgDMcKn6Tv/G8459KnZigXNe1YaeoMla'; // password: admin

  // 1. Create default admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@assetflow.com' },
    update: { password: passwordHash, name: 'System Admin' },
    create: {
      email: 'admin@assetflow.com',
      firstName: 'System',
      lastName: 'Admin',
      name: 'System Admin',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  // 2. Create Departments
  const engDept = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: { name: 'Engineering' },
  });

  const mktDept = await prisma.department.upsert({
    where: { name: 'Marketing' },
    update: {},
    create: { name: 'Marketing' },
  });

  const prodDept = await prisma.department.upsert({
    where: { name: 'Product' },
    update: {},
    create: { name: 'Product' },
  });

  const designDept = await prisma.department.upsert({
    where: { name: 'Design' },
    update: {},
    create: { name: 'Design' },
  });

  // 3. Create Locations
  const mumbaiLoc = await prisma.location.upsert({
    where: { name: 'Mumbai Head Office' },
    update: {},
    create: { name: 'Mumbai Head Office', description: 'Main Corporate Headquarters' },
  });

  const bangaloreLoc = await prisma.location.upsert({
    where: { name: 'Bangalore R&D Center' },
    update: {},
    create: { name: 'Bangalore R&D Center', description: 'Research and Development lab' },
  });

  // 4. Create Asset Categories
  const laptopsCat = await prisma.assetCategory.upsert({
    where: { name: 'Laptops' },
    update: {},
    create: { name: 'Laptops' },
  });

  const monitorsCat = await prisma.assetCategory.upsert({
    where: { name: 'Monitors' },
    update: {},
    create: { name: 'Monitors' },
  });

  const mobilesCat = await prisma.assetCategory.upsert({
    where: { name: 'Mobile Devices' },
    update: {},
    create: { name: 'Mobile Devices' },
  });

  // 5. Create Staff Users
  const priya = await prisma.user.upsert({
    where: { email: 'priya@assetflow.com' },
    update: { password: passwordHash, name: 'Priya Shah' },
    create: {
      email: 'priya@assetflow.com',
      firstName: 'Priya',
      lastName: 'Shah',
      name: 'Priya Shah',
      password: passwordHash,
      role: 'PROCUREMENT_OFFICER',
      departments: {
        connect: { id: engDept.id },
      },
    },
  });

  const arjun = await prisma.user.upsert({
    where: { email: 'arjun@assetflow.com' },
    update: { password: passwordHash, name: 'Arjun Nair' },
    create: {
      email: 'arjun@assetflow.com',
      firstName: 'Arjun',
      lastName: 'Nair',
      name: 'Arjun Nair',
      password: passwordHash,
      role: 'MANAGER',
      departments: {
        connect: { id: mktDept.id },
      },
    },
  });

  const rohan = await prisma.user.upsert({
    where: { email: 'rohan@assetflow.com' },
    update: { password: passwordHash, name: 'Rohan Sharma' },
    create: {
      email: 'rohan@assetflow.com',
      firstName: 'Rohan',
      lastName: 'Sharma',
      name: 'Rohan Sharma',
      password: passwordHash,
      role: 'MANAGER',
      departments: {
        connect: { id: prodDept.id },
      },
    },
  });

  const aditi = await prisma.user.upsert({
    where: { email: 'aditi@assetflow.com' },
    update: { password: passwordHash, name: 'Aditi Verma' },
    create: {
      email: 'aditi@assetflow.com',
      firstName: 'Aditi',
      lastName: 'Verma',
      name: 'Aditi Verma',
      password: passwordHash,
      role: 'PROCUREMENT_OFFICER',
      departments: {
        connect: { id: designDept.id },
      },
    },
  });

  // 6. Create Assets
  const asset1 = await prisma.asset.upsert({
    where: { serialNumber: 'SN-DELL-9988' },
    update: {},
    create: {
      tag: 'AF-0114',
      name: 'Dell XPS 15 Laptop',
      serialNumber: 'SN-DELL-9988',
      acquisitionDate: new Date('2025-01-10'),
      acquisitionCost: 1450.00,
      condition: 'NEW',
      status: 'ALLOCATED',
      locationId: mumbaiLoc.id,
      categoryId: laptopsCat.id,
      departmentId: engDept.id,
    },
  });

  const asset2 = await prisma.asset.upsert({
    where: { serialNumber: 'SN-SAMS-7766' },
    update: {},
    create: {
      tag: 'AF-0116',
      name: 'Samsung 32" Curved Monitor',
      serialNumber: 'SN-SAMS-7766',
      acquisitionDate: new Date('2025-03-15'),
      acquisitionCost: 350.00,
      condition: 'GOOD',
      status: 'ALLOCATED',
      locationId: bangaloreLoc.id,
      categoryId: monitorsCat.id,
      departmentId: mktDept.id,
    },
  });

  const asset3 = await prisma.asset.upsert({
    where: { serialNumber: 'SN-IPAD-5544' },
    update: {},
    create: {
      tag: 'AF-0118',
      name: 'iPad Pro M4',
      serialNumber: 'SN-IPAD-5544',
      acquisitionDate: new Date('2025-05-20'),
      acquisitionCost: 1100.00,
      condition: 'GOOD',
      status: 'ALLOCATED',
      locationId: mumbaiLoc.id,
      categoryId: mobilesCat.id,
      departmentId: prodDept.id,
    },
  });

  const asset4 = await prisma.asset.upsert({
    where: { serialNumber: 'SN-THINK-1122' },
    update: {},
    create: {
      tag: 'AF-0120',
      name: 'Lenovo ThinkPad X1 Carbon',
      serialNumber: 'SN-THINK-1122',
      acquisitionDate: new Date('2025-06-01'),
      acquisitionCost: 1800.00,
      condition: 'NEW',
      status: 'AVAILABLE',
      locationId: bangaloreLoc.id,
      categoryId: laptopsCat.id,
    },
  });

  // 7. Create Allocations
  await prisma.allocation.createMany({
    data: [
      {
        assetId: asset1.id,
        employeeId: priya.id,
        allocatedById: admin.id,
        status: 'ACTIVE',
      },
      {
        assetId: asset2.id,
        employeeId: arjun.id,
        allocatedById: admin.id,
        status: 'ACTIVE',
      },
      {
        assetId: asset3.id,
        employeeId: rohan.id,
        allocatedById: admin.id,
        status: 'ACTIVE',
      },
    ],
    skipDuplicates: true,
  });

  // 8. Create Transfer Requests
  await prisma.transferRequest.createMany({
    data: [
      {
        assetId: asset1.id,
        fromEmployeeId: priya.id,
        toEmployeeId: arjun.id,
        requestedById: priya.id,
        status: 'PENDING',
      },
      {
        assetId: asset2.id,
        fromEmployeeId: arjun.id,
        toEmployeeId: aditi.id,
        requestedById: arjun.id,
        status: 'APPROVED',
        approvedById: admin.id,
      },
    ],
    skipDuplicates: true,
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
