import type { UploaderInfo, UploadStatus } from '../types';

interface Props {
  uploader: UploaderInfo;
  status: UploadStatus;
  onUpload: (uploaderId: string, file: File) => void;
}

export function UploadPanel({ uploader, status, onUpload }: Props) {
  const disabled = status.phase === 'uploading' || status.phase === 'sending';

  const accept = uploader.acceptedFileTypes
    .map((t) => (t === 'csv' ? '.csv' : '.xls,.xlsx'))
    .join(',');

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(uploader.id, file);
    // reset so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-50">{uploader.displayName}</div>
          <p className="mt-1 text-xs text-slate-400">
            Each valid row is transformed and sent to the data platform.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 shadow-sm shadow-emerald-500/30 transition hover:bg-emerald-500/20 hover:text-emerald-100 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-400">
          <input
            type="file"
            className="hidden"
            accept={accept}
            disabled={disabled}
            onChange={handleChange}
          />
          {disabled ? 'Uploading…' : 'Choose file'}
        </label>
        <p className="text-xs text-slate-500">
          Drag &amp; drop into the button or click to browse.
        </p>
      </div>
      {status.phase === 'uploading' && (
        <p className="text-xs text-emerald-300">Validating file…</p>
      )}
    </div>
  );
}

