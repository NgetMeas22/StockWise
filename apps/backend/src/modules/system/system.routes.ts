import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

router.get('/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'unready', database: 'disconnected' });
  }
});

export const systemRoutes = router;

