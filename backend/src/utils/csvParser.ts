import { RawRow } from '../uploaders/types.js';

export type ParsedTable = {
  headers: string[];
  rows: RawRow[];
};

function smartSplit(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        // escaped quote
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

export function parseCsv(content: string): ParsedTable {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = smartSplit(lines[0]);
  const headers = rawHeaders.map((h) => h.trim().toLowerCase());

  const rows: RawRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    const cells = smartSplit(line);
    const row: RawRow = {};

    headers.forEach((h, idx) => {
      // allow missing trailing cells
      const value = cells[idx] ?? '';
      row[h] = value;
    });

    rows.push(row);
  }

  return { headers, rows };
}

