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
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = {
  prisma,
  connectDB,
};
