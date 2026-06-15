import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Initializing application context for database seeding...');
  const appContext = await NestFactory.createApplicationContext(AppModule);
  try {
    const appModule = appContext.get(AppModule);
    await appModule.seed();
    console.log('Database seeding finished successfully!');
  } catch (error) {
    console.error('Seeding process failed:', error);
  } finally {
    await appContext.close();
  }
}

bootstrap();
