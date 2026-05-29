import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { db } from '../src/db/index.js';

const mockOAuthInstance = vi.hoisted(() => ({
  generateAuthUrl: vi.fn(),
  getToken: vi.fn(),
  verifyIdToken: vi.fn(),
}));

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn(function MockOAuth2Client() {
    return mockOAuthInstance;
  }),
}));

vi.mock('../src/db/index.js', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
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
        firstName: 'Jane',
        lastName: 'Smith',
        profileComplete: false,
        dateOfBirth: null,
        birthLocation: null,
        currentLocation: null,
        heritageRegions: null,
        researchInterests: null,
      };

      (db.query.users.findFirst as MockInstance).mockResolvedValue(undefined);
      (bcrypt.hash as MockInstance).mockResolvedValue('hashed-password');
      (db.insert as MockInstance).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockUser]),
        }),
      });
      (jwt.sign as MockInstance).mockReturnValue('mock-token');

      const response = await request(app).post('/api/auth/signup').send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.firstName).toBe('Jane');
      expect(response.body.accessToken).toBe('mock-token');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 if firstName is missing', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: 'password123', lastName: 'Smith' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('First name and last name are required');
    });

    it('should return 400 if lastName is missing', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: 'password123', firstName: 'Jane' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('First name and last name are required');
    });

    it('should return 400 if user already exists', async () => {
      (db.query.users.findFirst as MockInstance).mockResolvedValue({ id: 'existing' });

      const response = await request(app).post('/api/auth/signup').send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      });

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

  describe('POST /api/auth/demo', () => {
    const mockDemoUser = {
      id: 'demo-user-id',
      email: 'guest@heritage-odyssey.demo',
      authProvider: 'demo',
      passwordHash: 'hashed',
      createdAt: new Date(),
      firstName: null,
      lastName: null,
      dateOfBirth: null,
      birthLocation: null,
      currentLocation: null,
      heritageRegions: null,
      researchInterests: null,
      profileComplete: false,
      googleId: null,
    };

    it('should issue JWTs for the demo user', async () => {
      (db.query.users.findFirst as MockInstance).mockResolvedValue(mockDemoUser);
      (jwt.sign as MockInstance).mockReturnValue('demo-token');

      const response = await request(app).post('/api/auth/demo');

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('guest@heritage-odyssey.demo');
      expect(response.body.accessToken).toBe('demo-token');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 503 if no demo user exists', async () => {
      (db.query.users.findFirst as MockInstance).mockResolvedValue(undefined);

      const response = await request(app).post('/api/auth/demo');

      expect(response.status).toBe(503);
      expect(response.body.message).toBe('Demo account not available');
    });
  });

  describe('GET /api/auth/google', () => {
    it('should return a Google OAuth URL', async () => {
      mockOAuthInstance.generateAuthUrl.mockReturnValue(
        'https://accounts.google.com/o/oauth2/v2/auth?mock',
      );

      const response = await request(app).get('/api/auth/google');

      expect(response.status).toBe(200);
      expect(response.body.url).toBe('https://accounts.google.com/o/oauth2/v2/auth?mock');
    });
  });

  describe('GET /api/auth/google/callback', () => {
    const mockGoogleUser = {
      id: 'google-user-id',
      email: 'guser@gmail.com',
      googleId: 'google-sub-123',
      authProvider: 'google',
      createdAt: new Date(),
      passwordHash: null,
      firstName: null,
      lastName: null,
      dateOfBirth: null,
      birthLocation: null,
      currentLocation: null,
      heritageRegions: null,
      researchInterests: null,
      profileComplete: false,
    };

    it('should create a new user and redirect with access token', async () => {
      mockOAuthInstance.getToken.mockResolvedValue({ tokens: { id_token: 'google-id-token' } });
      mockOAuthInstance.verifyIdToken.mockResolvedValue({
        getPayload: () => ({ email: 'guser@gmail.com', sub: 'google-sub-123' }),
      });
      (db.query.users.findFirst as MockInstance).mockResolvedValue(undefined);
      (db.insert as MockInstance).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockGoogleUser]),
        }),
      });
      (jwt.sign as MockInstance).mockReturnValue('mock-access-token');

      const response = await request(app).get('/api/auth/google/callback?code=auth-code-123');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('mock-access-token');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should link a Google identity to an existing email account', async () => {
      const existingUser = { ...mockGoogleUser, googleId: null, authProvider: 'password' };
      const linkedUser = { ...mockGoogleUser };

      mockOAuthInstance.getToken.mockResolvedValue({ tokens: { id_token: 'google-id-token' } });
      mockOAuthInstance.verifyIdToken.mockResolvedValue({
        getPayload: () => ({ email: 'guser@gmail.com', sub: 'google-sub-123' }),
      });
      (db.query.users.findFirst as MockInstance)
        .mockResolvedValueOnce(undefined) // googleId lookup: not found
        .mockResolvedValueOnce(existingUser); // email lookup: found
      (db.update as MockInstance).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([linkedUser]),
          }),
        }),
      });
      (jwt.sign as MockInstance).mockReturnValue('mock-access-token');

      const response = await request(app).get('/api/auth/google/callback?code=auth-code-123');

      expect(response.status).toBe(302);
      expect(db.update as MockInstance).toHaveBeenCalled();
    });

    it('should return 401 on token exchange failure', async () => {
      mockOAuthInstance.getToken.mockRejectedValue(new Error('Token exchange failed'));

      const response = await request(app).get('/api/auth/google/callback?code=bad-code');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Google authentication failed');
    });

    it('should return 400 when code is missing', async () => {
      const response = await request(app).get('/api/auth/google/callback');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Missing authorization code');
    });
  });
});
