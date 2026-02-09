import type { UploadStatus, UploaderInfo } from '../types';
import { FormatSheet } from './FormatSheet';

interface Props {
  status: UploadStatus;
  selectedUploader: UploaderInfo | null;
  onConfirm: (uploaderId: string) => void;
  onReset: () => void;
}

export function UploadSummary({ status, selectedUploader, onConfirm, onReset }: Props) {
  if (!selectedUploader) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 p-6">
        <p className="text-sm text-slate-500">
          Select an uploader to see the required format and upload.
        </p>
      </div>
    );
  }

  const { phase, response } = status;
  const rows = response?.rows ?? [];
  const events = response?.events ?? [];
  const previewData = rows.length > 0 ? rows : events;
  const columnsValid = response?.columnsValid ?? false;
  const missingColumns = response?.missingColumns ?? [];
  const totalRows = response?.totalRows ?? 0;
  const validRows = response?.validRows ?? 0;

  // Idle: show format sheet only
  if (phase === 'idle') {
    return (
      <div className="space-y-6">
        <FormatSheet uploader={selectedUploader} />
      </div>
    );
  }

  // Preview or Success: show upload preview first, then format sheet
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-100">Upload preview</h2>
          <div className="flex items-center gap-2">
            {phase === 'preview' && columnsValid && (
              <button
                type="button"
                onClick={() => onConfirm(selectedUploader.id)}
                disabled={phase === 'sending'}
                className="inline-flex h-8 items-center rounded-md border border-emerald-500/60 bg-emerald-500/20 px-3 text-xs font-medium text-emerald-200 hover:bg-emerald-500/30"
              >
                Submit
              </button>
            )}
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-8 items-center rounded-md border border-slate-700 bg-slate-900 px-3 text-xs font-medium text-slate-200 hover:border-slate-500"
            >
              Clear
            </button>
          </div>
        </div>

        {phase === 'uploading' && <p className="text-sm text-slate-400">Validating…</p>}
        {phase === 'sending' && <p className="text-sm text-slate-400">Sending to data platform…</p>}

        {phase === 'success' && (
          <p className="text-sm text-emerald-300">
            {response?.message || `Sent ${validRows} rows to data platform`}
          </p>
        )}

        {phase === 'error' && (
          <p className="text-sm text-rose-400">
            {response?.error || status.message || 'Upload failed. Ensure the backend is running on port 4000.'}
          </p>
        )}

        {!columnsValid && missingColumns.length > 0 && (
          <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
            <p className="font-medium text-amber-200">Missing required columns:</p>
            <ul className="mt-1 list-disc pl-4 text-amber-100/90">
              {missingColumns.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {previewData.length > 0 && (
          <>
            <p className="mb-2 text-xs text-slate-400">
              {totalRows} rows uploaded (showing first {previewData.length})
            </p>
            <div
              className="overflow-x-auto overflow-y-auto rounded-lg border border-slate-700"
              style={{ maxHeight: '280px' }}
            >
              <table className="border-collapse text-left text-xs" style={{ minWidth: 'max-content' }}>
                <thead className="sticky top-0 z-10 bg-slate-800/95">
                  <tr>
                    {Object.keys(previewData[0] || {}).map((key) => (
                      <th
                        key={key}
                        className="whitespace-nowrap border-b border-r border-slate-600 px-2 py-1.5 font-semibold text-slate-300"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr key={i} className="border-b border-slate-700 bg-slate-900/40">
                      {Object.entries(row).map(([key, val]) => (
                        <td
                          key={key}
                          className="whitespace-nowrap border-r border-slate-700 px-2 py-1.5 text-slate-200"
                        >
                          {val == null ? '' : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {previewData.length === 0 && phase === 'preview' && totalRows === 0 && (
          <p className="text-sm text-slate-500">No data parsed. Check that your file has a header row and data rows.</p>
        )}

        {previewData.length === 0 && phase === 'preview' && totalRows > 0 && (
          <p className="text-sm text-slate-500">{totalRows} rows parsed but no data to display.</p>
        )}
      </div>
      <FormatSheet uploader={selectedUploader} />
    </div>
  );
}
