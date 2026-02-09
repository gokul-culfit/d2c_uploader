export type AcceptedFileType = 'csv' | 'excel';

export interface UploaderInfo {
  id: string;
  displayName: string;
  acceptedFileTypes: AcceptedFileType[];
  formatHeaders?: string[];
}

export interface UploadResponse {
  success: boolean;
  uploaderId: string;
  totalRows: number;
  validRows: number;
  sentToKafka?: number;
  headerErrors?: string[];
  rowErrors?: string[];
  error?: string;
  /** Preview mode response */
  preview?: boolean;
  columnsValid?: boolean;
  missingColumns?: string[];
  rows?: Record<string, string | number>[]; // raw parsed data
  events?: Record<string, unknown>[];
}

export type UploadPhase = 'idle' | 'uploading' | 'preview' | 'sending' | 'success' | 'error';

export interface UploadStatus {
  phase: UploadPhase;
  message?: string;
  response?: UploadResponse;
  pendingFile?: File;
}

