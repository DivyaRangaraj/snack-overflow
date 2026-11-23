import { createApp } from './app';
import { config } from './config';
import { prisma } from './config/database';

const app = createApp();

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(config.port, () => {
      console.log(`🚀 Snack Overflow backend running on http://localhost:${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
