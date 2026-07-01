import React from 'react';
import ReactDOM from 'react-dom/client';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { AppShell } from './components/Layout';
import './index.css';
import { Dashboard } from './pages/Dashboard';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VehicleDetail } from './pages/VehicleDetail';
import { VehicleHistory } from './pages/VehicleHistory';
import { Vehicles } from './pages/Vehicles';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background p-8 font-label text-xs text-muted">BOOTING...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    element: <Protected><AppShell /></Protected>,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/vehicles', element: <Vehicles /> },
      { path: '/vehicles/:vehicleId', element: <VehicleDetail /> },
      { path: '/vehicles/:vehicleId/history', element: <VehicleHistory /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
