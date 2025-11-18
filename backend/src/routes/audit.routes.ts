import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createAudit,
  getAudits,
  getAuditById,
  deleteAudit,
  getAuditIssues
} from '../controllers/audit.controller';

const router = Router();

// All audit routes require authentication
router.use(authenticate);

router.post('/', createAudit);
router.get('/', getAudits);
router.get('/:auditId', getAuditById);
router.delete('/:auditId', deleteAudit);
router.get('/:auditId/issues', getAuditIssues);

export default router;
