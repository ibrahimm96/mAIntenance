import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { AuthCard } from './Login';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await register(String(form.get('name')), String(form.get('email')), String(form.get('password')));
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  }

  return <AuthCard title="Create your account" subtitle="Start forecasting vehicle maintenance" submit={submit} error={error} mode="register" />;
}
