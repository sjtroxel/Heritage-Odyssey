import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { db } from '../src/db/index.js';

vi.mock('../src/db/index.js', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

describe('Auth Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user and return 201', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
      };

      (db.query.users.findFirst as MockInstance).mockResolvedValue(undefined);
      (bcrypt.hash as MockInstance).mockResolvedValue('hashed-password');
      (db.insert as MockInstance).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockUser]),
        }),
      });
      (jwt.sign as MockInstance).mockReturnValue('mock-token');

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.accessToken).toBe('mock-token');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 if user already exists', async () => {
      (db.query.users.findFirst as MockInstance).mockResolvedValue({ id: 'existing' });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully and return 200', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
      };

      (db.query.users.findFirst as MockInstance).mockResolvedValue(mockUser);
      (bcrypt.compare as MockInstance).mockResolvedValue(true);
      (jwt.sign as MockInstance).mockReturnValue('mock-token');

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.accessToken).toBe('mock-token');
    });

    it('should return 401 for invalid credentials', async () => {
      (db.query.users.findFirst as MockInstance).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear cookie and return 200', async () => {
      const response = await request(app).post('/api/auth/logout');
      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']?.[0]).toContain('refreshToken=;');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return new tokens with valid refresh token', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        createdAt: new Date(),
      };

      (jwt.verify as MockInstance).mockReturnValue({ sub: 'user-id' });
      (db.query.users.findFirst as MockInstance).mockResolvedValue(mockUser);
      (jwt.sign as MockInstance).mockReturnValue('new-token');

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=valid-token']);

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBe('new-token');
    });

    it('should return 401 if refresh token is missing', async () => {
      const response = await request(app).post('/api/auth/refresh');
      expect(response.status).toBe(401);
    });

    it('should return 401 if refresh token is invalid', async () => {
      (jwt.verify as MockInstance).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=invalid-token']);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/profile', () => {
    it('should return user profile with valid token', async () => {
      (jwt.verify as MockInstance).mockReturnValue({ sub: 'user-id' });

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe('user-id');
    });

    it('should return 401 with invalid token', async () => {
      (jwt.verify as MockInstance).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
