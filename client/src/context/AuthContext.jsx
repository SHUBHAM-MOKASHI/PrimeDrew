import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user') || localStorage.getItem('primedrew_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || localStorage.getItem('primedrew_token') || null);
  const [activeRole, setActiveRole] = useState(() => localStorage.getItem('primedrew_role') || 'renter');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('renter');
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('primedrew_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('primedrew_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('primedrew_token', token);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('primedrew_token');
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('primedrew_role', activeRole);
  }, [activeRole]);

  const login = (userData, userToken) => {
    const kyc = userData?.kycStatus || userData?.kyc?.status || 'pending';
    const normalizedUser = {
      ...userData,
      kycStatus: kyc,
      kyc: {
        ...(userData?.kyc || {}),
        status: kyc
      }
    };
    setUser(normalizedUser);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    localStorage.setItem('primedrew_user', JSON.stringify(normalizedUser));
    if (userToken) {
      localStorage.setItem('token', userToken);
      localStorage.setItem('primedrew_token', userToken);
    }
    if (userData.roles && userData.roles.length > 0) {
      setActiveRole(userData.roles.includes('host') ? 'host' : 'renter');
    }
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveRole('renter');
    localStorage.removeItem('user');
    localStorage.removeItem('primedrew_user');
    localStorage.removeItem('token');
    localStorage.removeItem('primedrew_token');
    localStorage.removeItem('primedrew_role');
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const kyc = updatedFields.kycStatus || updatedFields.kyc?.status || prev.kycStatus || prev.kyc?.status || 'pending';
      const updated = {
        ...prev,
        ...updatedFields,
        kycStatus: kyc,
        kyc: {
          ...(prev.kyc || {}),
          ...(updatedFields.kyc || {}),
          status: kyc
        }
      };
      localStorage.setItem('user', JSON.stringify(updated));
      localStorage.setItem('primedrew_user', JSON.stringify(updated));
      return updated;
    });
  };

  const updateKycStatus = (status, extraData = {}) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        kycStatus: status,
        kyc: {
          ...(prev.kyc || {}),
          status,
          ...extraData
        },
        kycDetails: {
          ...(prev.kycDetails || {}),
          ...extraData
        }
      };
      localStorage.setItem('user', JSON.stringify(updated));
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

  const kycStatus = user?.kycStatus || user?.kyc?.status || 'pending';

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
