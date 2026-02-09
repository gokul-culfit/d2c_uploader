import xlsx from 'xlsx';
import { RawRow } from '../uploaders/types.js';

export type ParsedTable = {
  headers: string[];
  rows: RawRow[];
};

export function parseExcel(buffer: Buffer): ParsedTable {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const json: Record<string, unknown>[] = xlsx.utils.sheet_to_json(sheet, {
    defval: '',
  });

  if (json.length === 0) {
    return { headers: [], rows: [] };
  }

  const firstRow = json[0];
  const headers = Object.keys(firstRow).map((h) => h.trim().toLowerCase());

  const rows: RawRow[] = json.map((obj) => {
    const row: RawRow = {};
    Object.entries(obj).forEach(([key, value]) => {
      const normalizedKey = key.trim().toLowerCase();
      row[normalizedKey] = value as string | number;
    });
    return row;
  });

  return { headers, rows };
}

