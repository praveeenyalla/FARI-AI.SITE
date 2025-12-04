import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface User {
  name: string;
  plan: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user?: Partial<User>) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: Omit<User, 'avatar'> = {
  name: 'YALLANAGAPRAVEEN',
  plan: 'Pro Plan',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user session on initial load
    try {
      const savedUser = localStorage.getItem('chatnlp-user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('chatnlp-user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userToLogin?: Partial<User>) => {
    // Use the functional update form of useState to avoid potential stale state issues.
    setUser(prevUser => {
      // If there was no previous user, start with the mock user. Otherwise, start with the previous user.
      const base = prevUser || MOCK_USER;
      
      // Merge the base user with the new details provided.
      const updatedUser = { ...base, ...userToLogin };
      
      // Ensure the 'plan' is always set from MOCK_USER as a safeguard, matching the original logic's intent.
      updatedUser.plan = MOCK_USER.plan;

      // We can be confident the result is a valid User object.
      const finalUser = updatedUser as User;
      
      // Save the updated user session to localStorage.
      localStorage.setItem('chatnlp-user', JSON.stringify(finalUser));
      
      return finalUser;
    });
  };

  const logout = () => {
    localStorage.removeItem('chatnlp-user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
