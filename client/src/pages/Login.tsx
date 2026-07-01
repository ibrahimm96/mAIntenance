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

  return <AuthCard title="Welcome back" subtitle="Sign in to your maintenance dashboard" submit={submit} error={error} mode="login" />;
}

function AuthCard({ title, subtitle, submit, error, mode }: { title: string; subtitle: string; submit: (event: FormEvent<HTMLFormElement>) => void; error: string; mode: 'login' | 'register' }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <div className="font-display text-3xl font-bold text-primary">mAIntenance</div>
        <h1 className="mt-8 font-display text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-muted">{subtitle}</p>
        {mode === 'register' && <input name="name" className="field mt-6" placeholder="Name" required />}
        <input name="email" className={`field ${mode === 'login' ? 'mt-6' : 'mt-4'}`} type="email" placeholder="Email" required />
        <input name="password" className="field mt-4" type="password" placeholder="Password" required minLength={8} />
        {error && <div className="mt-4 rounded-lg bg-orange-soft p-3 text-sm text-orange">{error}</div>}
        <button className="mt-6 w-full rounded-xl bg-primary px-4 py-3 font-label font-semibold text-white">{mode === 'login' ? 'Log in' : 'Create account'}</button>
        <p className="mt-5 text-center text-sm text-muted">
          {mode === 'login' ? 'Need an account? ' : 'Have an account? '}
          <Link className="font-semibold text-primary" to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Register' : 'Log in'}</Link>
        </p>
      </form>
    </main>
  );
}

export { AuthCard };
