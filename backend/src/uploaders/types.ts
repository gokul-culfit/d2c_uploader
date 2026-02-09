export type RawRow = Record<string, string | number>;

export interface UploaderConfig<Evt> {
  id: string; // "bcase", "pricing", ...
  displayName: string; // e.g. "EBO Business Case"
  acceptedFileTypes: ('csv' | 'excel')[];
  kafkaTopic: string;
  /** Event name for data platform webhook (e.g. ebo_business_case) */
  eventName: string;
  buildKey: (event: Evt) => string;
  validateHeaders: (headers: string[]) => string[]; // missing/invalid headers
  mapRowToEvent: (row: RawRow, rowIndex: number) => Evt | null; // null = skip row
  /** Expected column headers for template download (display order) */
  formatHeaders?: string[];
}

