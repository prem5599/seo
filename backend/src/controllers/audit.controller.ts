import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { query } from '../config/database';
import auditService from '../services/audit.service';

export const createAudit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { url, domain } = req.body;
    const userId = req.user?.id;

    if (!url || !domain) {
      res.status(400).json({
        status: 'error',
        message: 'URL and domain are required'
      });
      return;
    }

    // Create audit record
    const result = await query(
      `INSERT INTO audits (user_id, domain, url, status, health_score, total_pages_crawled, critical_issues_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [userId, domain, url, 'pending', 0, 0, 0]
    );

    const audit = result.rows[0];

    // Start audit process in background
    auditService.runAudit(audit.id, url).catch(error => {
      console.error('Background audit error:', error);
    });

    res.status(201).json({
      status: 'success',
      data: {
        audit
      }
    });
  } catch (error) {
    console.error('Create audit error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create audit'
    });
  }
};

export const getAudits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const result = await query(
      `SELECT * FROM audits WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      status: 'success',
      data: {
        audits: result.rows,
        count: result.rows.length
      }
    });
  } catch (error) {
    console.error('Get audits error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch audits'
    });
  }
};

export const getAuditById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { auditId } = req.params;
    const userId = req.user?.id;

    const result = await query(
      `SELECT * FROM audits WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Audit not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        audit: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get audit error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch audit'
    });
  }
};

export const deleteAudit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { auditId } = req.params;
    const userId = req.user?.id;

    const result = await query(
      `DELETE FROM audits WHERE id = $1 AND user_id = $2 RETURNING id`,
      [auditId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Audit not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Audit deleted successfully'
    });
  } catch (error) {
    console.error('Delete audit error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete audit'
    });
  }
};

export const getAuditIssues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { auditId } = req.params;
    const userId = req.user?.id;

    // Verify audit ownership
    const auditResult = await query(
      `SELECT id FROM audits WHERE id = $1 AND user_id = $2`,
      [auditId, userId]
    );

    if (auditResult.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Audit not found'
      });
      return;
    }

    // Get issues for this audit
    const issuesResult = await query(
      `SELECT * FROM issues WHERE audit_id = $1 ORDER BY severity DESC, created_at DESC`,
      [auditId]
    );

    res.status(200).json({
      status: 'success',
      data: {
        issues: issuesResult.rows,
        count: issuesResult.rows.length
      }
    });
  } catch (error) {
    console.error('Get audit issues error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch audit issues'
    });
  }
};
