import { UploaderSelector } from './components/UploaderSelector';
import { UploadPanel } from './components/UploadPanel';
import { UploadSummary } from './components/UploadSummary';
import { useUploaderList, useFileUploader } from './hooks';

export function UploadersDashboard() {
  const { uploaders, loading, error, selected, setSelected } = useUploaderList();
  const { status, uploadFile, confirmSend, reset } = useFileUploader();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/40">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-50">
              Upload data
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Upload CSV or Excel files and stream validated rows to the data platform.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex shrink-0 flex-col gap-4 lg:w-80">
            <UploaderSelector
              uploaders={uploaders}
              loading={loading}
              error={error}
              selected={selected}
              onChange={setSelected}
            />
            {selected && (
              <UploadPanel uploader={selected} onUpload={uploadFile} status={status} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <UploadSummary
              status={status}
              selectedUploader={selected}
              onConfirm={confirmSend}
              onReset={reset}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

