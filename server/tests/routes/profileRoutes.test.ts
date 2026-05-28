import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app.js';
import { db } from '../../src/db/index.js';

vi.mock('../../src/db/index.js', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

const mockUser = {
  id: 'user-id',
  email: 'test@example.com',
  passwordHash: 'hashed',
  createdAt: new Date(),
  firstName: 'Jane',
  lastName: 'Smith',
  dateOfBirth: null,
  birthLocation: null,
  currentLocation: null,
  heritageRegions: null,
  researchInterests: null,
  profileComplete: false,
};

describe('Profile Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/auth/profile', () => {
    it('should return 401 without a token', async () => {
      const response = await request(app).get('/api/auth/profile');
      expect(response.status).toBe(401);
    });

    it('should return the user profile with a valid token', async () => {
      (jwt.verify as MockInstance).mockReturnValue({ sub: 'user-id' });
      (db.query.users.findFirst as MockInstance).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('user-id');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.firstName).toBe('Jane');
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('should return 404 if user no longer exists', async () => {
      (jwt.verify as MockInstance).mockReturnValue({ sub: 'user-id' });
      (db.query.users.findFirst as MockInstance).mockResolvedValue(undefined);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/auth/profile', () => {
    it('should return 401 without a token', async () => {
      const response = await request(app).patch('/api/auth/profile').send({ firstName: 'Updated' });
      expect(response.status).toBe(401);
    });

    it('should update only the provided fields', async () => {
      (jwt.verify as MockInstance).mockReturnValue({ sub: 'user-id' });
      (db.query.users.findFirst as MockInstance).mockResolvedValue(mockUser);

      const updatedUser = { ...mockUser, currentLocation: 'Cape Girardeau, MO' };
      (db.update as MockInstance).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const response = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ currentLocation: 'Cape Girardeau, MO' });

      expect(response.status).toBe(200);
      expect(response.body.currentLocation).toBe('Cape Girardeau, MO');
    });

    it('should auto-set profileComplete when name and heritageRegions are present', async () => {
      (jwt.verify as MockInstance).mockReturnValue({ sub: 'user-id' });
      (db.query.users.findFirst as MockInstance).mockResolvedValue(mockUser);

      const updatedUser = { ...mockUser, heritageRegions: ['Ireland'], profileComplete: true };
      (db.update as MockInstance).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const response = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ heritageRegions: ['Ireland'] });

      expect(response.status).toBe(200);
      expect(response.body.profileComplete).toBe(true);
    });

    it('should return 400 when no valid fields are provided', async () => {
      (jwt.verify as MockInstance).mockReturnValue({ sub: 'user-id' });

      const response = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ unknownField: 'ignored' });

      expect(response.status).toBe(400);
    });

    it('should ignore unknown fields in the request body', async () => {
      (jwt.verify as MockInstance).mockReturnValue({ sub: 'user-id' });
      (db.query.users.findFirst as MockInstance).mockResolvedValue(mockUser);

      const updatedUser = { ...mockUser, firstName: 'Updated' };
      (db.update as MockInstance).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      const response = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ firstName: 'Updated', passwordHash: 'hacked', email: 'hacked@evil.com' });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('test@example.com');
    });
  });
});
