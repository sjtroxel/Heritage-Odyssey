import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Express App', () => {
  it('should return 200 OK for /health', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should have security headers (helmet)', async () => {
    const response = await request(app).get('/health');
    expect(response.headers).toHaveProperty('x-content-type-options');
    expect(response.headers).toHaveProperty('x-dns-prefetch-control');
    expect(response.headers).toHaveProperty('x-frame-options');
  });

  describe('Auth Routes', () => {
    it('should return 400 for signup with missing data', async () => {
      const response = await request(app).post('/api/auth/signup').send({});
      expect(response.status).toBe(400);
    });

    it('should return 400 for login with missing data', async () => {
      const response = await request(app).post('/api/auth/login').send({});
      expect(response.status).toBe(400);
    });

    it('should return 401 for /api/profile without token', async () => {
      const response = await request(app).get('/api/profile');
      expect(response.status).toBe(401);
    });
  });
});
