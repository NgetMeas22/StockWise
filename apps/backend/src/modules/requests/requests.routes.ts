import { Router } from 'express';
import { requestsController } from './requests.controller.js';
import { requireAuth } from '../../middleware/session.js';

const router = Router();

router.get('/', requireAuth, requestsController.listRequests);
router.post('/', requireAuth, requestsController.createRequest);
router.post('/:id/fulfill', requireAuth, requestsController.fulfillRequest);
router.post('/:id/reject', requireAuth, requestsController.rejectRequest);

export const requestsRoutes = router;

