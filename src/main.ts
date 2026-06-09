import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend integration
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip non-dto fields
      transform: true, // convert types of query params
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Payroll Management backend running on: http://localhost:${port}`);
}
bootstrap();
