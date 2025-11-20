import request from 'supertest';
import express from 'express';
import auditRoutes from '../routes/audit.routes';
import { pool } from '../config/database';
import jwt from 'jsonwebtoken';

// Mock auth middleware for tests
const authMiddleware = (req: any, res: any, next: any) => {
  req.user = { userId: req.headers['x-user-id'] };
  next();
};

const app = express();
app.use(express.json());
app.use('/api/audits', authMiddleware, auditRoutes);

let authToken: string;
let userId: string;

describe('Audit API', () => {
  beforeAll(async () => {
    // Create a test user and get token
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      ['testaudit@example.com', 'hashedpassword']
    );
    userId = userResult.rows[0].id;

    authToken = jwt.sign(
      { userId, email: 'testaudit@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM audits WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.end();
  });

  describe('POST /api/audits', () => {
    it('should create a new audit', async () => {
      const response = await request(app)
        .post('/api/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://example.com',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.url).toBe('https://example.com');
      expect(response.body.status).toBe('pending');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/audits')
        .send({
          url: 'https://example.com',
        });

      expect(response.status).toBe(401);
    });

    it('should fail with invalid URL', async () => {
      const response = await request(app)
        .post('/api/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'not-a-url',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/audits', () => {
    beforeAll(async () => {
      // Create some test audits
      await pool.query(
        'INSERT INTO audits (user_id, domain, url, status) VALUES ($1, $2, $3, $4)',
        [userId, 'example.com', 'https://example.com', 'completed']
      );
    });

    it('should get all user audits', async () => {
      const response = await request(app)
        .get('/api/audits')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/api/audits');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/audits/:id', () => {
    let auditId: string;

    beforeAll(async () => {
      const result = await pool.query(
        'INSERT INTO audits (user_id, domain, url, status) VALUES ($1, $2, $3, $4) RETURNING id',
        [userId, 'example.com', 'https://example.com', 'completed']
      );
      auditId = result.rows[0].id;
    });

    it('should get a specific audit', async () => {
      const response = await request(app)
        .get(`/api/audits/${auditId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(auditId);
    });

    it('should fail for non-existent audit', async () => {
      const response = await request(app)
        .get('/api/audits/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
