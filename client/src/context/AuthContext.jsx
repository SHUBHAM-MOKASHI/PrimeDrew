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
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);

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

  // Sync fresh user data from database on mount or token change
  useEffect(() => {
    const fetchMe = async () => {
      const savedToken = token || localStorage.getItem('token') || localStorage.getItem('primedrew_token');
      if (!savedToken) return;
      try {
        const res = await fetch('http://localhost:5000/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${savedToken}` }
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json();
          if (data?.user) {
            updateUser(data.user);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch current user profile:', err);
      }
    };
    fetchMe();
  }, [token]);

  const login = (userData, userToken) => {
    const phoneDigits = userData?.phone?.replace(/\D/g, '') || '';
    const isMasterAdmin = phoneDigits.endsWith('7387861807') || phoneDigits === '7387861807';

    const kyc = isMasterAdmin ? 'verified' : (userData?.kycStatus || userData?.kyc?.status || 'pending');
    const assignedRole = isMasterAdmin ? 'ADMIN' : (userData?.role || 'USER');

    const normalizedUser = {
      ...userData,
      role: assignedRole,
      roles: isMasterAdmin ? ['ADMIN', 'HOST', 'USER'] : (userData?.roles || [assignedRole]),
      hostApplicationStatus: isMasterAdmin ? 'APPROVED' : (userData?.hostApplicationStatus || 'NONE'),
      kycStatus: kyc,
      isKycVerified: isMasterAdmin || userData?.isKycVerified || kyc === 'verified',
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
    if (isMasterAdmin || normalizedUser.role === 'HOST' || normalizedUser.roles?.includes('HOST')) {
      setActiveRole('host');
    } else {
      setActiveRole('renter');
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
      if (!prev) return updatedFields;
      const phoneDigits = (updatedFields.phone || prev.phone)?.replace(/\D/g, '') || '';
      const isMasterAdmin = phoneDigits.endsWith('7387861807') || phoneDigits === '7387861807';

      const kyc = isMasterAdmin ? 'verified' : (updatedFields.kycStatus || updatedFields.kyc?.status || prev.kycStatus || prev.kyc?.status || 'pending');
      const role = isMasterAdmin ? 'ADMIN' : (updatedFields.role || prev.role || 'USER');

      const updated = {
        ...prev,
        ...updatedFields,
        name: updatedFields.name || updatedFields.fullName || prev.name,
        fullName: updatedFields.fullName || updatedFields.name || prev.fullName || prev.name,
        role,
        roles: isMasterAdmin ? ['ADMIN', 'HOST', 'USER'] : (updatedFields.roles || prev.roles || [role]),
        hostApplicationStatus: isMasterAdmin ? 'APPROVED' : (updatedFields.hostApplicationStatus || prev.hostApplicationStatus || 'NONE'),
        hostApplicationDetails: updatedFields.hostApplicationDetails || prev.hostApplicationDetails || {},
        kycStatus: kyc,
        isKycVerified: isMasterAdmin || kyc === 'verified' || updatedFields.isKycVerified || prev.isKycVerified,
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
        isKycVerified: status === 'verified',
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

  const openHostModal = () => {
    setIsHostModalOpen(true);
  };

  const closeHostModal = () => {
    setIsHostModalOpen(false);
  };

  const phoneDigits = user?.phone?.replace(/\D/g, '') || '';
  const isMasterAdmin = phoneDigits.endsWith('7387861807') || phoneDigits === '7387861807';
  const isAdmin = isMasterAdmin || user?.role === 'ADMIN' || user?.role === 'admin' || user?.roles?.includes('ADMIN') || user?.roles?.includes('admin');
  const isHostApproved = isAdmin || user?.role === 'HOST' || user?.role === 'host' || user?.hostApplicationStatus === 'APPROVED' || user?.roles?.includes('HOST') || user?.roles?.includes('host');
  const isHostPending = !isAdmin && !isHostApproved && user?.hostApplicationStatus === 'PENDING';
  const isHostRejected = !isAdmin && !isHostApproved && user?.hostApplicationStatus === 'REJECTED';
  const kycStatus = isMasterAdmin ? 'verified' : (user?.kycStatus || user?.kyc?.status || 'pending');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!user,
        isAuthenticated: !!user,
        activeRole,
        kycStatus,
        isAdmin,
        isMasterAdmin,
        isHostApproved,
        isHostPending,
        isHostRejected,
        isAuthModalOpen,
        authModalTab,
        isKycModalOpen,
        isHostModalOpen,
        login,
        logout,
        updateUser,
        updateKycStatus,
        toggleActiveRole,
        openAuthModal,
        closeAuthModal,
        openKycModal,
        closeKycModal,
        openHostModal,
        closeHostModal,
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
