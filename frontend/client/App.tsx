import { Component, type ReactNode } from 'react';
import { UploadersDashboard } from './components/UploadersDashboard';
import { LoginScreen } from './components/LoginScreen';
import { useAuth } from './context/AuthContext';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-8">
          <div className="rounded-lg border border-rose-500/50 bg-slate-900 p-6 max-w-lg">
            <h1 className="text-lg font-semibold text-rose-300">Something went wrong</h1>
            <pre className="mt-3 overflow-auto text-xs text-slate-400">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { token, loading, email, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/40" />
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">D2C</div>
                <div className="text-sm text-slate-300">Uploader</div>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">
          <LoginScreen />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/40" />
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">D2C</div>
              <div className="text-sm text-slate-300">Uploader</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">{email}</span>
            <button
              type="button"
              onClick={logout}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <UploadersDashboard />
      </main>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

