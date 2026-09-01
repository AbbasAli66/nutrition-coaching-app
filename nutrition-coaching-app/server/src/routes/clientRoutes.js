import express from 'express';
import { getClients } from '../controllers/clientController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, authorizeRoles('COACH'), getClients);

export default router;