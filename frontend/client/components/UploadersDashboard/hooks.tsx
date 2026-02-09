import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import type { UploaderInfo, UploadStatus, UploadResponse } from './types';

export function useUploaderList() {
  const [uploaders, setUploaders] = useState<UploaderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UploaderInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await axios.get<UploaderInfo[]>('/api/uploaders');
        if (cancelled) return;
        setUploaders(res.data);
        setSelected((prev) => prev ?? res.data[0] ?? null);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError('Failed to load uploaders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    uploaders,
    loading,
    error,
    selected,
    setSelected,
  };
}

export function useFileUploader() {
  const [status, setStatus] = useState<UploadStatus>({ phase: 'idle' });

  const uploadFile = useCallback(async (uploaderId: string, file: File) => {
    setStatus({ phase: 'uploading', message: 'Validating file…' });

    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axios.post<UploadResponse>(
        `/api/upload/${uploaderId}?preview=1`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setStatus({
        phase: 'preview',
        message: res.data.columnsValid ? 'Validation complete. Review and confirm.' : 'Missing required columns.',
        response: res.data,
        pendingFile: file,
      });
    } catch (e: unknown) {
      const data = (e as { response?: { data?: UploadResponse } })?.response?.data;
      setStatus({
        phase: 'error',
        message: data?.error || 'Upload failed',
        response: data,
      });
    }
  }, []);

  const confirmSend = useCallback(async (uploaderId: string) => {
    const file = status.pendingFile;
    if (!file) return;

    setStatus((prev) => ({ ...prev, phase: 'sending', message: 'Sending to data platform…' }));

    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axios.post<UploadResponse>(`/api/upload/${uploaderId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus({
        phase: 'success',
        message: `Sent ${res.data.sentToKafka} rows to data platform`,
        response: res.data,
      });
    } catch (e: unknown) {
      const data = (e as { response?: { data?: UploadResponse } })?.response?.data;
      setStatus({
        phase: 'error',
        message: data?.error || 'Failed to send',
        response: data,
        pendingFile: file,
      });
    }
  }, [status.pendingFile]);

  const reset = useCallback(() => {
    setStatus({ phase: 'idle' });
  }, []);

  return { status, uploadFile, confirmSend, reset };
}

