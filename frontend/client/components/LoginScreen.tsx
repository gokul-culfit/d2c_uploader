import { useState } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function LoginScreen() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    const credential = credentialResponse.credential;
    setError(null);
    if (credential) {
      const ok = await login(credential);
      if (!ok) {
        setError('Access denied. Only @curefit.com and @cultsport.com emails are allowed.');
      }
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-slate-100">D2C Uploader</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in with your @curefit.com or @cultsport.com email
        </p>
      </div>
      {error && (
        <p className="text-sm text-rose-400">{error}</p>
      )}
      {GOOGLE_CLIENT_ID ? (
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {}}
          useOneTap={false}
          theme="filled_black"
          size="large"
        />
      ) : (
        <p className="text-sm text-amber-400">
          VITE_GOOGLE_CLIENT_ID not set. Add it to your .env file.
        </p>
      )}
    </div>
  );
}
