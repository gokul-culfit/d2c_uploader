import type { Router } from 'express';
import express from 'express';
import multer from 'multer';
import { getUploader, listUploaders, getUploaderFormat } from '../uploaders/index.js';
import { parseCsv } from '../utils/csvParser.js';
import { parseExcel } from '../utils/excelParser.js';
import { sendToDataPlatformWebhook } from '../utils/dataPlatformWebhook.js';
import { requireAuth } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage() });

type UploadBody = {
  fileName: string;
  mimeType?: string;
  data: string; // csv text or base64 excel
};

function detectFileType(fileName: string, mimeType?: string): 'csv' | 'excel' | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return 'excel';

  if (mimeType) {
    const mt = mimeType.toLowerCase();
    if (mt.includes('csv')) return 'csv';
    if (mt.includes('excel') || mt.includes('spreadsheet')) return 'excel';
  }

  return null;
}

export function createUploadRouter(): Router {
  const router = express.Router();
  router.use(requireAuth);

  router.get('/api/uploaders', (_req, res) => {
    res.json(listUploaders());
  });

  router.get('/api/uploaders/:uploaderId/format', (req, res) => {
    const format = getUploaderFormat(req.params.uploaderId);
    if (!format) {
      return res.status(404).json({ error: 'Unknown uploader' });
    }
    res.json(format);
  });

  router.post(
    '/api/upload/:uploaderId',
    upload.single('file'),
    async (req, res) => {
      const { uploaderId } = req.params;
      const isPreview = req.query.preview === '1' || req.query.preview === 'true';
      const uploader = getUploader(uploaderId);
      if (!uploader) {
        return res.status(404).json({ success: false, error: 'Unknown uploader' });
      }

      let fileName: string | undefined;
      let mimeType: string | undefined;
      let rawData: string | undefined;

      if (req.file) {
        fileName = req.file.originalname;
        mimeType = req.file.mimetype;
        rawData = req.file.buffer.toString('base64');
      } else if (req.is('application/json')) {
        const body = req.body as UploadBody;
        fileName = body.fileName;
        mimeType = body.mimeType;
        rawData = body.data;
      }

      if (!fileName || !rawData) {
        return res.status(400).json({ success: false, error: 'Missing file data' });
      }

      const fileType = detectFileType(fileName, mimeType);
      if (!fileType || !uploader.acceptedFileTypes.includes(fileType)) {
        return res.status(400).json({ success: false, error: 'Unsupported file type' });
      }

      let headers: string[] = [];
      let rows: Record<string, string | number>[] = [];

      try {
        if (fileType === 'csv') {
          const csvText =
            req.file && !req.is('application/json')
              ? req.file.buffer.toString('utf8')
              : rawData;
          const parsed = parseCsv(csvText);
          headers = parsed.headers;
          rows = parsed.rows;
        } else {
          const buffer =
            req.file && !req.is('application/json')
              ? req.file.buffer
              : Buffer.from(rawData, 'base64');
          const parsed = parseExcel(buffer);
          headers = parsed.headers;
          rows = parsed.rows;
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error parsing file', err);
        return res.status(400).json({ success: false, error: 'Failed to parse file' });
      }

      // Validate all required columns are present
      const headerErrors = uploader.validateHeaders(headers);
      const columnsValid = headerErrors.length === 0;

      const events: Record<string, unknown>[] = [];
      const rowErrors: string[] = [];

      if (columnsValid) {
        rows.forEach((row, idx) => {
          try {
            const event = uploader.mapRowToEvent(row, idx + 1);
            if (event) {
              events.push(event as Record<string, unknown>);
            }
          } catch (e) {
            rowErrors.push(`Row ${idx + 1}: ${(e as Error).message}`);
          }
        });
      }

      // Preview mode: return validation + data, do NOT send to data platform
      if (isPreview) {
        return res.json({
          preview: true,
          success: columnsValid,
          uploaderId,
          totalRows: rows.length,
          validRows: events.length,
          columnsValid,
          missingColumns: headerErrors,
          rows: rows.slice(0, 1000), // raw parsed data for preview (always show what was uploaded)
          events: events.slice(0, 1000),
          rowErrors: rowErrors.slice(0, 50),
        });
      }

      if (!columnsValid) {
        return res.status(400).json({
          success: false,
          uploaderId,
          totalRows: rows.length,
          validRows: 0,
          sentToKafka: 0,
          columnsValid: false,
          missingColumns: headerErrors,
        });
      }

      const userEmail = req.user?.email ?? 'unknown';
      const uploadedAt = new Date().toISOString();
      const enrichedEvents = events.map((e) => ({
        ...e,
        uploadedAt,
        uploadedBy: userEmail,
      }));

      try {
        await sendToDataPlatformWebhook(
          uploader.eventName,
          uploader.kafkaTopic,
          enrichedEvents as Record<string, unknown>[],
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error sending to data platform webhook', err);
        const errMsg = err instanceof Error ? err.message : 'Failed to send events to data platform';
        return res.status(502).json({
          success: false,
          uploaderId,
          totalRows: rows.length,
          validRows: events.length,
          sentToKafka: 0,
          rowErrors,
          error: errMsg,
        });
      }

      return res.json({
        success: true,
        uploaderId,
        totalRows: rows.length,
        validRows: enrichedEvents.length,
        sentToKafka: enrichedEvents.length,
        rowErrors: rowErrors.length ? rowErrors : undefined,
      });
    },
  );

  return router;
}

