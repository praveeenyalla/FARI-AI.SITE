import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';

// This is the root component of the application.
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthWrapper />
      </AuthProvider>
    </ThemeProvider>
  );
}

const AuthWrapper: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Render a loading spinner while checking for an active session
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-[#0F1015]">
            <div className="w-16 h-16 border-4 border-slate-600 border-t-pink-500 rounded-full animate-spin"></div>
        </div>
    );
  }

  return user ? <Layout /> : <LoginPage />;
}


export default App;