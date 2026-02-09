import type { Router } from 'express';
import express from 'express';

export function createHealthRouter(): Router {
  const router = express.Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'ebo-multi-uploader-backend' });
  });

  return router;
}

