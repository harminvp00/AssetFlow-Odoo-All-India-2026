const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/database');

const PORT = env.PORT || 5000;

async function startServer() {
  // Establish database connection
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 AssetFlow Server is running in ${env.NODE_ENV} mode on port ${PORT}`);
  });
}

startServer();
