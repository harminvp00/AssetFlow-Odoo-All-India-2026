const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with default values...');

  // Create default admin user if not exists
  const admin = await prisma.user.upsert({
    where: { email: 'admin@assetflow.com' },
    update: {
      password: '$2a$10$pvgd9XdiD9SlMXVq4Wj10OgDMcKn6Tv/G8459KnZigXNe1YaeoMla'
    },
    create: {
      email: 'admin@assetflow.com',
      name: 'System Admin',
      password: '$2a$10$pvgd9XdiD9SlMXVq4Wj10OgDMcKn6Tv/G8459KnZigXNe1YaeoMla',
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
