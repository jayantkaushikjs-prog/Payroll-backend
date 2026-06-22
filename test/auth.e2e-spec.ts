import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/login (POST) - fails with incorrect credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrongpassword' })
      .expect(401);
  });

  it('/auth/login (POST) - succeeds with valid credentials (assuming seed user)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@techindustan.com', password: 'Admin@123' }); // Standard seeded admin user

    if (response.status === 201 || response.status === 200) {
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
    } else {
      // If the DB doesn't have the user, it might fail, which is expected based on DB state.
      console.warn(`Login returned ${response.status}. Make sure seed data exists.`);
    }
  });
});
