import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';

function ClientDashboard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Client Nutrition Dashboard</h1>
        <p className="mt-2 text-zinc-400">Daily meal logging and targets will appear here.</p>
      </div>
    </div>
  );
}

function CoachDashboard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Coach Command Center</h1>
        <p className="mt-2 text-zinc-400">Client rosters and nutrition plans will appear here.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes for Clients */}
          <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
            <Route path="/client-dashboard" element={<ClientDashboard />} />
          </Route>

          {/* Protected Routes for Coaches */}
          <Route element={<ProtectedRoute allowedRoles={['COACH']} />}>
            <Route path="/coach-dashboard" element={<CoachDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}