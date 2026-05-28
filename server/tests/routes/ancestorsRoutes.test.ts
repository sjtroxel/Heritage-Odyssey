import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app.js';
import { db } from '../../src/db/index.js';

vi.mock('../../src/db/index.js', () => ({
  db: {
    query: {
      ancestorProfiles: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

const mockAncestor = {
  id: 'ancestor-id',
  userId: 'user-id',
  name: 'Stanisław',
  birthRegion: 'Galicia, Poland',
  era: '1880s',
  createdAt: new Date(),
  lastName: 'Kowalski',
  birthYear: 1861,
  deathYear: null,
  originCountry: 'Poland',
  destination: 'Chicago, Illinois',
  relationship: 'Great-great-grandfather',
  notes: null,
};

describe('Ancestors Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (jwt.verify as MockInstance).mockReturnValue({ sub: 'user-id' });
  });

  describe('POST /api/ancestors', () => {
    it('should return 401 without a token', async () => {
      (jwt.verify as MockInstance).mockImplementation(() => {
        throw new Error();
      });
      const response = await request(app).post('/api/ancestors').send({});
      expect(response.status).toBe(401);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/ancestors')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Stanisław' });
      expect(response.status).toBe(400);
    });

    it('should create an ancestor profile and return 201', async () => {
      (db.insert as MockInstance).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockAncestor]),
        }),
      });

      const response = await request(app)
        .post('/api/ancestors')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Stanisław', birthRegion: 'Galicia, Poland', era: '1880s' });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Stanisław');
    });
  });

  describe('GET /api/ancestors', () => {
    it('should return 401 without a token', async () => {
      (jwt.verify as MockInstance).mockImplementation(() => {
        throw new Error();
      });
      const response = await request(app).get('/api/ancestors');
      expect(response.status).toBe(401);
    });

    it("should return only the authenticated user's profiles", async () => {
      (db.select as MockInstance).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([mockAncestor]),
          }),
        }),
      });

      const response = await request(app)
        .get('/api/ancestors')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Stanisław');
    });

    it('should return an empty array for a user with no profiles', async () => {
      (db.select as MockInstance).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const response = await request(app)
        .get('/api/ancestors')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('PATCH /api/ancestors/:id', () => {
    it('should return 403 if the profile belongs to another user', async () => {
      (db.query.ancestorProfiles.findFirst as MockInstance).mockResolvedValue({
        ...mockAncestor,
        userId: 'other-user-id',
      });

      const response = await request(app)
        .patch('/api/ancestors/ancestor-id')
        .set('Authorization', 'Bearer valid-token')
        .send({ notes: 'Updated notes' });

      expect(response.status).toBe(403);
    });

    it('should return 404 if the profile does not exist', async () => {
      (db.query.ancestorProfiles.findFirst as MockInstance).mockResolvedValue(undefined);

      const response = await request(app)
        .patch('/api/ancestors/nonexistent-id')
        .set('Authorization', 'Bearer valid-token')
        .send({ notes: 'Updated notes' });

      expect(response.status).toBe(404);
    });

    it("should apply a partial update to the owner's profile", async () => {
      (db.query.ancestorProfiles.findFirst as MockInstance).mockResolvedValue(mockAncestor);
      const updated = { ...mockAncestor, notes: 'Ship manifest: 1883' };
      (db.update as MockInstance).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      });

      const response = await request(app)
        .patch('/api/ancestors/ancestor-id')
        .set('Authorization', 'Bearer valid-token')
        .send({ notes: 'Ship manifest: 1883' });

      expect(response.status).toBe(200);
      expect(response.body.notes).toBe('Ship manifest: 1883');
    });
  });

  describe('DELETE /api/ancestors/:id', () => {
    it('should return 404 if the profile does not exist', async () => {
      (db.query.ancestorProfiles.findFirst as MockInstance).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/ancestors/nonexistent-id')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });

    it('should return 403 if the profile belongs to another user', async () => {
      (db.query.ancestorProfiles.findFirst as MockInstance).mockResolvedValue({
        ...mockAncestor,
        userId: 'other-user-id',
      });

      const response = await request(app)
        .delete('/api/ancestors/ancestor-id')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });

    it('should delete the profile and return 204', async () => {
      (db.query.ancestorProfiles.findFirst as MockInstance).mockResolvedValue(mockAncestor);
      (db.delete as MockInstance).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const response = await request(app)
        .delete('/api/ancestors/ancestor-id')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
    });
  });
});
