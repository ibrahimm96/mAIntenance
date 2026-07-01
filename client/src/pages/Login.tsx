import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await login(String(form.get('email')), String(form.get('password')));
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return <AuthCard title="LOGIN" subtitle="sign in to your maintenance dashboard" submit={submit} error={error} mode="login" />;
}

function AuthCard({ title, subtitle, submit, error, mode }: { title: string; subtitle: string; submit: (event: FormEvent<HTMLFormElement>) => void; error: string; mode: 'login' | 'register' }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={submit} className="card w-full max-w-sm">
        <div className="panel-head">
          <span><span className="dot" />mAIntenance // {title}</span>
        </div>
        <div className="p-6">
          <p className="mb-5 font-label text-xs text-muted">{subtitle}</p>
          {mode === 'register' && (
            <label className="mb-3 block">
              <span className="mb-1 block font-label text-[0.65rem] font-bold uppercase tracking-widest text-muted">name</span>
              <input name="name" className="field" required />
            </label>
          )}
          <label className="mb-3 block">
            <span className="mb-1 block font-label text-[0.65rem] font-bold uppercase tracking-widest text-muted">email</span>
            <input name="email" className="field" type="email" required />
          </label>
          <label className="block">
            <span className="mb-1 block font-label text-[0.65rem] font-bold uppercase tracking-widest text-muted">password</span>
            <input name="password" className="field" type="password" required minLength={8} />
          </label>
          {error && <div className="mt-4 border border-orange bg-orange-soft p-2 text-sm text-orange">{error}</div>}
          <button className="btn btn-solid mt-5 w-full">{mode === 'login' ? 'LOG_IN' : 'CREATE_ACCOUNT'}</button>
          <p className="mt-4 text-center font-label text-xs text-muted">
            {mode === 'login' ? 'need an account? ' : 'have an account? '}
            <Link className="font-bold text-primary-bright" to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'REGISTER' : 'LOG_IN'}</Link>
          </p>
        </div>
      </form>
    </main>
  );
}

export { AuthCard };
