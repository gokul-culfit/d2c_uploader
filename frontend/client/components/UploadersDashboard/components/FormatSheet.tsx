import { useCallback, useState } from 'react';
import type { UploaderInfo } from '../types';

interface Props {
  uploader: UploaderInfo;
}

async function downloadTemplateFile(uploaderId: string, displayName: string): Promise<boolean> {
  const res = await fetch(`/templates/${uploaderId}-format.xlsx`);
  if (!res.ok) return false;
  const blob = await res.blob();
  if (blob.size === 0) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${displayName.replace(/\s+/g, '-')}-format.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

export function FormatSheet({ uploader }: Props) {
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    setError(null);
    const ok = await downloadTemplateFile(uploader.id, uploader.displayName);
    if (!ok) {
      setError('Template not found or empty. Ensure the file exists at public/templates/' + uploader.id + '-format.xlsx');
    }
  }, [uploader.id, uploader.displayName]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-slate-100">
          Format for {uploader.displayName}
        </h2>
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex h-8 items-center rounded-md border border-slate-600 bg-slate-800 px-3 text-xs font-medium text-slate-200 shadow-sm hover:border-slate-500 hover:bg-slate-700"
        >
          Download template
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      <p className="mt-2 text-xs text-slate-400">
        Download the template, fill in your data, then upload.
      </p>
    </div>
  );
}
