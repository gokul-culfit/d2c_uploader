import type { UploaderInfo } from '../types';

interface Props {
  uploaders: UploaderInfo[];
  loading: boolean;
  error: string | null;
  selected: UploaderInfo | null;
  onChange: (uploader: UploaderInfo | null) => void;
}

export function UploaderSelector({ uploaders, loading, error, selected, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
        Uploader
      </label>
      <div className="relative">
        <select
          className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-50 outline-none ring-emerald-500/60 transition focus:border-emerald-500 focus:ring-2"
          disabled={loading || !!error || uploaders.length === 0}
          value={selected?.id ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            const u = uploaders.find((x) => x.id === value) ?? null;
            onChange(u);
          }}
        >
          {loading && <option>Loading…</option>}
          {!loading && uploaders.length === 0 && <option>No uploaders available</option>}
          {!loading &&
            uploaders.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName}
              </option>
            ))}
        </select>
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {selected && (
        <p className="text-xs text-slate-400">
          Accepts:{' '}
          {selected.acceptedFileTypes
            .map((t) => (t === 'csv' ? 'CSV' : 'Excel (XLSX)'))
            .join(', ')}
        </p>
      )}
    </div>
  );
}

