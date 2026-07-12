const { PrismaClient } = require('@prisma/client');
const env = require('./env');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

async function connectDB() {
  try {
    await prisma.$connect();
    console.log('🔌 Database connected successfully via Prisma Client');
  } catch (error) {
    console.warn('⚠️ Database connection warning:', error.message);
    console.warn('⚠️ Server is running but database-dependent features will fail.');
  }
}

module.exports = {
  prisma,
  connectDB,
};
