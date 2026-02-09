import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createHealthRouter } from './routes/health.js';
import { createAuthRouter } from './routes/auth.js';
import { createUploadRouter } from './routes/upload.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(createHealthRouter());
app.use(createAuthRouter());
app.use(createUploadRouter());

const port = process.env.PORT || 4000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on port ${port}`);
});

