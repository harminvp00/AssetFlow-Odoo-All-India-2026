const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with default values...');

  // Create default admin user if not exists
  const admin = await prisma.user.upsert({
    where: { email: 'admin@assetflow.com' },
    update: {},
    create: {
      email: 'admin@assetflow.com',
      name: 'System Admin',
      password: 'admin_password_hash_here',
      role: 'ADMIN',
    },
  });

  console.log(`Seeding finished. Default Admin: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
