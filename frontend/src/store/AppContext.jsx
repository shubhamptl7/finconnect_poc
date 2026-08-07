import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useNotifications } from '../hooks/useNotifications'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [toasts, setToasts] = useState([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Real data state for Bank Connections
  const [bankConnections, setBankConnections] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [payments, setPayments] = useState([])
  const [beneficiaries, setBeneficiaries] = useState([])

  // Standard API base URL for the backend
  const API_URL = 'http://localhost:3000/api/v1';

  const register = useCallback(async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to register');
    }
    return data;
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (!response.ok) {
      const err = new Error(data.message || 'Login failed');
      err.code = data.errors?.code;
      err.userId = data.errors?.userId;
      throw err;
    }
    setUser(data.data);
    setIsAuthenticated(true);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout error', err);
    }
    setUser(null);
    setIsAuthenticated(false);
    setBankConnections([]); // Clear private data on logout
    setBankAccounts([]);
    setTransactions([]);
    setPayments([]);
    setBeneficiaries([]);
  }, []);

  // --- Bank Connection API Methods ---
  
  const fetchBankConnections = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/bank/connections`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setBankConnections(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch bank connections', err);
    }
  }, [API_URL]);

  const fetchBankAccounts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/bank/accounts`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch bank accounts', err);
    }
  }, [API_URL]);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/bank/transactions`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  }, [API_URL]);

  const syncTransactions = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/bank/sync`, { method: 'POST', credentials: 'include' });
      if (response.ok) {
        await fetchTransactions(); // Refresh transactions after sync
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to sync transactions', err);
      return false;
    }
  }, [API_URL, fetchTransactions]);

  const fetchPayments = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/payments`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPayments(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch payments', err);
    }
  }, [API_URL]);

  // --- Beneficiary API Methods ---

  const fetchBeneficiaries = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/beneficiaries`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setBeneficiaries(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch beneficiaries', err);
    }
  }, [API_URL]);

  const createBeneficiary = useCallback(async (payload) => {
    const response = await fetch(`${API_URL}/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create beneficiary');
    setBeneficiaries(prev => [data.data, ...prev]);
    return data.data;
  }, [API_URL]);

  const updateBeneficiary = useCallback(async (id, payload) => {
    const response = await fetch(`${API_URL}/beneficiaries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update beneficiary');
    setBeneficiaries(prev => prev.map(b => b.id === id ? data.data : b));
    return data.data;
  }, [API_URL]);

  const deleteBeneficiary = useCallback(async (id) => {
    const response = await fetch(`${API_URL}/beneficiaries/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete beneficiary');
    }
    setBeneficiaries(prev => prev.filter(b => b.id !== id));
  }, [API_URL]);

  const initiatePayment = useCallback(async (payload) => {
    const response = await fetch(`${API_URL}/payments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Payment initiation failed');
    }
    return data.data; // { paymentId, linkToken }
  }, [API_URL]);

  const cancelPayment = useCallback(async (paymentId) => {
    try {
      const response = await fetch(`${API_URL}/payments/${paymentId}/cancel`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        fetchPayments(); // Refresh list to show it as cancelled
      }
    } catch (err) {
      console.error('Failed to cancel payment', err);
    }
  }, [API_URL, fetchPayments]);

  // Fetch user session on load
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setUser(data.data);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Session check failed', err);
      } finally {
        setIsInitializing(false);
      }
    }
    checkAuth();
  }, [API_URL]);

  // --- Profile API Methods ---
  const updateProfile = useCallback(async (payload) => {
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update profile');
    setUser(data.data);
    return data.data;
  }, [API_URL]);

  const changePassword = useCallback(async (payload) => {
    const response = await fetch(`${API_URL}/profile/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to change password');
    return data;
  }, [API_URL]);

  // Load bank data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchBankConnections();
      fetchBankAccounts();
      fetchTransactions();
      fetchPayments();
      fetchBeneficiaries();
    }
  }, [isAuthenticated, fetchBankConnections, fetchBankAccounts, fetchTransactions, fetchPayments, fetchBeneficiaries]);

  const addToast = useCallback((toast) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration || 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Setup real-time notifications
  const {
    notifications,
    unreadCount,
    markAsRead: markNotificationRead,
    markAllAsRead: markAllRead
  } = useNotifications(isAuthenticated, API_URL, addToast);

  return (
    <AppContext.Provider value={{
      user, setUser,
      isAuthenticated, login, logout, register, isInitializing,
      notifications, markNotificationRead, markAllRead, unreadCount,
      toasts, addToast, removeToast,
      sidebarCollapsed, setSidebarCollapsed,
      bankConnections, bankAccounts, fetchBankConnections, fetchBankAccounts, API_URL,
      transactions, fetchTransactions, syncTransactions,
      payments, fetchPayments, initiatePayment, cancelPayment,
      beneficiaries, fetchBeneficiaries, createBeneficiary, updateBeneficiary, deleteBeneficiary,
      updateProfile, changePassword,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
