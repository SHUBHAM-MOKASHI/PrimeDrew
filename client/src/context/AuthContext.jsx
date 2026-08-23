import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('primedrew_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('primedrew_token') || null);
  const [activeRole, setActiveRole] = useState(() => localStorage.getItem('primedrew_role') || 'renter');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('renter');
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('primedrew_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('primedrew_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('primedrew_token', token);
    } else {
      localStorage.removeItem('primedrew_token');
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('primedrew_role', activeRole);
  }, [activeRole]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    if (userData.roles && userData.roles.length > 0) {
      setActiveRole(userData.roles.includes('host') ? 'host' : 'renter');
    }
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveRole('renter');
    localStorage.removeItem('primedrew_user');
    localStorage.removeItem('primedrew_token');
    localStorage.removeItem('primedrew_role');
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...updatedFields } : prev;
      if (updated) {
        localStorage.setItem('primedrew_user', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const updateKycStatus = (status, extraData = {}) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        kyc: {
          ...(prev.kyc || {}),
          status,
          ...extraData
        }
      };
      localStorage.setItem('primedrew_user', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleActiveRole = () => {
    setActiveRole((prev) => (prev === 'renter' ? 'host' : 'renter'));
  };

  const openAuthModal = (tab = 'renter') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openKycModal = () => {
    setIsKycModalOpen(true);
  };

  const closeKycModal = () => {
    setIsKycModalOpen(false);
  };

  const kycStatus = user?.kyc?.status || 'unverified';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!user,
        isAuthenticated: !!user,
        activeRole,
        kycStatus,
        isAuthModalOpen,
        authModalTab,
        isKycModalOpen,
        login,
        logout,
        updateUser,
        updateKycStatus,
        toggleActiveRole,
        openAuthModal,
        closeAuthModal,
        openKycModal,
        closeKycModal,
        setAuthModalTab
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
