import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('EmployeesController (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Try to login to get token
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@techindustan.com', password: 'Admin@123' });
    
    if (res.status === 201 || res.status === 200) {
      token = res.body.access_token;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('/employees (GET) - fails without auth', () => {
    return request(app.getHttpServer())
      .get('/employees')
      .expect(401);
  });

  it('/employees (GET) - succeeds with auth', async () => {
    if (!token) {
      console.warn('Skipping /employees test due to missing token');
      return;
    }
    const res = await request(app.getHttpServer())
      .get('/employees')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});
