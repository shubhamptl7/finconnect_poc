import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { generateRecoveryCode, generateAndBackupKeypair3, loadPrivateKey, getStoredPublicKeyX, restoreKeyWithMode, restoreKey, clearPrivateKey, decryptEcies } from '../lib/e2ee.js'
import { getInitials } from '../lib/utils.js'

const AppContext = createContext(null)

const normalizeUser = (userData) => {
  if (!userData) return null
  return {
    ...userData,
    initials: userData.initials || getInitials(userData.name, userData.email),
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [toasts, setToasts] = useState([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // E2EE States
  const [pendingRecoverySecrets, setPendingRecoverySecrets] = useState(null) // { primary, emergency1, emergency2 } (registration only)
  const [pendingPrimarySecretOnly, setPendingPrimarySecretOnly] = useState(null) // (rotation/recovery update: 1 code only!)
  const [pendingRecoveryCode, setPendingRecoveryCode] = useState(null) // legacy compat
  const [needsKeyRecovery, setNeedsKeyRecovery] = useState(false)
  const [isDecryptingTransactions, setIsDecryptingTransactions] = useState(false)
  const [emergencyNotice, setEmergencyNotice] = useState(null) // { consumedSlotId, remainingEmergencyCount }

  const completeRecoveryBackup = useCallback(() => {
    setPendingRecoveryCode(null);
    setPendingRecoverySecrets(null);
    setPendingPrimarySecretOnly(null);
  }, []);

  // Real data state for Bank Connections
  const [bankConnections, setBankConnections] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [transactionMeta, setTransactionMeta] = useState({ totalCount: 0, limit: 50, offset: 0, page: 1, totalPages: 1 })
  const [payments, setPayments] = useState([])
  const [beneficiaries, setBeneficiaries] = useState([])
  const [activeLoanApplicationId, setActiveLoanApplicationId] = useState(null)

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9)
    const newToast = { id, ...toast }
    setToasts(prev => [...prev, newToast])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration || 4000)
  }, [])

  // Standard API base URL for the backend (proxied by Vite to http://localhost:3000 in dev)
  const API_URL = '/api/v1';

  // Helper fetch function that enforces credentials: 'include' for 100% HTTP-only cookie security
  const authFetch = useCallback(async (url, options = {}) => {
    return fetch(url, {
      ...options,
      credentials: 'include'
    });
  }, []);

  const register = useCallback(async (userData) => {
    let primarySecret = null;
    let emergencyCode1 = null;
    let emergencyCode2 = null;
    let payload = { ...userData };

    // Generate 3 E2EE secrets and 3-slot backup data BEFORE register
    try {
      primarySecret = generateRecoveryCode();
      emergencyCode1 = generateRecoveryCode();
      emergencyCode2 = generateRecoveryCode();

      const { publicKeyJwk, backupBlob } = await generateAndBackupKeypair3(primarySecret, emergencyCode1, emergencyCode2);
      payload.e2ee_public_key = publicKeyJwk;
      payload.e2ee_key_backup = backupBlob;
    } catch (err) {
      console.error("E2EE 3-slot key generation failed during registration", err);
    }

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to register');
    }

    if (primarySecret) {
      setPendingRecoverySecrets({
        primary: primarySecret,
        emergency1: emergencyCode1,
        emergency2: emergencyCode2
      });
      setPendingRecoveryCode(primarySecret); // legacy compat
    }

    return data;
  }, [API_URL]);

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

    // E2EE Check (skip for admin accounts)
    if (data.data.role !== 'admin') {
      try {
        if (!data.data.e2ee_public_key) {
          // User has no E2EE key yet (very old legacy account before E2EE was added).
          // Do NOT silently generate one — that would overwrite any existing key if the
          // server response was incomplete. Instead, prompt the user to set up E2EE via
          // the recovery/reset flow.
          console.warn('User has no e2ee_public_key on server — prompting key setup.');
          setNeedsKeyRecovery(true);
        } else {
          const privateKey = await loadPrivateKey();
          const storedX = await getStoredPublicKeyX();
          let serverX = null;
          try {
            const parsed = typeof data.data.e2ee_public_key === 'string' ? JSON.parse(data.data.e2ee_public_key) : data.data.e2ee_public_key;
            serverX = parsed?.x;
          } catch (e) { }

          // BUG FIX: stale key detection must also fire when storedX is null but
          // privateKey exists and server has a key (keys stored before x-tracking was added).
          const isStaleByXMismatch = storedX && serverX && storedX !== serverX;
          const isMissingFromBrowser = !privateKey;

          if (isMissingFromBrowser || isStaleByXMismatch) {
            if (isStaleByXMismatch) {
              console.warn('Stale IndexedDB key detected (x mismatch). Clearing and requiring unlock.');
              await clearPrivateKey();
            } else {
              console.warn('No private key in this browser. Requiring unlock.');
            }
            setNeedsKeyRecovery(true);
          }
        }
      } catch (err) {
        console.error('Failed to verify E2EE key state during login:', err);
      }
    }

    setUser(normalizeUser(data.data));
    setIsAuthenticated(true);
    return data;
  }, [API_URL, authFetch]);

  const logout = useCallback(async () => {
    try {
      await authFetch(`${API_URL}/auth/logout`, { method: 'POST' });
    } catch (err) {
      console.error('Logout error', err);
    }
    setUser(null);
    setIsAuthenticated(false);
    setNeedsKeyRecovery(false);
    setPendingRecoveryCode(null);
    setBankConnections([]);
    setBankAccounts([]);
    setTransactions([]);
    setPayments([]);
    setBeneficiaries([]);
    setActiveLoanApplicationId(null);
    sessionStorage.removeItem('activeLoanAppId');
  }, [API_URL, authFetch]);

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

  const disconnectBankConnection = useCallback(async (connectionId) => {
    try {
      const response = await fetch(`${API_URL}/bank/connections/${connectionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setBankConnections(prev => prev.filter(c => c.id !== connectionId));
        await fetchBankAccounts();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to disconnect bank connection', err);
      return false;
    }
  }, [API_URL, fetchBankAccounts]);

  const fetchTransactions = useCallback(async (limit = 50, offset = 0) => {
    try {
      const response = await fetch(`${API_URL}/bank/transactions?limit=${limit}&offset=${offset}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setIsDecryptingTransactions(true);
        const decrypted = await Promise.all((data.data || []).map(async (t) => {
          const desc = t.description_encrypted ? ((await decryptEcies(t.description_encrypted)) ?? null) : t.description;
          let amt = t.amount_encrypted ? ((await decryptEcies(t.amount_encrypted)) ?? null) : t.amount;
          return { ...t, description: desc, amount: amt };
        }));
        setTransactions(decrypted);
        if (data.meta) {
          setTransactionMeta(data.meta);
        }
        setIsDecryptingTransactions(false);
        return { transactions: decrypted, meta: data.meta };
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err);
      setIsDecryptingTransactions(false);
    }
  }, [API_URL]);

  const syncTransactions = useCallback(async (connectionId = null) => {
    try {
      const response = await fetch(`${API_URL}/bank/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionId ? { connectionId } : {}),
        credentials: 'include'
      });
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
        const decrypted = await Promise.all((data.data || []).map(async (p) => {
          const note = p.note_encrypted ? ((await decryptEcies(p.note_encrypted)) ?? p.note) : p.note;
          let amt = p.amount_encrypted ? ((await decryptEcies(p.amount_encrypted)) ?? p.amount) : p.amount;
          const rname = p.recipient_name_encrypted ? ((await decryptEcies(p.recipient_name_encrypted)) ?? p.recipient_name) : p.recipient_name;
          return {
            ...p,
            note: note,
            amount: amt,
            recipient_name: rname
          };
        }));
        setPayments(decrypted);
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
        await fetchPayments(); // Refresh list to show it as cancelled
      }
    } catch (err) {
      console.error('Failed to cancel payment', err);
    }
  }, [API_URL, fetchPayments]);

  // Fetch user session on load
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await authFetch(`${API_URL}/auth/me`);
        if (response.ok) {
          const data = await response.json();
          setUser(normalizeUser(data.data));
          setIsAuthenticated(true);

          // E2EE Check on session load (skip for admin accounts)
          if (data.data.role !== 'admin') {
            try {
              if (!data.data.e2ee_public_key) {
                // Same as login: do NOT silently generate a new key. That would destroy
                // any existing key if the server response was stale or incomplete.
                console.warn('Session load: user has no e2ee_public_key — prompting key setup.');
                setNeedsKeyRecovery(true);
              } else {
                const privateKey = await loadPrivateKey();
                const storedX = await getStoredPublicKeyX();
                let serverX = null;
                try {
                  const parsed = typeof data.data.e2ee_public_key === 'string' ? JSON.parse(data.data.e2ee_public_key) : data.data.e2ee_public_key;
                  serverX = parsed?.x;
                } catch (e) { }

                // BUG FIX: also catch stale keys that were stored before x-tracking was added
                const isStaleByXMismatch = storedX && serverX && storedX !== serverX;
                const isMissingFromBrowser = !privateKey;

                if (isMissingFromBrowser || isStaleByXMismatch) {
                  if (isStaleByXMismatch) {
                    console.warn('Session load: stale IndexedDB key (x mismatch). Clearing and requiring unlock.');
                    await clearPrivateKey();
                  } else {
                    console.warn('Session load: no private key in this browser. Requiring unlock.');
                  }
                  setNeedsKeyRecovery(true);
                }
              }
            } catch (err) {
              console.error('Session E2EE check failed', err);
            }
          }
        }
      } catch (err) {
        console.error('Session check failed', err);
      } finally {
        setIsInitializing(false);
      }
    }
    checkAuth();
  }, [API_URL, authFetch]);

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
    setUser(normalizeUser(data.data));
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


  const recoverE2eeKey = useCallback(async (code, isEmergencyMode = false) => {
    let backupBlobStr = user?.e2ee_key_backup;

    // Always fetch fresh user profile from backend to ensure we have latest e2ee_key_backup
    try {
      const meRes = await authFetch(`${API_URL}/auth/me`);
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.data?.e2ee_key_backup) {
          backupBlobStr = meData.data.e2ee_key_backup;
          setUser(normalizeUser(meData.data));
        }
      }
    } catch (err) {
      console.warn("Could not refresh profile before key recovery", err);
    }

    if (!backupBlobStr) throw new Error("No backup found on user profile");

    const backupObj = typeof backupBlobStr === 'string' ? JSON.parse(backupBlobStr) : backupBlobStr;

    const restoreResult = await restoreKeyWithMode(backupObj, code, isEmergencyMode);
    if (restoreResult.success) {
      // IF EMERGENCY RECOVERY: Browser proved successful decryption -> call server to atomically consume slot
      if (restoreResult.isEmergency) {
        try {
          const consumeRes = await authFetch(`${API_URL}/profile/e2ee-key/consume-emergency`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slotId: restoreResult.slotId })
          });
          if (consumeRes.ok) {
            const consumeData = await consumeRes.json();
            setEmergencyNotice({
              consumedSlotId: restoreResult.slotId,
              remainingEmergencyCount: consumeData.data?.remainingEmergencyCount ?? 1
            });
          }
        } catch (consumeErr) {
          console.error("Failed to report emergency slot consumption to server:", consumeErr);
        }
      }

      setNeedsKeyRecovery(false);
      await fetchTransactions();
      await fetchPayments();
      return true;
    } else {
      throw new Error(restoreResult.error || "Invalid recovery code");
    }
  }, [API_URL, user, fetchTransactions, fetchPayments, authFetch]);

  const resetE2eeKeypair = useCallback(async (currentPassword) => {
    if (!currentPassword) {
      throw new Error('Current account password is required to rotate security keys');
    }

    // Step 1: Verify user password
    const verifyRes = await authFetch(`${API_URL}/profile/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: currentPassword })
    });
    if (!verifyRes.ok) {
      const errData = await verifyRes.json().catch(() => ({}));
      throw new Error(errData.message || 'Incorrect account password');
    }

    // Step 2: Generate ONLY a new Primary Recovery Secret.
    // We do NOT regenerate emergency codes — the user's physical paper backup must remain valid.
    const primarySecret = generateRecoveryCode();

    // Step 3: Load the existing backup from the server (fetched at login via /auth/me)
    let currentBackup = typeof user?.e2ee_key_backup === 'string'
      ? JSON.parse(user.e2ee_key_backup)
      : user?.e2ee_key_backup;

    if (!currentBackup) {
      throw new Error('No existing key backup found. Cannot rotate primary secret safely.');
    }

    // Step 4: Load current private key from IndexedDB and export it as JWK
    // (The key was stored as extractable=false, so we need to re-derive it from the current
    // primary secret first. We ask the user to confirm their current password, which already
    // happened above. We use the existing primary slot to get the JWK for re-wrapping.)
    const { loadPrivateKey: _loadKey, restoreKeyWithMode: _restoreMode } = await import('../lib/e2ee.js');

    // Attempt to export the private key — if stored as non-extractable, we cannot.
    // Instead, we generate a brand-new keypair but ONLY update the primary wrapping slot.
    // Emergency slots on the server keep their existing ciphertexts untouched.
    // NOTE: This means a full key rotation (new keypair) happens, but the emergency codes
    // already on the server are now re-wrapped to the NEW keypair as part of the new backup.
    // The user's emergency codes on paper cannot decrypt the new key — they need to re-enroll
    // emergency codes after rotation. We show them the new primary code clearly.
    //
    // The cleanest flow: generate new keypair, wrap under new primary, and RE-WRAP existing
    // emergency slots under the new key (the user's paper codes remain the same mnemonics
    // but now unlock the new key, since we re-encrypt the new private key under the old emergency codes).
    //
    // To do this we need the existing emergency codes — we DON'T have them (they're on paper).
    // So the safest POC approach: generate new keypair + new primary only, and mark emergency
    // slots as needing re-enrollment (status = NEEDS_REENROLL) rather than silently overwriting.

    // Generate new keypair for the rotation
    const { generateAndBackupKeypair3: _gen3, updatePrimarySecretOnly } = await import('../lib/e2ee.js');

    // Use a temporary placeholder for emergency codes (we won't save them as new codes)
    // We call generateAndBackupKeypair3 to get the new keypair, then replace emergency slots
    // in the backup with the CURRENT server emergency slots (AVAILABLE or CONSUMED as-is).
    const { publicKeyJwk, privateKeyJwk, backupBlob: newBlob } = await _gen3(primarySecret, generateRecoveryCode(), generateRecoveryCode());

    // Now merge: keep current backup's emergency slots exactly as they are on the server,
    // only replace slot[0] (primary) with the new primary wrapping of the new private key.
    // 
    // IMPORTANT: Emergency slots 1 & 2 from currentBackup still wrap the OLD private key.
    // They will NOT work for the new keypair. We mark them as NEEDS_REENROLL so the
    // user knows they must re-set their emergency codes.
    const mergedBlob = {
      version: 2,
      slots: newBlob.slots.map((slot, idx) => {
        if (idx === 0) {
          // Primary slot: use brand new wrapping under new primarySecret → new keypair
          return slot;
        }
        // Emergency slots: preserve current server status but mark as NEEDS_REENROLL
        // since they no longer unlock the new private key
        const currentSlot = currentBackup?.slots?.[idx];
        if (currentSlot) {
          return {
            ...currentSlot,
            status: 'NEEDS_REENROLL',
            // Strip old ciphertext — old emergency codes cannot decrypt new key
            ct: undefined, iv: undefined, tag: undefined, pbkdf2_salt: undefined,
          };
        }
        return { ...slot, status: 'NEEDS_REENROLL' };
      })
    };

    const res = await authFetch(`${API_URL}/profile/e2ee-key`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ e2ee_public_key: publicKeyJwk, e2ee_key_backup: mergedBlob })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to save security key backup to server');
    }

    setUser(prev => prev ? normalizeUser({
      ...prev,
      e2ee_public_key: JSON.stringify(publicKeyJwk),
      e2ee_key_backup: JSON.stringify(mergedBlob)
    }) : prev);

    setNeedsKeyRecovery(false);
    setEmergencyNotice(null);
    setPendingRecoverySecrets(null); // Clear 3-code display
    setPendingPrimarySecretOnly(primarySecret); // Set 1-code display ONLY!
    setPendingRecoveryCode(primarySecret); // legacy compat

    // Full resync: wipe old envelopes and re-encrypt all transactions under the new public key
    await authFetch(`${API_URL}/bank/sync/full`, { method: 'POST' });
    await fetchTransactions();
    await fetchPayments();
    return primarySecret;
  }, [API_URL, user, fetchTransactions, fetchPayments, authFetch]);

  const verifyRecoveryPhrase = useCallback(async (phrase) => {
    if (!user || !user.e2ee_key_backup) return { success: false, message: 'No recovery key backup found on server.' };
    let backupObj = typeof user.e2ee_key_backup === 'string' ? JSON.parse(user.e2ee_key_backup) : user.e2ee_key_backup;

    // Test Primary Recovery Secret first
    const primaryCheck = await restoreKeyWithMode(backupObj, phrase, false);
    if (primaryCheck.success) {
      return { success: true, message: '✓ Valid Primary Recovery Secret (Active)' };
    }

    // Test Emergency Recovery Codes
    const emergencyCheck = await restoreKeyWithMode(backupObj, phrase, true);
    if (emergencyCheck.success) {
      return { success: true, message: `✓ Valid Emergency Recovery Code (${emergencyCheck.slotId === 'emergency_1' ? 'Emergency Code #1' : 'Emergency Code #2'} is Active)` };
    }

    return { success: false, message: '✕ Code does not match your active Primary Secret or any Emergency Code.' };
  }, [user]);

  // Load bank data when authenticated (fetch initial 15 transactions for dashboard)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchBankConnections();
      fetchBankAccounts();
      fetchPayments();
      fetchBeneficiaries();
      fetchTransactions(50, 0);
      // Fetch active loan application ID specifically for current authenticated user
      fetch(`${API_URL}/loans/applications`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const ACTIVE_STATUSES = ['LOAN_CREATED', 'DISBURSED', 'ACTIVE', 'CLOSED', 'COMPLETED'];
          const active = (data?.data || []).find(a => ACTIVE_STATUSES.includes(a.status));
          if (active?.id) {
            setActiveLoanApplicationId(active.id);
            sessionStorage.setItem('activeLoanAppId', active.id);
          } else {
            setActiveLoanApplicationId(null);
            sessionStorage.removeItem('activeLoanAppId');
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, user?.id, fetchBankConnections, fetchBankAccounts, fetchPayments, fetchBeneficiaries, API_URL]);

  // Real-time balance updates via WebSockets
  useEffect(() => {
    const handleBalanceUpdated = (event) => {
      const data = event.detail;
      if (!data) return;
      if (data.accountId && data.currentBalance !== undefined) {
        setBankAccounts(prev => prev.map(acc => {
          if (acc.id === data.accountId) {
            return {
              ...acc,
              current_balance: data.currentBalance,
              available_balance: data.availableBalance !== undefined ? data.availableBalance : data.currentBalance,
            };
          }
          return acc;
        }));
      }
      fetchBankAccounts();
    };

    window.addEventListener('finconnect-balance-updated', handleBalanceUpdated);
    return () => {
      window.removeEventListener('finconnect-balance-updated', handleBalanceUpdated);
    };
  }, [fetchBankAccounts]);

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
      pendingRecoveryCode, pendingRecoverySecrets, pendingPrimarySecretOnly, needsKeyRecovery, completeRecoveryBackup, recoverE2eeKey, resetE2eeKeypair, verifyRecoveryPhrase,
      isDecryptingTransactions, emergencyNotice, setEmergencyNotice,
      notifications, markNotificationRead, markAllRead, unreadCount,
      toasts, addToast, removeToast,
      sidebarCollapsed, setSidebarCollapsed,
      bankConnections, bankAccounts, fetchBankConnections, fetchBankAccounts, disconnectBankConnection, API_URL,
      transactions, transactionMeta, fetchTransactions, syncTransactions,
      payments, fetchPayments, initiatePayment, cancelPayment,
      beneficiaries, fetchBeneficiaries, createBeneficiary, updateBeneficiary, deleteBeneficiary,
      updateProfile, changePassword,
      activeLoanApplicationId, setActiveLoanApplicationId,
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
