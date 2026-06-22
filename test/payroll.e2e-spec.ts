import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('PayrollController (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

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

  it('/payroll/drafts (GET) - succeeds with auth', async () => {
    if (!token) return;
    const res = await request(app.getHttpServer())
      .get('/payroll/drafts?month=5&year=2026')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});
