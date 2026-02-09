import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const backendTarget = process.env.BACKEND_URL || 'http://localhost:4000';

app.use(
  ['/api', '/health'],
  createProxyMiddleware({
    target: backendTarget,
    changeOrigin: true,
  }),
);

const distDir = path.resolve(__dirname, '../dist');
app.use(express.static(distDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = process.env.PORT || 4173;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Frontend server listening on port ${port}`);
});

