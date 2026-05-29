import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { app } from '../../src/app.js';
import { db } from '../../src/db/index.js';
import { parseGedcom } from '../../src/services/gedcomParser.js';
import { index as pineconeIndex } from '../../src/services/pinecone.js';

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

vi.mock('../../src/services/gedcomParser.js', () => ({
  parseGedcom: vi.fn(),
}));

const { mockDeleteAll } = vi.hoisted(() => ({
  mockDeleteAll: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/services/pinecone.js', () => ({
  index: { namespace: vi.fn().mockReturnValue({ deleteAll: mockDeleteAll }) },
}));

vi.mock('../../src/services/embedding.js', () => ({
  embedAncestorProfile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
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

  describe('POST /api/ancestors/import/gedcom', () => {
    const mockParsedAncestor = {
      gedcomId: '@I1@',
      name: 'Heinrich Mueller',
      lastName: 'Mueller',
      birthDate: '12 MAR 1845',
      birthPlace: 'Saxony, Germany',
      birthYear: 1845,
    };
    const gedcomBuffer = Buffer.from('0 HEAD\n0 TRLR');

    beforeEach(() => {
      (parseGedcom as MockInstance).mockReturnValue({
        ancestors: [mockParsedAncestor],
        warnings: [],
      });
    });

    it('should return 401 without a token', async () => {
      (jwt.verify as MockInstance).mockImplementation(() => {
        throw new Error();
      });
      const response = await request(app)
        .post('/api/ancestors/import/gedcom')
        .attach('file', gedcomBuffer, { filename: 'test.ged', contentType: 'text/plain' });
      expect(response.status).toBe(401);
    });

    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/ancestors/import/gedcom')
        .set('Authorization', 'Bearer valid-token')
        .send();
      expect(response.status).toBe(400);
    });

    it('should insert a new ancestor and return imported count', async () => {
      (db.query.ancestorProfiles.findFirst as MockInstance).mockResolvedValue(undefined);
      (db.insert as MockInstance).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ ...mockAncestor, gedcomId: '@I1@' }]),
        }),
      });

      const response = await request(app)
        .post('/api/ancestors/import/gedcom')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', gedcomBuffer, { filename: 'test.ged', contentType: 'text/plain' });

      expect(response.status).toBe(200);
      expect(response.body.imported).toBe(1);
      expect(response.body.warnings).toEqual([]);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should update an existing ancestor when gedcomId matches (idempotent)', async () => {
      (db.query.ancestorProfiles.findFirst as MockInstance).mockResolvedValue({
        ...mockAncestor,
        gedcomId: '@I1@',
      });
      (db.update as MockInstance).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...mockAncestor, gedcomId: '@I1@' }]),
          }),
        }),
      });

      const response = await request(app)
        .post('/api/ancestors/import/gedcom')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', gedcomBuffer, { filename: 'test.ged', contentType: 'text/plain' });

      expect(response.status).toBe(200);
      expect(response.body.imported).toBe(1);
      expect(db.update).toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should include parser warnings in the response', async () => {
      (parseGedcom as MockInstance).mockReturnValue({
        ancestors: [],
        warnings: ['Skipped living or private person: @I6@'],
      });

      const response = await request(app)
        .post('/api/ancestors/import/gedcom')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', gedcomBuffer, { filename: 'test.ged', contentType: 'text/plain' });

      expect(response.status).toBe(200);
      expect(response.body.imported).toBe(0);
      expect(response.body.warnings).toHaveLength(1);
    });
  });

  describe('POST /api/ancestors/import/sample', () => {
    it('should return 401 without a token', async () => {
      (jwt.verify as MockInstance).mockImplementation(() => {
        throw new Error();
      });
      const response = await request(app).post('/api/ancestors/import/sample');
      expect(response.status).toBe(401);
    });

    it('should read the fixture and import ancestors', async () => {
      (readFileSync as MockInstance).mockReturnValue('0 HEAD\n0 TRLR');
      (parseGedcom as MockInstance).mockReturnValue({
        ancestors: [
          { gedcomId: '@I1@', name: 'Heinrich Mueller', birthYear: 1845 },
          { gedcomId: '@I2@', name: 'Anna Hoffmann', birthYear: 1848 },
        ],
        warnings: ['Skipped living or private person: @I6@'],
      });
      (db.query.ancestorProfiles.findFirst as MockInstance).mockResolvedValue(undefined);
      (db.insert as MockInstance).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockAncestor]),
        }),
      });

      const response = await request(app)
        .post('/api/ancestors/import/sample')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.imported).toBe(2);
      expect(response.body.warnings).toHaveLength(1);
      expect(readFileSync).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/ancestors/import', () => {
    it('should return 401 without a token', async () => {
      (jwt.verify as MockInstance).mockImplementation(() => {
        throw new Error();
      });
      const response = await request(app).delete('/api/ancestors/import');
      expect(response.status).toBe(401);
    });

    it('should purge the Pinecone namespace and delete imported DB rows', async () => {
      (db.delete as MockInstance).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const response = await request(app)
        .delete('/api/ancestors/import')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
      expect(vi.mocked(pineconeIndex.namespace)).toHaveBeenCalledWith('user-user-id');
      expect(mockDeleteAll).toHaveBeenCalled();
      expect(db.delete).toHaveBeenCalled();
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
